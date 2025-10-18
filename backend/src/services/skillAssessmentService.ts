import { ISkillAssessment, IPeerFeedback, SkillRelevance } from '../models/UserSkillAssessment';

export class SkillAssessmentService {
  
  /**
   * 計算最終評分 (結合自我評估和同儕反饋)
   */
  static calculateFinalRatings(skillAssessment: ISkillAssessment): ISkillAssessment {
    const updatedSkill = { ...skillAssessment };
    
    // 計算業務技能最終評分
    if (updatedSkill.relevance === SkillRelevance.Business || updatedSkill.relevance === SkillRelevance.Both) {
      updatedSkill.finalBusinessRating = this.calculateWeightedRating(
        updatedSkill.businessRating,
        updatedSkill.peerFeedbacks.map(feedback => feedback.businessRating).filter(r => r !== undefined) as number[]
      );
    }
    
    // 計算職業技能最終評分
    if (updatedSkill.relevance === SkillRelevance.Career || updatedSkill.relevance === SkillRelevance.Both) {
      updatedSkill.finalCareerRating = this.calculateWeightedRating(
        updatedSkill.careerRating,
        updatedSkill.peerFeedbacks.map(feedback => feedback.careerRating).filter(r => r !== undefined) as number[]
      );
    }
    
    return updatedSkill;
  }
  
  /**
   * 計算加權評分
   * 自我評估權重: 40%
   * 同儕反饋權重: 60% (平均分配)
   */
  private static calculateWeightedRating(
    selfRating: number | undefined, 
    peerRatings: number[]
  ): number | undefined {
    if (!selfRating && peerRatings.length === 0) {
      return undefined;
    }
    
    if (!selfRating) {
      // 只有同儕反饋
      return this.average(peerRatings);
    }
    
    if (peerRatings.length === 0) {
      // 只有自我評估
      return selfRating;
    }
    
    // 加權計算: 自我評估 40% + 同儕反饋 60%
    const peerAverage = this.average(peerRatings);
    const weightedRating = (selfRating * 0.4) + (peerAverage * 0.6);
    
    return Math.round(weightedRating * 10) / 10; // 保留一位小數
  }
  
  /**
   * 計算平均值
   */
  private static average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const sum = numbers.reduce((acc, num) => acc + num, 0);
    return Math.round((sum / numbers.length) * 10) / 10;
  }
  
  /**
   * 根據關係類型計算權重
   */
  static calculateRelationshipWeights(feedbacks: IPeerFeedback[]): { [key: string]: number } {
    const weights: { [key: string]: number } = {
      manager: 0.4,      // 直屬經理權重最高
      peer: 0.3,         // 同儕
      subordinate: 0.2,  // 下屬
      external: 0.1      // 外部合作夥伴
    };
    
    return weights;
  }
  
  /**
   * 獲取技能評估摘要
   */
  static getSkillAssessmentSummary(skills: ISkillAssessment[]): {
    totalSkills: number;
    businessSkills: number;
    careerSkills: number;
    bothSkills: number;
    averageBusinessRating: number;
    averageCareerRating: number;
    skillsWithPeerFeedback: number;
  } {
    const summary = {
      totalSkills: skills.length,
      businessSkills: skills.filter(s => s.relevance === SkillRelevance.Business).length,
      careerSkills: skills.filter(s => s.relevance === SkillRelevance.Career).length,
      bothSkills: skills.filter(s => s.relevance === SkillRelevance.Both).length,
      averageBusinessRating: 0,
      averageCareerRating: 0,
      skillsWithPeerFeedback: skills.filter(s => s.peerFeedbacks.length > 0).length
    };
    
    // 計算平均評分
    const businessRatings = skills
      .filter(s => s.finalBusinessRating !== undefined)
      .map(s => s.finalBusinessRating!);
    
    const careerRatings = skills
      .filter(s => s.finalCareerRating !== undefined)
      .map(s => s.finalCareerRating!);
    
    summary.averageBusinessRating = businessRatings.length > 0 ? 
      Math.round((businessRatings.reduce((a, b) => a + b, 0) / businessRatings.length) * 10) / 10 : 0;
    
    summary.averageCareerRating = careerRatings.length > 0 ? 
      Math.round((careerRatings.reduce((a, b) => a + b, 0) / careerRatings.length) * 10) / 10 : 0;
    
    return summary;
  }
  
  /**
   * 根據技能類別分組
   */
  static groupSkillsByCategory(skills: ISkillAssessment[]): { [category: string]: ISkillAssessment[] } {
    return skills.reduce((groups, skill) => {
      const category = skill.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(skill);
      return groups;
    }, {} as { [category: string]: ISkillAssessment[] });
  }
  
  /**
   * 獲取技能發展建議
   */
  static getSkillDevelopmentRecommendations(skills: ISkillAssessment[]): {
    strengths: ISkillAssessment[];
    areasForImprovement: ISkillAssessment[];
    emergingSkills: ISkillAssessment[];
  } {
    const recommendations = {
      strengths: [] as ISkillAssessment[],
      areasForImprovement: [] as ISkillAssessment[],
      emergingSkills: [] as ISkillAssessment[]
    };
    
    skills.forEach(skill => {
      // 強項: 最終評分 >= 4.0
      if ((skill.finalBusinessRating && skill.finalBusinessRating >= 4.0) ||
          (skill.finalCareerRating && skill.finalCareerRating >= 4.0)) {
        recommendations.strengths.push(skill);
      }
      
      // 需要改進: 最終評分 <= 2.5
      else if ((skill.finalBusinessRating && skill.finalBusinessRating <= 2.5) ||
               (skill.finalCareerRating && skill.finalCareerRating <= 2.5)) {
        recommendations.areasForImprovement.push(skill);
      }
      
      // 新興技能: 沒有評分或評分較低但有同儕反饋
      else if (skill.peerFeedbacks.length > 0 && 
               (!skill.finalBusinessRating || skill.finalBusinessRating < 3.0) &&
               (!skill.finalCareerRating || skill.finalCareerRating < 3.0)) {
        recommendations.emergingSkills.push(skill);
      }
    });
    
    return recommendations;
  }
}
