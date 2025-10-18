import mongoose, { Document, Schema } from 'mongoose';

export enum RelationshipType {
  MANAGER = 'manager',
  PEER = 'peer',
  DIRECT_REPORT = 'directReport',
  OTHER = 'other'
}

export enum InviteStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  EXPIRED = 'expired',
  RESPONDED = 'responded'
}

export interface IFeedbackInvite extends Document {
  assessmentId: mongoose.Types.ObjectId;
  assesseeUserId: mongoose.Types.ObjectId;
  assessorEmail: string;
  assessorUserId?: mongoose.Types.ObjectId;
  relationship: RelationshipType;
  status: InviteStatus;
  tokenHash?: string; // For secure link access
  expiresAt: Date;
  createdByUserId: mongoose.Types.ObjectId;
  lastEmailSentAt?: Date;
  emailCount: number;
  message?: string; // Optional message from assessee
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackInviteSchema = new Schema<IFeedbackInvite>({
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
  assessorEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  assessorUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  relationship: {
    type: String,
    enum: Object.values(RelationshipType),
    required: true
  },
  status: {
    type: String,
    enum: Object.values(InviteStatus),
    default: InviteStatus.PENDING
  },
  tokenHash: {
    type: String,
    sparse: true // Allows multiple null values
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
  },
  createdByUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastEmailSentAt: {
    type: Date
  },
  emailCount: {
    type: Number,
    default: 0,
    min: 0
  },
  message: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Indexes for better query performance
FeedbackInviteSchema.index({ assessorEmail: 1, status: 1 });
FeedbackInviteSchema.index({ assessmentId: 1 });
FeedbackInviteSchema.index({ assesseeUserId: 1 });
FeedbackInviteSchema.index({ assessorUserId: 1 });
FeedbackInviteSchema.index({ tokenHash: 1 }, { unique: true, sparse: true });
FeedbackInviteSchema.index({ expiresAt: 1 });

// Compound index for common queries
FeedbackInviteSchema.index({ assessorEmail: 1, status: 1, expiresAt: 1 });

export const FeedbackInvite = mongoose.model<IFeedbackInvite>('FeedbackInvite', FeedbackInviteSchema);
