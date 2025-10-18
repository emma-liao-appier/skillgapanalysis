import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name: string;
  department?: string;
  role?: string;
  division?: string;
  location?: string;
  jobLevel?: string;
  careerLadder?: string;
  lineManager?: string;
  lineManagerEmail?: string;
  functionalLead?: string;
  functionalLeadEmail?: string;
  companyEntryDate?: string;
  q4Okr?: string;
  isEmployee: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  assessments: mongoose.Types.ObjectId[];
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    trim: true
  },
  division: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  jobLevel: {
    type: String,
    trim: true
  },
  careerLadder: {
    type: String,
    trim: true
  },
  lineManager: {
    type: String,
    trim: true
  },
  lineManagerEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  functionalLead: {
    type: String,
    trim: true
  },
  functionalLeadEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  companyEntryDate: {
    type: String,
    trim: true
  },
  q4Okr: {
    type: String,
    trim: true
  },
  isEmployee: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  assessments: [{
    type: Schema.Types.ObjectId,
    ref: 'Assessment'
  }]
}, {
  timestamps: true
});

// Index for faster queries
UserSchema.index({ email: 1 });
UserSchema.index({ department: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);