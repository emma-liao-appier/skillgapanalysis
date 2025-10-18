import { Request, Response } from 'express';
import { Assessment, IAssessment } from '../models/Assessment';
import { User } from '../models/User';
import { GeminiService } from '../services/geminiService';
import { config } from '../config/environment';

// Import predefined skills from frontend
const PREDEFINED_SKILLS = [
  {
    category: 'problem_solving',
    skills: [
      { name: 'Critical Thinking', description: 'Ability to analyze problems and make sound decisions' },
      { name: 'Problem Solving', description: 'Skill in identifying and resolving complex issues' },
      { name: 'Analytical Skills', description: 'Capability to break down complex information' }
    ]
  },
  {
    category: 'communication',
    skills: [
      { name: 'Verbal Communication', description: 'Effective speaking and presentation skills' },
      { name: 'Written Communication', description: 'Clear and professional writing abilities' },
      { name: 'Active Listening', description: 'Ability to understand and respond to others effectively' }
    ]
  },
  {
    category: 'ai_capability',
    skills: [
      { name: 'AI Literacy', description: 'Understanding of AI concepts and applications' },
      { name: 'Prompt Engineering', description: 'Skill in crafting effective AI prompts' },
      { name: 'AI Tools Usage', description: 'Proficiency with AI-powered tools and platforms' }
    ]
  },
  {
    category: 'leadership',
    skills: [
      { name: 'Team Leadership', description: 'Ability to guide and inspire team members' },
      { name: 'Strategic Thinking', description: 'Capability to plan and execute long-term strategies' },
      { name: 'Decision Making', description: 'Skill in making informed and timely decisions' }
    ]
  }
];

export class AssessmentController {
  private geminiService: GeminiService;

  constructor() {
    this.geminiService = new GeminiService(config.geminiApiKey, PREDEFINED_SKILLS);
  }

  // Create a new assessment
  createAssessment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, ...assessmentData } = req.body;

      // Verify user exists
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const assessment = new Assessment({
        userId,
        keyResults: assessmentData.keyResults || '',
        ...assessmentData,
        userEmail: user.email
      });

      const savedAssessment = await assessment.save();

      // Add assessment to user's assessments array
      await User.findByIdAndUpdate(userId, {
        $push: { assessments: savedAssessment._id }
      });

      res.status(201).json(savedAssessment);
    } catch (error) {
      console.error('Error creating assessment:', error);
      res.status(500).json({ 
        error: 'Failed to create assessment',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Get assessment by ID
  getAssessment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const assessment = await Assessment.findById(id).populate('userId', 'name email');

      if (!assessment) {
        res.status(404).json({ error: 'Assessment not found' });
        return;
      }

      res.json(assessment);
    } catch (error) {
      console.error('Error fetching assessment:', error);
      res.status(500).json({ error: 'Failed to fetch assessment' });
    }
  };

  // Update assessment
  updateAssessment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const assessment = await Assessment.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!assessment) {
        res.status(404).json({ error: 'Assessment not found' });
        return;
      }

      res.json(assessment);
    } catch (error) {
      console.error('Error updating assessment:', error);
      res.status(500).json({ error: 'Failed to update assessment' });
    }
  };

  // Delete assessment
  deleteAssessment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      const assessment = await Assessment.findById(id);
      if (!assessment) {
        res.status(404).json({ error: 'Assessment not found' });
        return;
      }

      // Remove assessment from user's assessments array
      await User.findByIdAndUpdate(assessment.userId, {
        $pull: { assessments: assessment._id }
      });

      await Assessment.findByIdAndDelete(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting assessment:', error);
      res.status(500).json({ error: 'Failed to delete assessment' });
    }
  };

  // Get all assessments for a user
  getUserAssessments = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const assessments = await Assessment.find({ userId }).sort({ createdAt: -1 });

      res.json(assessments);
    } catch (error) {
      console.error('Error fetching user assessments:', error);
      res.status(500).json({ error: 'Failed to fetch assessments' });
    }
  };

  // Generate business skills
  generateBusinessSkills = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { role, businessGoal, keyResults } = req.body;

      const skills = await this.geminiService.generateBusinessSkills(role, businessGoal, keyResults);

      // Update assessment with generated skills
      const assessment = await Assessment.findByIdAndUpdate(
        id,
        { businessSkills: skills },
        { new: true }
      );

      if (!assessment) {
        res.status(404).json({ error: 'Assessment not found' });
        return;
      }

      res.json({ skills, assessment });
    } catch (error) {
      console.error('Error generating business skills:', error);
      res.status(500).json({ error: 'Failed to generate business skills' });
    }
  };

  // Generate career skills
  generateCareerSkills = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { role, careerGoal, peerFeedback } = req.body;

      // 獲取通用技能目錄
      const { Skill } = await import('../models/Skill');
      const generalSkills = await Skill.find({
        type: 'general', // 使用字串而不是 enum
        isActive: true
      }).limit(20);

      // 獲取現有的功能性技能用於去重
      const existingFunctionalSkills = await Skill.find({
        type: 'functional', // 使用字串而不是 enum
        isActive: true
      });

      // 將 generalSkills 轉換為 GeminiService 期望的格式
      const formattedGeneralSkills = generalSkills.map(skill => ({
        category: skill.category,
        skills: [{
          name: skill.name,
          description: skill.description
        }]
      }));

      // 創建新的 GeminiService 實例，傳入從資料庫獲取的技能
      const { GeminiService } = await import('../services/geminiService');
      const geminiService = new GeminiService(
        process.env.GEMINI_API_KEY || '',
        formattedGeneralSkills
      );

      // 設置現有的功能性技能用於去重檢測
      geminiService.setExistingFunctionalSkills(existingFunctionalSkills);

      const result = await geminiService.generateCareerIntroAndSkills(role, careerGoal, peerFeedback);

      // Check if this is a temporary ID (starts with 'temp-')
      if (id.startsWith('temp-')) {
        // For temporary IDs, just return the generated content without saving to database
      res.json({ 
        skills: result.skills, 
        intro: result.intro,
        alignment: result.alignment,
        skillThemes: result.skillThemes,
        message: 'Career skills generated successfully (temporary assessment)'
      });
        return;
      }

      // For real assessment IDs, update the assessment in database
      const assessment = await Assessment.findByIdAndUpdate(
        id,
        { 
          careerSkills: result.skills,
          careerIntro: result.intro
        },
        { new: true }
      );

      if (!assessment) {
        res.status(404).json({ error: 'Assessment not found' });
        return;
      }

      res.json({ 
        skills: result.skills, 
        intro: result.intro, 
        assessment 
      });
    } catch (error) {
      console.error('Error generating career skills:', error);
      res.status(500).json({ error: 'Failed to generate career skills' });
    }
  };

  // Generate key results
  generateKeyResults = async (req: Request, res: Response): Promise<void> => {
    try {
      const { role, businessGoal } = req.body;
      const keyResults = await this.geminiService.generateKeyResults(role, businessGoal);

      res.json({ keyResults });
    } catch (error) {
      console.error('Error generating key results:', error);
      res.status(500).json({ error: 'Failed to generate key results' });
    }
  };

  // Generate summary
  generateSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      // Check if this is a temporary ID (starts with 'temp-')
      if (id.startsWith('temp-')) {
        // For temporary IDs, generate a basic summary without database lookup
        const mockAssessment = {
          businessSkills: [],
          careerSkills: [],
          businessGoal: 'Sample business goal',
          careerGoal: 'Sample career goal'
        };
        
        const summary = await this.geminiService.generateSummary(mockAssessment);
        
        res.json({ 
          summary,
          message: 'Summary generated successfully (temporary assessment)'
        });
        return;
      }

      const assessment = await Assessment.findById(id);

      if (!assessment) {
        res.status(404).json({ error: 'Assessment not found' });
        return;
      }

      const summary = await this.geminiService.generateSummary(assessment);

      // Update assessment with summary
      const updatedAssessment = await Assessment.findByIdAndUpdate(
        id,
        { summary },
        { new: true }
      );

      res.json({ summary, assessment: updatedAssessment });
    } catch (error) {
      console.error('Error generating summary:', error);
      res.status(500).json({ error: 'Failed to generate summary' });
    }
  };

  // Optimize text
  optimizeText = async (req: Request, res: Response): Promise<void> => {
    try {
      const { text } = req.body;
      
      if (!text) {
        res.status(400).json({ error: 'Text is required' });
        return;
      }

      const optimizedText = await this.geminiService.optimizeText(text);
      res.json({ optimizedText });
    } catch (error) {
      console.error('Error optimizing text:', error);
      res.status(500).json({ error: 'Failed to optimize text' });
    }
  };

  // Optimize business goal
  optimizeBusinessGoal = async (req: Request, res: Response): Promise<void> => {
    try {
      const { role, businessGoal } = req.body;
      
      if (!role || !businessGoal) {
        res.status(400).json({ error: 'Role and business goal are required' });
        return;
      }

      const optimizedGoal = await this.geminiService.optimizeBusinessGoal(role, businessGoal);
      res.json({ optimizedGoal });
    } catch (error) {
      console.error('Error optimizing business goal:', error);
      res.status(500).json({ error: 'Failed to optimize business goal' });
    }
  };
}
