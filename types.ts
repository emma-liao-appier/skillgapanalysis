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
  id: string;
  name: string;
  description: string;
  rating: number; // 0 for unrated, 1-5 for rated
  category: SkillCategory;
}

export interface SummaryData {
  businessReadiness: number;
  careerReadiness: number;
  recommendations: string;
  suggestedNextSteps: string[];
}

export interface AssessmentData {
  language: string;
  role: string;
  careerGoal: string;
  peerFeedback: string;
  careerIntro?: string;
  businessGoal: string;
  keyResults: string;
  businessSkills: Skill[];
  careerSkills: Skill[];
  businessFeedbackSupport?: string;
  businessFeedbackObstacles?: string;
  careerFeedback?: string;
  summary?: SummaryData;
  nextSteps?: string[];
  nextStepsOther?: string;
  finalThoughts?: string;
}
