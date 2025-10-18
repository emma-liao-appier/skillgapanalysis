import express from 'express';
import { FeedbackController } from '../controllers/FeedbackController';

const router = express.Router();
const feedbackController = new FeedbackController();

// Create feedback invites
router.post('/invites', feedbackController.createInvites);

// Get invites for current user (assessor)
router.get('/invites', feedbackController.getInvitesForUser);

// Get specific invite by ID
router.get('/invites/:inviteId', feedbackController.getInvite);

// Accept invite
router.post('/invites/:inviteId/accept', feedbackController.acceptInvite);

// Decline invite
router.post('/invites/:inviteId/decline', feedbackController.declineInvite);

// Submit feedback response
router.post('/invites/:inviteId/respond', feedbackController.submitResponse);

// Get feedback summary for assessee
router.get('/assessees/:assessmentId/summary', feedbackController.getFeedbackSummary);

// Get pending invite count for user
router.get('/invites/count', feedbackController.getPendingInviteCount);

export default router;
