import mongoose, { Document, Schema } from 'mongoose';

export enum SkillCategory {
  ProblemSolving = 'problem_solving',
  Communication = 'communication',
  AICapability = 'ai_capability',
  Leadership = 'leadership',
  Functional = 'functional',
}

export interface ISkill {
  id: string;
  name: string;
  description: string;
  rating: number; // 0 for unrated, 1-5 for rated
  category: SkillCategory;
  type?: string; // 'general' or 'functional'
}

export interface ISummaryData {
  businessReadiness: number;
  careerReadiness: number;
  recommendations: string;
  suggestedNextSteps: string[];
}

export interface IAdditionalInputs {
  businessChallenges?: string;      // 業務挑戰
  careerAspirations?: string;       // 職業抱負
  learningPreferences?: string[];   // 學習偏好
  timeAvailability?: string;       // 時間可用性
  workEnvironment?: string;         // 工作環境偏好
  motivationFactors?: string[];     // 動機因素
  developmentBarriers?: string[];   // 發展障礙
}

export interface IAssessment extends Document {
  userId: mongoose.Types.ObjectId;
  language: string;
  role: string;
  careerGoal: string;
  peerFeedback?: string;
  careerIntro?: string;
  businessGoal: string;
  keyResults: string;
  businessSkills: ISkill[];
  careerSkills: ISkill[];
  businessFeedbackSupport?: string;
  businessFeedbackObstacles?: string;
  careerFeedback?: string;
  additionalInputs?: IAdditionalInputs;  // 額外的用戶輸入
  summary?: ISummaryData;
  nextSteps?: string[];
  nextStepsOther?: string;
  finalThoughts?: string;
  status: 'draft' | 'completed' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

const SkillSchema = new Schema<ISkill>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  category: { 
    type: String, 
    enum: Object.values(SkillCategory),
    required: true 
  }
}, { _id: false });

const AdditionalInputsSchema = new Schema<IAdditionalInputs>({
  businessChallenges: { 
    type: String, 
    trim: true,
    maxlength: 1000
  },
  careerAspirations: { 
    type: String, 
    trim: true,
    maxlength: 1000
  },
  learningPreferences: [{
    type: String,
    trim: true,
    maxlength: 200
  }],
  timeAvailability: { 
    type: String, 
    trim: true,
    maxlength: 500
  },
  workEnvironment: { 
    type: String, 
    trim: true,
    maxlength: 500
  },
  motivationFactors: [{
    type: String,
    trim: true,
    maxlength: 200
  }],
  developmentBarriers: [{
    type: String,
    trim: true,
    maxlength: 200
  }]
}, { _id: false });

const SummaryDataSchema = new Schema<ISummaryData>({
  businessReadiness: { type: Number, min: 0, max: 100 },
  careerReadiness: { type: Number, min: 0, max: 100 },
  recommendations: { type: String },
  suggestedNextSteps: [{ type: String }]
}, { _id: false });

const AssessmentSchema = new Schema<IAssessment>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  language: {
    type: String,
    required: true,
    default: 'English'
  },
  role: {
    type: String,
    required: true
  },
  careerGoal: {
    type: String,
    required: true
  },
  peerFeedback: {
    type: String
  },
  careerIntro: {
    type: String
  },
  businessGoal: {
    type: String,
    required: true
  },
  keyResults: {
    type: String,
    required: false,
    default: ''
  },
  businessSkills: [SkillSchema],
  careerSkills: [SkillSchema],
  businessFeedbackSupport: {
    type: String
  },
  businessFeedbackObstacles: {
    type: String
  },
  careerFeedback: {
    type: String
  },
  additionalInputs: AdditionalInputsSchema,
  summary: SummaryDataSchema,
  nextSteps: [{ type: String }],
  nextStepsOther: {
    type: String
  },
  finalThoughts: {
    type: String
  },
  status: {
    type: String,
    enum: ['draft', 'completed', 'archived'],
    default: 'draft'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
AssessmentSchema.index({ userId: 1 });
AssessmentSchema.index({ status: 1 });
AssessmentSchema.index({ createdAt: -1 });
AssessmentSchema.index({ role: 1 });

export const Assessment = mongoose.model<IAssessment>('Assessment', AssessmentSchema);
