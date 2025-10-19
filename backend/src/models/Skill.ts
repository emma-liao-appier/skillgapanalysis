import mongoose, { Document, Schema } from 'mongoose';

export enum SkillCategory {
  ProblemSolving = 'problem_solving',
  Communication = 'communication', 
  Leadership = 'leadership',
  AICapability = 'ai_capability',
  Functional = 'functional'
}

export enum SkillType {
  General = 'general',      // 從 skill catalogue 來的通用技能
  Functional = 'functional' // AI 生成的職能技能
}

export interface ISkill extends Document {
  skillId: string;           // 唯一識別碼
  name: string;              // 技能名稱
  description: string;       // 技能描述
  category: SkillCategory;   // 技能類別
  type: SkillType;          // 技能類型 (general/functional)
  isActive: boolean;         // 是否啟用
  createdAt: Date;
  updatedAt: Date;
}

const SkillSchema = new Schema<ISkill>({
  skillId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: Object.values(SkillCategory),
    required: true
  },
  type: {
    type: String,
    enum: Object.values(SkillType),
    required: true,
    default: SkillType.General
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
SkillSchema.index({ skillId: 1 });
SkillSchema.index({ category: 1 });
SkillSchema.index({ type: 1 });
SkillSchema.index({ isActive: 1 });

export const Skill = mongoose.model<ISkill>('Skill', SkillSchema);
