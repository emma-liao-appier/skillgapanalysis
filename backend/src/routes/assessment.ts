import express from 'express';
import { AssessmentController } from '../controllers/AssessmentController';

const router = express.Router();
const assessmentController = new AssessmentController();

// Create a new assessment
router.post('/', assessmentController.createAssessment);

// Get assessment by ID
router.get('/:id', assessmentController.getAssessment);

// Update assessment
router.put('/:id', assessmentController.updateAssessment);

// Delete assessment
router.delete('/:id', assessmentController.deleteAssessment);

// Get all assessments for a user
router.get('/user/:userId', assessmentController.getUserAssessments);

// AI Generation endpoints
router.post('/generate-key-results', assessmentController.generateKeyResults);
router.post('/optimize-text', assessmentController.optimizeText);
router.post('/optimize-business-goal', assessmentController.optimizeBusinessGoal);

// Generate business skills
router.post('/:id/generate-business-skills', assessmentController.generateBusinessSkills);

// Generate career skills
router.post('/:id/generate-career-skills', assessmentController.generateCareerSkills);

// Generate key results
router.post('/:id/generate-key-results', assessmentController.generateKeyResults);

// Generate summary
router.post('/:id/generate-summary', assessmentController.generateSummary);

// Optimize text (for career goals, etc.)
router.post('/optimize-text', assessmentController.optimizeText);

export default router;
