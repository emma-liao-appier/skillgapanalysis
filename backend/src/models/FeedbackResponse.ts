import mongoose, { Document, Schema } from 'mongoose';

export enum ResponseVisibility {
  PRIVATE = 'private',
  SHARED_WITH_ASSESSEE = 'sharedWithAssessee'
}

export interface ISkillRating {
  skillId: string;
  rating: number; // 1-5 scale
  comment?: string;
}

export interface IFeedbackResponse extends Document {
  inviteId: mongoose.Types.ObjectId;
  assessmentId: mongoose.Types.ObjectId;
  assesseeUserId: mongoose.Types.ObjectId;
  assessorUserId?: mongoose.Types.ObjectId;
  assessorEmail?: string;
  ratings: ISkillRating[];
  overallComments?: string;
  visibility: ResponseVisibility;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SkillRatingSchema = new Schema<ISkillRating>({
  skillId: { 
    type: String, 
    required: true 
  },
  rating: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 5 
  },
  comment: { 
    type: String, 
    maxlength: 500 
  }
}, { _id: false });

const FeedbackResponseSchema = new Schema<IFeedbackResponse>({
  inviteId: {
    type: Schema.Types.ObjectId,
    ref: 'FeedbackInvite',
    required: true
  },
  assessmentId: {
    type: Schema.Types.ObjectId,
    ref: 'Assessment',
    required: true
  },
  assesseeUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assessorUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  assessorEmail: {
    type: String,
    lowercase: true,
    trim: true
  },
  ratings: [SkillRatingSchema],
  overallComments: {
    type: String,
    maxlength: 1000
  },
  visibility: {
    type: String,
    enum: Object.values(ResponseVisibility),
    default: ResponseVisibility.PRIVATE
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
FeedbackResponseSchema.index({ inviteId: 1 }, { unique: true }); // One response per invite
FeedbackResponseSchema.index({ assessmentId: 1 });
FeedbackResponseSchema.index({ assesseeUserId: 1 });
FeedbackResponseSchema.index({ assessorUserId: 1 });
FeedbackResponseSchema.index({ assessorEmail: 1 });
FeedbackResponseSchema.index({ submittedAt: -1 });

// Compound index for aggregation queries
FeedbackResponseSchema.index({ assessmentId: 1, visibility: 1 });

export const FeedbackResponse = mongoose.model<IFeedbackResponse>('FeedbackResponse', FeedbackResponseSchema);
