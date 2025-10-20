import mongoose, { Document, Schema } from 'mongoose';
import { SkillCategory } from './Skill';

export interface IGeneratedSkill extends Document {
  userId: mongoose.Types.ObjectId;
  assessmentId: mongoose.Types.ObjectId;
  name: string;
  normalizedName: string; // lowercased, trimmed, punctuation-stripped for overlap check
  description: string;
  category: SkillCategory;
  // provenance
  source: 'ai';
  model?: string; // e.g., gemini-1.5-pro
  promptHash?: string; // hash of the prompt for traceability
  dedupHash: string; // name+category hash used for uniqueness
}

const GeneratedSkillSchema = new Schema<IGeneratedSkill>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  assessmentId: {
    type: Schema.Types.ObjectId,
    ref: 'Assessment',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  normalizedName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: Object.values(SkillCategory),
    required: true,
    index: true
  },
  source: {
    type: String,
    enum: ['ai'],
    default: 'ai',
    required: true
  },
  model: {
    type: String,
    trim: true
  },
  promptHash: {
    type: String,
    trim: true
  },
  dedupHash: {
    type: String,
    required: true,
    unique: true
  }
}, {
  timestamps: true
});

// Helpful compound indexes for overlap checks and analytics
GeneratedSkillSchema.index({ userId: 1, normalizedName: 1 }, { unique: false });
GeneratedSkillSchema.index({ assessmentId: 1, normalizedName: 1 }, { unique: false });

export const GeneratedSkill = mongoose.model<IGeneratedSkill>('GeneratedSkill', GeneratedSkillSchema);


