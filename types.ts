export type LanguageCode = 'en' | 'zh' | 'ja' | 'ko' | 'tr' | 'fr';

export enum Step {
  Language,
  Intro,
  Business,
  Career,
  Summary,
}

export type BusinessStage = 'goal' | 'results' | 'rating' | 'feedback';
export type CareerStage = 'goal' | 'intro' | 'rating' | 'feedback';
export type SummaryStage = 'report' | 'finalInput';


export enum SkillCategory {
  ProblemSolving = 'problem_solving',
  Communication = 'communication',
  AICapability = 'ai_capability',
  Leadership = 'leadership',
  Functional = 'functional',
}


export interface Skill {
  skillId: string;
  name: string;
  description: string;
  rating: number; // 1-5 for rated
  category: SkillCategory;
  tag: string; // "biz" or "career"
}

export interface SummaryData {
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

export interface AssessmentData {
  // 0. meta
  period: string;
  status: 'draft' | 'submitted';
  language: string;

  // 3. Business
  role: string;
  businessGoal: string;
  keyResults: string;
  businessSkills: Skill[];
  businessFeedbackSupport: string;
  businessFeedbackObstacles: string;

  // 4. Career
  careerGoal: string;
  careerSkills: Skill[];

  // 5. Summary
  nextSteps: string[];
  nextStepsOther: string;
  finalThoughts: string;

  // 6. Cached analytics for Summary/報表
  readinessBusiness: number;
  readinessCareer: number;
  alignmentScore: number;
  talentType: string;
  focusAreas: string[];
  categoryAverages: any;

  // Legacy fields for backward compatibility
  peerFeedback?: string;
  careerIntro?: string;
  careerFeedback?: string;
  summary?: SummaryData;
}
