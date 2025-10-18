import mongoose, { Document, Schema } from 'mongoose';

export enum SkillRelevance {
  Business = 'business',
  Career = 'career',
  Both = 'both'
}

export interface ISkillAssessment {
  skillId: string;           // 對應到 Skill.skillId
  name: string;             // 技能名稱 (快照)
  description: string;      // 技能描述 (快照)
  category: string;         // 技能類別 (快照)
  type: string;            // 技能類型 (快照)
  relevance: SkillRelevance; // 技能相關性 (business/career/both)
  
  // 業務相關評估
  businessRating?: number;   // 業務技能評分 (1-5)
  businessConfidence?: number; // 自我評估信心度 (1-5)
  
  // 職業發展評估
  careerRating?: number;     // 職業技能評分 (1-5)
  careerConfidence?: number; // 自我評估信心度 (1-5)
  
  // 同儕反饋
  peerFeedbacks: IPeerFeedback[];
  
  // 綜合評分 (計算得出)
  finalBusinessRating?: number;  // 最終業務評分 (包含同儕反饋)
  finalCareerRating?: number;    // 最終職業評分 (包含同儕反饋)
  
  // 元數據
  isRecommended: boolean;   // 是否為AI推薦的技能
  recommendedAt?: Date;     // 推薦時間
  lastAssessedAt: Date;    // 最後評估時間
}

export interface IPeerFeedback {
  peerEmail: string;        // 同儕郵箱
  peerName: string;         // 同儕姓名
  businessRating?: number;  // 同儕對業務技能的評分
  careerRating?: number;    // 同儕對職業技能的評分
  feedback?: string;        // 文字反饋
  relationship: string;     // 關係 (manager/peer/subordinate/external)
  submittedAt: Date;        // 提交時間
  isAnonymous: boolean;     // 是否匿名
}

export interface IUserSkillAssessment extends Document {
  userId: mongoose.Types.ObjectId;
  assessmentId?: mongoose.Types.ObjectId; // 關聯到特定的 Assessment
  skills: ISkillAssessment[];
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PeerFeedbackSchema = new Schema<IPeerFeedback>({
  peerEmail: { type: String, required: true, lowercase: true, trim: true },
  peerName: { type: String, required: true, trim: true },
  businessRating: { 
    type: Number, 
    min: 1, 
    max: 5 
  },
  careerRating: { 
    type: Number, 
    min: 1, 
    max: 5 
  },
  feedback: { 
    type: String, 
    trim: true,
    maxlength: 1000
  },
  relationship: { 
    type: String, 
    required: true,
    enum: ['manager', 'peer', 'subordinate', 'external']
  },
  submittedAt: { 
    type: Date, 
    default: Date.now 
  },
  isAnonymous: { 
    type: Boolean, 
    default: false 
  }
}, { _id: false });

const SkillAssessmentSchema = new Schema<ISkillAssessment>({
  skillId: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  type: { type: String, required: true, trim: true },
  relevance: { 
    type: String, 
    required: true,
    enum: Object.values(SkillRelevance)
  },
  
  // 業務相關評估
  businessRating: { 
    type: Number, 
    min: 1, 
    max: 5 
  },
  businessConfidence: { 
    type: Number, 
    min: 1, 
    max: 5 
  },
  
  // 職業發展評估
  careerRating: { 
    type: Number, 
    min: 1, 
    max: 5 
  },
  careerConfidence: { 
    type: Number, 
    min: 1, 
    max: 5 
  },
  
  // 同儕反饋
  peerFeedbacks: [PeerFeedbackSchema],
  
  // 綜合評分
  finalBusinessRating: { 
    type: Number, 
    min: 1, 
    max: 5 
  },
  finalCareerRating: { 
    type: Number, 
    min: 1, 
    max: 5 
  },
  
  // 元數據
  isRecommended: { 
    type: Boolean, 
    default: false 
  },
  recommendedAt: { 
    type: Date 
  },
  lastAssessedAt: { 
    type: Date, 
    default: Date.now 
  }
}, { _id: false });

const UserSkillAssessmentSchema = new Schema<IUserSkillAssessment>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assessmentId: {
    type: Schema.Types.ObjectId,
    ref: 'Assessment'
  },
  skills: [SkillAssessmentSchema],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
UserSkillAssessmentSchema.index({ userId: 1 });
UserSkillAssessmentSchema.index({ assessmentId: 1 });
UserSkillAssessmentSchema.index({ 'skills.skillId': 1 });
UserSkillAssessmentSchema.index({ 'skills.relevance': 1 });
UserSkillAssessmentSchema.index({ 'skills.isRecommended': 1 });
UserSkillAssessmentSchema.index({ 'skills.peerFeedbacks.peerEmail': 1 });

export const UserSkillAssessment = mongoose.model<IUserSkillAssessment>('UserSkillAssessment', UserSkillAssessmentSchema);
