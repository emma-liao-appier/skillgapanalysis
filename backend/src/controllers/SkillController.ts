import { Request, Response } from 'express';
import { Skill, SkillCategory, SkillType } from '../models/Skill';
import { UserSkillAssessment, ISkillAssessment, IPeerFeedback, SkillRelevance } from '../models/UserSkillAssessment';
import { User } from '../models/User';
import { SkillAssessmentService } from '../services/skillAssessmentService';

export class SkillController {
  
  // 獲取技能目錄 (用於AI推薦)
  getSkillCatalogue = async (req: Request, res: Response): Promise<void> => {
    try {
      const { category, type, division, department } = req.query;
      
      const query: any = { isActive: true };
      
      if (category) query.category = category;
      if (type) query.type = type;
      if (division) query.division = division;
      if (department) query.department = department;
      
      const skills = await Skill.find(query).sort({ category: 1, name: 1 });
      
      res.json({
        skills,
        total: skills.length,
        filters: { category, type, division, department }
      });
    } catch (error) {
      console.error('Error fetching skill catalogue:', error);
      res.status(500).json({ error: 'Failed to fetch skill catalogue' });
    }
  };

  // AI 推薦技能給用戶
  recommendSkills = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.params;
      const { businessGoal, keyResults } = req.body;
      
      // 獲取用戶信息
      const user = await User.findOne({ email });
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // 獲取通用技能目錄
      const generalSkills = await Skill.find({
        type: 'general', // 使用字串而不是 enum
        isActive: true,
        $or: [
          { division: 'General' },
          { department: 'General' },
          { division: user.division },
          { department: user.department }
        ]
      }).limit(20); // 獲取更多選項供AI選擇

      // 獲取現有的功能性技能用於去重
      const existingFunctionalSkills = await Skill.find({
        type: 'functional', // 使用字串而不是 enum
        isActive: true
      });

      // 如果沒有 Gemini API key，直接從資料庫返回技能
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
        // 直接返回前 3 個通用技能和前 2 個功能性技能
        const selectedGeneralSkills = generalSkills.slice(0, 3).map(skill => ({
          id: skill.skillId,
          name: skill.name,
          description: skill.description,
          category: skill.category,
          rating: 0,
          type: 'general',
          isRecommended: true,
          recommendedAt: new Date()
        }));

        // 如果沒有功能性技能，創建一些示例的
        let selectedFunctionalSkills = [];
        if (existingFunctionalSkills.length > 0) {
          selectedFunctionalSkills = existingFunctionalSkills.slice(0, 2).map(skill => ({
            id: skill.skillId,
            name: skill.name,
            description: skill.description,
            category: skill.category,
            rating: 0,
            type: 'functional',
            isRecommended: true,
            recommendedAt: new Date()
          }));
        } else {
          // 創建示例功能性技能
          selectedFunctionalSkills = [
            {
              id: `functional-${Date.now()}-1`,
              name: 'Advanced Data Analysis',
              description: 'Ability to analyze complex datasets and derive actionable insights',
              category: 'functional',
              rating: 0,
              type: 'functional',
              isRecommended: true,
              recommendedAt: new Date()
            },
            {
              id: `functional-${Date.now()}-2`,
              name: 'Project Management Excellence',
              description: 'Skills in leading cross-functional projects and delivering results on time',
              category: 'functional',
              rating: 0,
              type: 'functional',
              isRecommended: true,
              recommendedAt: new Date()
            }
          ];
        }

        const allSkills = [...selectedGeneralSkills, ...selectedFunctionalSkills];

        res.json({
          skills: allSkills,
          total: allSkills.length,
          generalSkillsCount: selectedGeneralSkills.length,
          functionalSkillsCount: selectedFunctionalSkills.length,
          message: 'Skills recommended successfully (from database)'
        });
        return;
      }

      // 將 generalSkills 轉換為 GeminiService 期望的格式
      const formattedGeneralSkills = generalSkills.map(skill => ({
        category: skill.category,
        skills: [{
          name: skill.name,
          description: skill.description
        }]
      }));

      // 使用 GeminiService 進行 AI 推薦
      const { GeminiService } = await import('../services/geminiService');
      const geminiService = new GeminiService(
        process.env.GEMINI_API_KEY || '',
        formattedGeneralSkills // 傳入格式化後的通用技能
      );
      
      // 設置現有的功能性技能用於去重檢測
      geminiService.setExistingFunctionalSkills(existingFunctionalSkills);

      // 生成技能推薦
      const recommendedSkills = await geminiService.generateBusinessSkills(
        user.role || '',
        businessGoal,
        keyResults
      );

      // 將推薦的技能格式化為前端需要的格式
      const formattedSkills = recommendedSkills.map(skill => ({
        skillId: skill.skillId || `skill-${Date.now()}-${Math.random()}`,
        name: skill.name,
        description: skill.description,
        category: skill.category,
        rating: skill.rating,
        type: skill.category === 'functional' ? SkillType.Functional : SkillType.General,
        isRecommended: true,
        recommendedAt: new Date()
      }));

      res.json({
        skills: formattedSkills,
        total: formattedSkills.length,
        generalSkillsCount: formattedSkills.filter(s => s.type === SkillType.General).length,
        functionalSkillsCount: formattedSkills.filter(s => s.type === SkillType.Functional).length,
        message: 'Skills recommended successfully'
      });
    } catch (error) {
      console.error('Error recommending skills:', error);
      res.status(500).json({ error: 'Failed to recommend skills' });
    }
  };

  // 用戶接受推薦的技能
  acceptRecommendedSkills = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.params;
      const { skills } = req.body; // 包含用戶選擇的技能和評分
      
      const user = await User.findOne({ email });
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // 創建或更新用戶技能評估記錄
      let userSkillAssessment = await UserSkillAssessment.findOne({ userId: user._id });
      
      if (!userSkillAssessment) {
        userSkillAssessment = new UserSkillAssessment({
          userId: user._id,
          skills: []
        });
      }

      // 處理推薦的技能
      const newSkillAssessments: ISkillAssessment[] = skills.map((skill: any) => ({
        skillId: skill.skillId || `generated_${Date.now()}_${Math.random()}`,
        name: skill.name,
        description: skill.description,
        category: skill.category,
        type: skill.type,
        relevance: skill.relevance || SkillRelevance.Both, // 默認為 Both
        
        // 根據 relevance 設置評分
        businessRating: (skill.relevance === SkillRelevance.Business || skill.relevance === SkillRelevance.Both) 
          ? skill.businessRating || skill.rating || 1 
          : undefined,
        businessConfidence: (skill.relevance === SkillRelevance.Business || skill.relevance === SkillRelevance.Both) 
          ? skill.businessConfidence || 3 
          : undefined,
        
        careerRating: (skill.relevance === SkillRelevance.Career || skill.relevance === SkillRelevance.Both) 
          ? skill.careerRating || skill.rating || 1 
          : undefined,
        careerConfidence: (skill.relevance === SkillRelevance.Career || skill.relevance === SkillRelevance.Both) 
          ? skill.careerConfidence || 3 
          : undefined,
        
        peerFeedbacks: [],
        finalBusinessRating: undefined, // 將在計算時設置
        finalCareerRating: undefined,   // 將在計算時設置
        
        isRecommended: true,
        recommendedAt: new Date(),
        lastAssessedAt: new Date()
      }));

      // 計算最終評分
      const assessedSkills = newSkillAssessments.map(skill => 
        SkillAssessmentService.calculateFinalRatings(skill)
      );

      // 更新記錄
      userSkillAssessment.skills.push(...assessedSkills);
      userSkillAssessment.lastUpdated = new Date();

      await userSkillAssessment.save();

      res.json({
        message: 'Skills accepted successfully',
        skillsAdded: assessedSkills.length,
        summary: SkillAssessmentService.getSkillAssessmentSummary(userSkillAssessment.skills)
      });
    } catch (error) {
      console.error('Error accepting recommended skills:', error);
      res.status(500).json({ error: 'Failed to accept recommended skills' });
    }
  };

  // 獲取用戶的技能評估
  getUserSkillAssessment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.params;
      
      const user = await User.findOne({ email });
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const userSkillAssessment = await UserSkillAssessment.findOne({ userId: user._id });
      
      if (!userSkillAssessment) {
        res.json({
          skills: [],
          summary: {
            totalSkills: 0,
            businessSkills: 0,
            careerSkills: 0,
            bothSkills: 0,
            averageBusinessRating: 0,
            averageCareerRating: 0,
            skillsWithPeerFeedback: 0
          },
          message: 'No skill assessment found for this user'
        });
        return;
      }

      // 重新計算最終評分 (以防有新的同儕反饋)
      const updatedSkills = userSkillAssessment.skills.map(skill => 
        SkillAssessmentService.calculateFinalRatings(skill)
      );

      const summary = SkillAssessmentService.getSkillAssessmentSummary(updatedSkills);
      const groupedSkills = SkillAssessmentService.groupSkillsByCategory(updatedSkills);
      const recommendations = SkillAssessmentService.getSkillDevelopmentRecommendations(updatedSkills);

      res.json({
        skills: updatedSkills,
        summary,
        groupedSkills,
        recommendations
      });
    } catch (error) {
      console.error('Error fetching user skill assessment:', error);
      res.status(500).json({ error: 'Failed to fetch user skill assessment' });
    }
  };

  // 更新技能評分
  updateSkillRating = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.params;
      const { skillId, businessRating, careerRating, businessConfidence, careerConfidence } = req.body;
      
      const user = await User.findOne({ email });
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const userSkillAssessment = await UserSkillAssessment.findOne({ userId: user._id });
      if (!userSkillAssessment) {
        res.status(404).json({ error: 'User skill assessment not found' });
        return;
      }

      // 更新技能評分
      const skillIndex = userSkillAssessment.skills.findIndex(s => s.skillId === skillId);
      if (skillIndex === -1) {
        res.status(404).json({ error: 'Skill not found in user assessment' });
        return;
      }

      // 更新評分
      if (businessRating !== undefined) {
        userSkillAssessment.skills[skillIndex].businessRating = businessRating;
      }
      if (careerRating !== undefined) {
        userSkillAssessment.skills[skillIndex].careerRating = careerRating;
      }
      if (businessConfidence !== undefined) {
        userSkillAssessment.skills[skillIndex].businessConfidence = businessConfidence;
      }
      if (careerConfidence !== undefined) {
        userSkillAssessment.skills[skillIndex].careerConfidence = careerConfidence;
      }

      userSkillAssessment.skills[skillIndex].lastAssessedAt = new Date();

      // 重新計算最終評分
      userSkillAssessment.skills[skillIndex] = SkillAssessmentService.calculateFinalRatings(
        userSkillAssessment.skills[skillIndex]
      );

      userSkillAssessment.lastUpdated = new Date();
      await userSkillAssessment.save();

      res.json({
        message: 'Skill rating updated successfully',
        skill: userSkillAssessment.skills[skillIndex]
      });
    } catch (error) {
      console.error('Error updating skill rating:', error);
      res.status(500).json({ error: 'Failed to update skill rating' });
    }
  };

  // 添加同儕反饋
  addPeerFeedback = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.params;
      const { skillId, peerEmail, peerName, businessRating, careerRating, feedback, relationship, isAnonymous } = req.body;
      
      const user = await User.findOne({ email });
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const userSkillAssessment = await UserSkillAssessment.findOne({ userId: user._id });
      if (!userSkillAssessment) {
        res.status(404).json({ error: 'User skill assessment not found' });
        return;
      }

      // 找到技能
      const skillIndex = userSkillAssessment.skills.findIndex(s => s.skillId === skillId);
      if (skillIndex === -1) {
        res.status(404).json({ error: 'Skill not found in user assessment' });
        return;
      }

      // 檢查是否已經有來自這個同儕的反饋
      const existingFeedbackIndex = userSkillAssessment.skills[skillIndex].peerFeedbacks.findIndex(
        pf => pf.peerEmail === peerEmail
      );

      const newFeedback: IPeerFeedback = {
        peerEmail,
        peerName,
        businessRating,
        careerRating,
        feedback,
        relationship,
        isAnonymous: isAnonymous || false,
        submittedAt: new Date()
      };

      if (existingFeedbackIndex >= 0) {
        // 更新現有反饋
        userSkillAssessment.skills[skillIndex].peerFeedbacks[existingFeedbackIndex] = newFeedback;
      } else {
        // 添加新反饋
        userSkillAssessment.skills[skillIndex].peerFeedbacks.push(newFeedback);
      }

      // 重新計算最終評分
      userSkillAssessment.skills[skillIndex] = SkillAssessmentService.calculateFinalRatings(
        userSkillAssessment.skills[skillIndex]
      );

      userSkillAssessment.lastUpdated = new Date();
      await userSkillAssessment.save();

      res.json({
        message: 'Peer feedback added successfully',
        skill: userSkillAssessment.skills[skillIndex]
      });
    } catch (error) {
      console.error('Error adding peer feedback:', error);
      res.status(500).json({ error: 'Failed to add peer feedback' });
    }
  };

  // 獲取技能目錄供 Add Skill 功能使用
  getSkillsForAddSkill = async (req: Request, res: Response): Promise<void> => {
    try {
      const { category, search } = req.query;
      
      let query: any = { isActive: true };
      
      // 如果指定了類別，只返回該類別的技能
      if (category) {
        query.category = category;
      }
      
      // 如果有搜尋關鍵字
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      
      const skills = await Skill.find(query)
        .sort({ category: 1, name: 1 })
        .limit(50); // 限制結果數量
      
      // 按類別分組
      const groupedSkills = skills.reduce((acc: any, skill: any) => {
        if (!acc[skill.category]) {
          acc[skill.category] = [];
        }
        acc[skill.category].push({
          skillId: skill.skillId,
          name: skill.name,
          description: skill.description,
          skillBenefit: skill.skillBenefit,
          category: skill.category,
          type: skill.type
        });
        return acc;
      }, {});
      
      res.json({
        skills: groupedSkills,
        total: skills.length,
        categories: Object.keys(groupedSkills)
      });
    } catch (error) {
      console.error('Error fetching skills for add skill:', error);
      res.status(500).json({ error: 'Failed to fetch skills' });
    }
  };

  // 創建新技能 (用於AI生成的功能性技能)
  createSkill = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, description, skillBenefit, category, type, division, department } = req.body;
      
      const skillId = `skill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const skill = new Skill({
        skillId,
        name,
        description,
        skillBenefit,
        category,
        type,
        division,
        department,
        isActive: true
      });

      const savedSkill = await skill.save();
      res.status(201).json(savedSkill);
    } catch (error) {
      console.error('Error creating skill:', error);
      res.status(500).json({ error: 'Failed to create skill' });
    }
  };
}
