import express from 'express';
import { SkillController } from '../controllers/SkillController';

const router = express.Router();
const skillController = new SkillController();

// 獲取技能目錄
router.get('/catalogue', skillController.getSkillCatalogue);

// 獲取技能目錄供 Add Skill 功能使用
router.get('/add-skill', skillController.getSkillsForAddSkill);

// AI 推薦技能給用戶
router.post('/recommend/:email', skillController.recommendSkills);

// 用戶接受推薦的技能
router.post('/accept/:email', skillController.acceptRecommendedSkills);

// 獲取用戶的技能評估
router.get('/assessment/:email', skillController.getUserSkillAssessment);

// 更新技能評分
router.put('/rating/:email', skillController.updateSkillRating);

// 添加同儕反饋
router.post('/feedback/:email', skillController.addPeerFeedback);

// 創建新技能
router.post('/', skillController.createSkill);

export default router;
