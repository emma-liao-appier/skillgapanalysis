import { Request, Response } from 'express';
import { FeedbackInvite, IFeedbackInvite, RelationshipType, InviteStatus } from '../models/FeedbackInvite';
import { FeedbackResponse, IFeedbackResponse, ResponseVisibility } from '../models/FeedbackResponse';
import { Assessment } from '../models/Assessment';
import { User } from '../models/User';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export class FeedbackController {
  // Create feedback invites
  createInvites = async (req: Request, res: Response): Promise<void> => {
    try {
      const { 
        assessmentId, 
        assesseeUserId, 
        invites, 
        message 
      } = req.body;

      // Verify assessment exists
      const assessment = await Assessment.findById(assessmentId);
      if (!assessment) {
        res.status(404).json({ error: 'Assessment not found' });
        return;
      }

      // Verify assessee exists
      const assessee = await User.findById(assesseeUserId);
      if (!assessee) {
        res.status(404).json({ error: 'Assessee not found' });
        return;
      }

      const createdInvites = [];

      for (const inviteData of invites) {
        const { email, relationship } = inviteData;

        // Generate secure token for the invite
        const token = uuidv4();
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        const invite = new FeedbackInvite({
          assessmentId,
          assesseeUserId,
          assessorEmail: email,
          relationship: relationship as RelationshipType,
          tokenHash,
          createdByUserId: assesseeUserId,
          message,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        });

        const savedInvite = await invite.save();
        createdInvites.push({
          ...savedInvite.toObject(),
          token // Include token for email sending
        });
      }

      res.status(201).json({
        invites: createdInvites,
        message: `${createdInvites.length} feedback invites created successfully`
      });
    } catch (error) {
      console.error('Error creating feedback invites:', error);
      res.status(500).json({ error: 'Failed to create feedback invites' });
    }
  };

  // Get invites for current user (assessor)
  getInvitesForUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.query;
      const { status } = req.query;

      if (!email) {
        res.status(400).json({ error: 'Email is required' });
        return;
      }

      const query: any = { assessorEmail: email };
      if (status) {
        query.status = status;
      }

      const invites = await FeedbackInvite.find(query)
        .populate('assessmentId', 'role careerGoal businessGoal')
        .populate('assesseeUserId', 'name email')
        .sort({ createdAt: -1 });

      res.json(invites);
    } catch (error) {
      console.error('Error fetching invites:', error);
      res.status(500).json({ error: 'Failed to fetch invites' });
    }
  };

  // Get specific invite by ID
  getInvite = async (req: Request, res: Response): Promise<void> => {
    try {
      const { inviteId } = req.params;

      const invite = await FeedbackInvite.findById(inviteId)
        .populate('assessmentId')
        .populate('assesseeUserId', 'name email');

      if (!invite) {
        res.status(404).json({ error: 'Invite not found' });
        return;
      }

      // Check if invite is expired
      if (invite.expiresAt < new Date()) {
        invite.status = InviteStatus.EXPIRED;
        await invite.save();
      }

      res.json(invite);
    } catch (error) {
      console.error('Error fetching invite:', error);
      res.status(500).json({ error: 'Failed to fetch invite' });
    }
  };

  // Accept invite
  acceptInvite = async (req: Request, res: Response): Promise<void> => {
    try {
      const { inviteId } = req.params;
      const { assessorUserId } = req.body;

      const invite = await FeedbackInvite.findById(inviteId);
      if (!invite) {
        res.status(404).json({ error: 'Invite not found' });
        return;
      }

      if (invite.status !== InviteStatus.PENDING) {
        res.status(400).json({ error: 'Invite is not pending' });
        return;
      }

      if (invite.expiresAt < new Date()) {
        invite.status = InviteStatus.EXPIRED;
        await invite.save();
        res.status(400).json({ error: 'Invite has expired' });
        return;
      }

      invite.status = InviteStatus.ACCEPTED;
      if (assessorUserId) {
        invite.assessorUserId = assessorUserId;
      }

      await invite.save();

      res.json({ message: 'Invite accepted successfully', invite });
    } catch (error) {
      console.error('Error accepting invite:', error);
      res.status(500).json({ error: 'Failed to accept invite' });
    }
  };

  // Decline invite
  declineInvite = async (req: Request, res: Response): Promise<void> => {
    try {
      const { inviteId } = req.params;

      const invite = await FeedbackInvite.findById(inviteId);
      if (!invite) {
        res.status(404).json({ error: 'Invite not found' });
        return;
      }

      invite.status = InviteStatus.DECLINED;
      await invite.save();

      res.json({ message: 'Invite declined successfully', invite });
    } catch (error) {
      console.error('Error declining invite:', error);
      res.status(500).json({ error: 'Failed to decline invite' });
    }
  };

  // Submit feedback response
  submitResponse = async (req: Request, res: Response): Promise<void> => {
    try {
      const { inviteId } = req.params;
      const { ratings, overallComments, assessorUserId, assessorEmail } = req.body;

      const invite = await FeedbackInvite.findById(inviteId);
      if (!invite) {
        res.status(404).json({ error: 'Invite not found' });
        return;
      }

      if (invite.status === InviteStatus.RESPONDED) {
        res.status(400).json({ error: 'Feedback has already been submitted for this invite' });
        return;
      }

      if (invite.expiresAt < new Date()) {
        res.status(400).json({ error: 'Invite has expired' });
        return;
      }

      // Create feedback response
      const response = new FeedbackResponse({
        inviteId: invite._id,
        assessmentId: invite.assessmentId,
        assesseeUserId: invite.assesseeUserId,
        assessorUserId,
        assessorEmail: assessorEmail || invite.assessorEmail,
        ratings,
        overallComments,
        visibility: ResponseVisibility.PRIVATE
      });

      const savedResponse = await response.save();

      // Update invite status
      invite.status = InviteStatus.RESPONDED;
      await invite.save();

      res.status(201).json({
        message: 'Feedback submitted successfully',
        response: savedResponse
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      res.status(500).json({ error: 'Failed to submit feedback' });
    }
  };

  // Get feedback summary for assessee
  getFeedbackSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const { assessmentId } = req.params;
      const { minResponses = 2 } = req.query;

      // Get all responses for this assessment
      const responses = await FeedbackResponse.find({
        assessmentId,
        visibility: ResponseVisibility.SHARED_WITH_ASSESSEE
      }).populate('assessorUserId', 'name');

      if (responses.length < Number(minResponses)) {
        res.status(200).json({
          summary: null,
          message: `Not enough responses yet. Need at least ${minResponses} responses.`,
          responseCount: responses.length
        });
        return;
      }

      // Calculate aggregated ratings
      const aggregatedRatings: { [skillId: string]: { average: number, count: number, comments: string[] } } = {};

      responses.forEach(response => {
        response.ratings.forEach(rating => {
          if (!aggregatedRatings[rating.skillId]) {
            aggregatedRatings[rating.skillId] = {
              average: 0,
              count: 0,
              comments: []
            };
          }

          const current = aggregatedRatings[rating.skillId];
          current.average = (current.average * current.count + rating.rating) / (current.count + 1);
          current.count += 1;
          
          if (rating.comment) {
            current.comments.push(rating.comment);
          }
        });
      });

      // Get assessment to map skill IDs to skill names
      const assessment = await Assessment.findById(assessmentId);
      if (!assessment) {
        res.status(404).json({ error: 'Assessment not found' });
        return;
      }

      // Combine business and career skills
      const allSkills = [...assessment.businessSkills, ...assessment.careerSkills];

      const summary = {
        assessmentId,
        responseCount: responses.length,
        aggregatedRatings: Object.entries(aggregatedRatings).map(([skillId, data]) => {
          const skill = allSkills.find(s => s.skillId === skillId);
          return {
            skillId,
            skillName: skill?.name || 'Unknown Skill',
            averageRating: Math.round(data.average * 10) / 10,
            responseCount: data.count,
            comments: data.comments
          };
        }),
        overallComments: responses
          .map(r => r.overallComments)
          .filter(Boolean)
      };

      res.json(summary);
    } catch (error) {
      console.error('Error fetching feedback summary:', error);
      res.status(500).json({ error: 'Failed to fetch feedback summary' });
    }
  };

  // Get pending invite count for user
  getPendingInviteCount = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.query;

      if (!email) {
        res.status(400).json({ error: 'Email is required' });
        return;
      }

      const count = await FeedbackInvite.countDocuments({
        assessorEmail: email,
        status: InviteStatus.PENDING,
        expiresAt: { $gt: new Date() }
      });

      res.json({ count });
    } catch (error) {
      console.error('Error fetching pending invite count:', error);
      res.status(500).json({ error: 'Failed to fetch pending invite count' });
    }
  };
}
