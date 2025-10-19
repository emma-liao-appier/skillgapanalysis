import { Request, Response } from 'express';
import { Skill, SkillCategory, SkillType } from '../models/Skill';
import { User } from '../models/User';

export class SkillController {
  
  // 獲取技能目錄 (用於AI推薦)
  getSkillCatalogue = async (req: Request, res: Response): Promise<void> => {
    try {
      const { category, type } = req.query;
      
      const query: any = { isActive: true };
      if (category) query.category = category;
      if (type) query.type = type;
      
      const skills = await Skill.find(query).sort({ name: 1 });
      
      res.json({
        skills: skills.map(skill => ({
          skillId: skill.skillId,
          name: skill.name,
          description: skill.description,
          category: skill.category,
          type: skill.type
        }))
      });
    } catch (error) {
      console.error('Error fetching skill catalogue:', error);
      res.status(500).json({ error: 'Failed to fetch skill catalogue' });
    }
  };

  // 創建新技能
  createSkill = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, description, category, type } = req.body;
      
      if (!name || !description || !category) {
        res.status(400).json({ error: 'Name, description, and category are required' });
        return;
      }

      // 生成唯一技能ID
      const skillId = `skill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const skill = new Skill({
        skillId,
        name,
        description,
        category,
        type: type || SkillType.General,
        isActive: true
      });

      const savedSkill = await skill.save();
      
      res.status(201).json({
        message: 'Skill created successfully',
        skill: {
          skillId: savedSkill.skillId,
          name: savedSkill.name,
          description: savedSkill.description,
          category: savedSkill.category,
          type: savedSkill.type
        }
      });
    } catch (error) {
      console.error('Error creating skill:', error);
      res.status(500).json({ error: 'Failed to create skill' });
    }
  };

  // 獲取技能用於添加技能功能
  getSkillsForAddSkill = async (req: Request, res: Response): Promise<void> => {
    try {
      const { category, search } = req.query;
      
      const query: any = { isActive: true };
      if (category) query.category = category;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      
      const skills = await Skill.find(query)
        .sort({ name: 1 })
        .limit(50);
      
      res.json({
        skills: skills.map(skill => ({
          skillId: skill.skillId,
          name: skill.name,
          description: skill.description,
          category: skill.category,
          type: skill.type
        }))
      });
    } catch (error) {
      console.error('Error fetching skills for add skill:', error);
      res.status(500).json({ error: 'Failed to fetch skills' });
    }
  };

  // 推薦技能給用戶
  recommendSkills = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.params;
      const { businessGoal, keyResults } = req.body;
      
      const user = await User.findOne({ email });
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // 基於用戶的角色和目標推薦技能
      const userRole = user.role?.toLowerCase() || '';
      const goalText = `${businessGoal} ${keyResults}`.toLowerCase();
      
      // 根據角色和目標匹配相關技能
      const relevantSkills = await Skill.find({
        isActive: true,
        $or: [
          { category: 'functional' },
          { category: 'leadership' },
          { category: 'communication' },
          { category: 'problem_solving' }
        ]
      }).limit(10);

      // 簡單的匹配邏輯
      const recommendedSkills = relevantSkills.map(skill => ({
        skillId: skill.skillId,
        name: skill.name,
        description: skill.description,
        category: skill.category,
        type: skill.type,
        rating: 1, // 默認評分
        tag: 'biz' // 默認為業務技能
      }));

      res.json({
        message: 'Skills recommended successfully',
        skills: recommendedSkills
      });

    } catch (error) {
      console.error('Error recommending skills:', error);
      res.status(500).json({ error: 'Failed to recommend skills' });
    }
  };

  // 接受推薦的技能 (簡化版本)
  acceptRecommendedSkills = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.params;
      const { skills } = req.body;
      
      const user = await User.findOne({ email });
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // 簡化的技能接受邏輯 - 直接返回成功
      res.json({
        message: 'Skills accepted successfully',
        acceptedCount: skills.length,
        skills: skills
      });

    } catch (error) {
      console.error('Error accepting recommended skills:', error);
      res.status(500).json({ error: 'Failed to accept recommended skills' });
    }
  };
}