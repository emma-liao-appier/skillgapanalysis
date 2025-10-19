/**
 * Alignment Score Calculation Utilities
 * 基於多維度分析的對齊度計算系統
 */

import { ISkill, SkillCategory } from '../models/Assessment';

export interface AlignmentScoreComponents {
  skillOverlapRate: number;
  skillRatingSimilarity: number;
  categoryBalance: number;
  semanticMatch: number;
  finalScore: number;
}

export interface AlignmentAnalysis {
  score: number;
  level: 'High' | 'Partial' | 'Low';
  insights: string;
  components: AlignmentScoreComponents;
}

/**
 * Compute Business ↔ Career Alignment Score
 * -----------------------------------------
 * Based on weighted combination of:
 *  - Skill Overlap (40%)
 *  - Skill Rating Similarity (30%)
 *  - Category Balance (20%)
 *  - Semantic Match (10%, optional if embedding provided)
 */
export function computeAlignmentScore({
  businessSkills = [],
  careerSkills = [],
  businessGoal = '',
  careerGoal = '',
  semanticMatch = null
}: {
  businessSkills: ISkill[];
  careerSkills: ISkill[];
  businessGoal?: string;
  careerGoal?: string;
  semanticMatch?: number | null;
}): AlignmentScoreComponents {
  if (!businessSkills.length || !careerSkills.length) {
    return {
      skillOverlapRate: 0,
      skillRatingSimilarity: 0,
      categoryBalance: 0,
      semanticMatch: 0,
      finalScore: 0
    };
  }

  /** ---------- 1️⃣ Compute Skill Overlap Rate ---------- **/
  const bizSkillNames = new Set(businessSkills.map(s => s.name.trim().toLowerCase()));
  const careerSkillNames = new Set(careerSkills.map(s => s.name.trim().toLowerCase()));
  const shared = [...bizSkillNames].filter(n => careerSkillNames.has(n));
  const unique = new Set([...bizSkillNames, ...careerSkillNames]);
  const skillOverlapRate = shared.length / unique.size || 0;

  /** ---------- 2️⃣ Compute Skill Rating Similarity ---------- **/
  const sharedRatings = shared.map(skillName => {
    const biz = businessSkills.find(s => s.name.trim().toLowerCase() === skillName)?.rating ?? null;
    const car = careerSkills.find(s => s.name.trim().toLowerCase() === skillName)?.rating ?? null;
    if (biz === null || car === null) return 0;
    return 1 - Math.abs(biz - car) / 4; // 1=identical, 0=very different
  });
  const skillRatingSimilarity =
    sharedRatings.length > 0 ? sharedRatings.reduce((a, b) => a + b, 0) / sharedRatings.length : 0;

  /** ---------- 3️⃣ Compute Category Balance ---------- **/
  const countByCategory = (arr: ISkill[]) => {
    const out: Record<string, number> = {};
    arr.forEach(s => (out[s.category] = (out[s.category] || 0) + 1));
    const total = Object.values(out).reduce((a, b) => a + b, 0) || 1;
    Object.keys(out).forEach(k => (out[k] /= total)); // normalize
    return out;
  };
  
  const bizCat = countByCategory(businessSkills);
  const carCat = countByCategory(careerSkills);

  const allCats = new Set([...Object.keys(bizCat), ...Object.keys(carCat)]);
  const bizVec = [...allCats].map(k => bizCat[k] || 0);
  const carVec = [...allCats].map(k => carCat[k] || 0);

  const dot = bizVec.reduce((sum, v, i) => sum + v * carVec[i], 0);
  const magBiz = Math.sqrt(bizVec.reduce((sum, v) => sum + v ** 2, 0));
  const magCar = Math.sqrt(carVec.reduce((sum, v) => sum + v ** 2, 0));
  const cosineSim = magBiz && magCar ? dot / (magBiz * magCar) : 0;
  const categoryBalance = cosineSim; // closer to 1 = balanced

  /** ---------- 4️⃣ Compute Semantic Match (optional) ---------- **/
  // If no semanticMatch provided, approximate by string keyword overlap
  let focusSemanticMatch = semanticMatch;
  if (focusSemanticMatch == null && businessGoal && careerGoal) {
    const tokenize = (t: string) => t.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    const bizTokens = new Set(tokenize(businessGoal));
    const carTokens = new Set(tokenize(careerGoal));
    const sharedTokens = [...bizTokens].filter(t => carTokens.has(t));
    focusSemanticMatch = sharedTokens.length / Math.max(bizTokens.size, carTokens.size, 1);
  }

  /** ---------- 5️⃣ Weighted Combination ---------- **/
  const alignment =
    0.4 * skillOverlapRate +
    0.3 * skillRatingSimilarity +
    0.2 * categoryBalance +
    0.1 * (focusSemanticMatch || 0);

  /** ---------- 6️⃣ Clamp 0–1 and Return ---------- **/
  const finalScore = Math.round(Math.max(0, Math.min(1, alignment)) * 100) / 100; // 2 decimals (0–1)

  return {
    skillOverlapRate,
    skillRatingSimilarity,
    categoryBalance,
    semanticMatch: focusSemanticMatch || 0,
    finalScore
  };
}

/**
 * Generate alignment analysis with insights
 */
export function generateAlignmentAnalysis(
  businessSkills: ISkill[],
  careerSkills: ISkill[],
  businessGoal: string,
  careerGoal: string,
  semanticMatch?: number | null
): AlignmentAnalysis {
  const components = computeAlignmentScore({
    businessSkills,
    careerSkills,
    businessGoal,
    careerGoal,
    semanticMatch
  });

  const score = components.finalScore * 100; // Convert to percentage
  
  let level: 'High' | 'Partial' | 'Low';
  if (score >= 70) level = 'High';
  else if (score >= 40) level = 'Partial';
  else level = 'Low';

  // Generate insights based on components
  const insights = generateAlignmentInsights(components, businessSkills, careerSkills);

  return {
    score,
    level,
    insights,
    components
  };
}

/**
 * Generate human-readable insights about alignment
 */
function generateAlignmentInsights(
  components: AlignmentScoreComponents,
  businessSkills: ISkill[],
  careerSkills: ISkill[]
): string {
  const insights: string[] = [];

  // Skill overlap insights
  if (components.skillOverlapRate > 0.6) {
    insights.push(`Strong skill overlap (${Math.round(components.skillOverlapRate * 100)}%) indicates aligned development focus`);
  } else if (components.skillOverlapRate < 0.3) {
    insights.push(`Limited skill overlap (${Math.round(components.skillOverlapRate * 100)}%) suggests different development paths`);
  }

  // Rating similarity insights
  if (components.skillRatingSimilarity > 0.7) {
    insights.push(`Consistent skill ratings show balanced effort across business and career goals`);
  } else if (components.skillRatingSimilarity < 0.4) {
    insights.push(`Divergent skill ratings indicate different priorities between business and career development`);
  }

  // Category balance insights
  if (components.categoryBalance > 0.7) {
    insights.push(`Well-balanced skill categories across both business and career development`);
  } else if (components.categoryBalance < 0.4) {
    insights.push(`Skill categories are heavily skewed - consider diversifying your development focus`);
  }

  // Semantic match insights
  if (components.semanticMatch > 0.5) {
    insights.push(`Goals show strong thematic alignment`);
  } else if (components.semanticMatch < 0.2) {
    insights.push(`Goals appear to focus on different themes - consider finding common ground`);
  }

  return insights.join('. ') + '.';
}

/**
 * Calculate readiness level based on skill ratings
 */
export function calculateReadinessLevel(skills: ISkill[]): 'High' | 'Medium' | 'Low' {
  if (!skills.length) return 'Low';
  
  const avgRating = skills.reduce((sum, skill) => sum + skill.rating, 0) / skills.length;
  const percentage = (avgRating / 5) * 100;
  
  if (percentage >= 75) return 'High';
  else if (percentage >= 50) return 'Medium';
  else return 'Low';
}

/**
 * Determine talent type based on alignment and readiness
 */
export function determineTalentType(
  alignmentLevel: 'High' | 'Partial' | 'Low',
  readinessLevel: 'High' | 'Medium' | 'Low'
): string {
  const matrix: Record<string, Record<string, string>> = {
    High: {
      High: 'Strategic Contributor',
      Medium: 'Emerging Talent',
      Low: 'Foundational Builder'
    },
    Partial: {
      High: 'Functional Expert',
      Medium: 'Evolving Generalist',
      Low: 'Exploring Talent'
    },
    Low: {
      High: 'Re-direction Needed',
      Medium: 'Potential Shifter',
      Low: 'Career Explorer'
    }
  };

  return matrix[alignmentLevel][readinessLevel];
}

export default computeAlignmentScore;
