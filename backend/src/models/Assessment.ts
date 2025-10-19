import mongoose, { Document, Schema } from 'mongoose';

export enum SkillCategory {
  ProblemSolving = 'problem_solving',
  Communication = 'communication',
  AICapability = 'ai_capability',
  Leadership = 'leadership',
  Functional = 'functional',
}

export interface ISummaryData {
  businessReadiness: number;
  careerReadiness: number;
  recommendations: string;
  suggestedNextSteps: string[];
  // 新增的 alignment score 相關數據
  alignmentScore?: number;
  alignmentLevel?: string;
  talentType?: string;
  alignmentInsights?: string;
  alignmentComponents?: {
    skillOverlapRate: number;
    skillRatingSimilarity: number;
    categoryBalance: number;
    semanticMatch: number;
    finalScore: number;
  };
  vennDiagramFeedback?: {
    businessFeedback: string;
    careerFeedback: string;
    alignmentFeedback: string;
  };
}

export interface ISkill {
  skillId: string;
  name: string;
  description: string;
  category: SkillCategory;
  rating: number; // 1-5 for rated
  tag: string; // "biz" or "career"
}


export interface IAssessment extends Document {
  // 0. meta
  userId: mongoose.Types.ObjectId;
  period: string;
  status: 'draft' | 'submitted';
  language: string;

  // 3. Business
  role: string;
  businessGoal: string;
  keyResults: string;
  businessSkills: ISkill[];
  businessFeedbackSupport: string;
  businessFeedbackObstacles: string;

  // 4. Career
  careerGoal: string;
  careerSkills: ISkill[];
  
  // Legacy fields for backward compatibility
  peerFeedback?: string;
  careerIntro?: string;
  careerFeedback?: string;
  summary?: ISummaryData;

  // 5. Summary
  nextSteps: string[];
  nextStepsOther: string;
  finalThoughts: string;

  // 6. Cached analytics for Summary/報表
  readinessBusiness: number;
  readinessCareer: number;
  alignmentScore: number;
  alignmentLevel: string;
  talentType: string;
  focusAreas: string[];
  categoryAverages: any;
  alignmentInsights: string;
  alignmentComponents: {
    skillOverlapRate: number;
    skillRatingSimilarity: number;
    categoryBalance: number;
    semanticMatch: number;
    finalScore: number;
  };
  vennDiagramFeedback: {
    businessFeedback: string;
    careerFeedback: string;
    alignmentFeedback: string;
  };

  // 系統欄位
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SkillSchema = new Schema<ISkill>({
  skillId: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: Object.values(SkillCategory),
    required: true 
  },
  rating: { type: Number, min: 1, max: 5, default: 1 },
  tag: { type: String, default: "biz" }
}, { _id: false });


const AssessmentSchema = new Schema<IAssessment>({
  // 0. meta
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  period: {
    type: String,
    default: "2025Q4",
    index: true
  },
  status: {
    type: String,
    enum: ['draft', 'submitted'],
    default: 'draft'
  },
  language: {
    type: String,
    default: 'English'
  },

  // 3. Business
  role: {
    type: String,
    trim: true
  },
  businessGoal: {
    type: String,
    trim: true
  },
  keyResults: {
    type: String,
    trim: true
  },
  businessSkills: [SkillSchema],
  businessFeedbackSupport: {
    type: String,
    trim: true
  },
  businessFeedbackObstacles: {
    type: String,
    trim: true
  },

  // 4. Career
  careerGoal: {
    type: String,
    trim: true
  },
  careerSkills: [SkillSchema],
  
  // Legacy fields for backward compatibility
  peerFeedback: {
    type: String,
    trim: true
  },
  careerIntro: {
    type: String,
    trim: true
  },
  careerFeedback: {
    type: String,
    trim: true
  },
  summary: {
    type: Schema.Types.Mixed
  },

  // 5. Summary
  nextSteps: [{ type: String }],
  nextStepsOther: {
    type: String,
    trim: true
  },
  finalThoughts: {
    type: String,
    trim: true
  },

  // 6. Cached analytics for Summary/報表
  readinessBusiness: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
  },
  readinessCareer: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
  },
  alignmentScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  alignmentLevel: {
    type: String,
    enum: ['High', 'Partial', 'Low'],
    default: 'Partial'
  },
  talentType: {
    type: String,
    trim: true,
    default: 'Evolving Generalist'
  },
  focusAreas: [{ type: String }],
  categoryAverages: {
    type: Schema.Types.Mixed
  },
  alignmentInsights: {
    type: String,
    trim: true
  },
  alignmentComponents: {
    skillOverlapRate: { type: Number, default: 0 },
    skillRatingSimilarity: { type: Number, default: 0 },
    categoryBalance: { type: Number, default: 0 },
    semanticMatch: { type: Number, default: 0 },
    finalScore: { type: Number, default: 0 }
  },
  vennDiagramFeedback: {
    businessFeedback: { type: String, trim: true },
    careerFeedback: { type: String, trim: true },
    alignmentFeedback: { type: String, trim: true }
  },

  // 系統欄位
  submittedAt: {
    type: Date
  }
}, {
  timestamps: true,
  minimize: false
});

// Indexes for better query performance
AssessmentSchema.index({ userId: 1 });
AssessmentSchema.index({ period: 1 });
AssessmentSchema.index({ status: 1 });
AssessmentSchema.index({ createdAt: -1 });
AssessmentSchema.index({ role: 1 });

export const Assessment = mongoose.model<IAssessment>('Assessment', AssessmentSchema);
