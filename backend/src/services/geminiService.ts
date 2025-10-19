import { GoogleGenAI, Type } from '@google/genai';
import { ISkill, ISummaryData, SkillCategory } from '../models/Assessment';
import { renderPrompt, PromptRenderer } from '../lib/prompts';
import { generateAlignmentAnalysis, calculateReadinessLevel, determineTalentType } from '../lib/alignmentScore';

export class GeminiService {
  private client: GoogleGenAI;
  private predefinedSkills: any[];
  private existingFunctionalSkills: any[] = []; // 現有的 Functional Skills

  constructor(apiKey: string, predefinedSkills: any[]) {
    this.client = new GoogleGenAI({ apiKey });
    this.predefinedSkills = predefinedSkills;
  }

  /**
   * 設置現有的 Functional Skills 用於去重檢測
   */
  setExistingFunctionalSkills(skills: any[]) {
    this.existingFunctionalSkills = skills;
  }

  /**
   * 檢測技能相似度並決定是否生成新技能
   */
  private async checkSkillSimilarity(newSkillName: string, newSkillDescription: string): Promise<{ isDuplicate: boolean, similarSkill?: any }> {
    if (this.existingFunctionalSkills.length === 0) {
      return { isDuplicate: false };
    }

    const existingSkillsString = this.existingFunctionalSkills.map(skill => 
      `Name: ${skill.name}\nDescription: ${skill.description}`
    ).join('\n\n');

    const prompt = renderPrompt('utility', 'skillSimilarityCheck', {
      newSkillName,
      newSkillDescription,
      existingSkillsString
    });

    try {
      const response = await this.client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isDuplicate: { type: Type.BOOLEAN },
              similarSkill: { 
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                nullable: true
              },
              similarityScore: { type: Type.NUMBER }
            },
            required: ['isDuplicate', 'similarSkill', 'similarityScore']
          }
        }
      });

      const result = JSON.parse(response.text?.trim() || '{}');
      return {
        isDuplicate: result.isDuplicate || false,
        similarSkill: result.similarSkill
      };
    } catch (error) {
      console.error("Error checking skill similarity:", error);
      return { isDuplicate: false };
    }
  }

  async generateKeyResults(role: string, businessGoal: string): Promise<string> {
    const prompt = renderPrompt('business', 'keyResults', {
      role,
      businessGoal
    });

    try {
      const response = await this.client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      
      return response.text?.trim() || "";
    } catch (error) {
      console.error("Error generating key results:", error);
      return "Could not generate suggestions due to an error.";
    }
  }

  async generateBusinessSkills(role: string, businessGoal: string, keyResults?: string): Promise<ISkill[]> {
    const predefinedSkillsString = this.predefinedSkills.map((cat: any) => 
      `Category: ${cat.category}\nSkills:\n${cat.skills.map((s: any) => `- ${s.name}: ${s.description}`).join('\n')}`
    ).join('\n\n');

    const prompt = renderPrompt('business', 'businessSkills', {
      role,
      businessGoal,
      keyResults,
      predefinedSkillsString
    });

    try {
      const response = await this.client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              generalSkillNames: {
                type: Type.ARRAY,
                description: 'An array of exactly 3 skill names selected from the provided General Skills List.',
                items: { type: Type.STRING }
              },
              functionalSkills: {
                type: Type.ARRAY,
                description: 'An array of exactly 2 newly generated Functional skills, each with a name and description.',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ['name', 'description']
                }
              }
            },
            required: ['generalSkillNames', 'functionalSkills']
          },
        },
      });

      const jsonString = response.text?.trim() || "";
      if (!jsonString) {
        throw new Error('Empty response from Gemini API');
      }
      const parsedResponse = JSON.parse(jsonString);

      const allPredefinedSkills = this.predefinedSkills.flatMap((cat: any) =>
        cat.skills.map((s: any) => ({ ...s, category: cat.category as SkillCategory }))
      );

      const generalSkills: ISkill[] = parsedResponse.generalSkillNames.map((name: string) => {
        const foundSkill = allPredefinedSkills.find((s: any) => s.name === name);
        return {
          skillId: `skill-${Date.now()}-${Math.random()}`,
          name: name,
          description: foundSkill ? foundSkill.description : 'A key general skill for professional development.',
          category: foundSkill ? foundSkill.category : SkillCategory.ProblemSolving,
          rating: 1,
          tag: 'biz',
        };
      }).slice(0, 3);

      // 處理 Functional Skills 並檢查重複
      const functionalSkills: ISkill[] = [];
      for (const skill of parsedResponse.functionalSkills.slice(0, 2)) {
        const similarityCheck = await this.checkSkillSimilarity(skill.name, skill.description);
        
        if (similarityCheck.isDuplicate && similarityCheck.similarSkill) {
          // 如果發現重複，使用現有技能
          const existingSkill = this.existingFunctionalSkills.find(s => 
            s.name === similarityCheck.similarSkill.name
          );
          if (existingSkill) {
            functionalSkills.push({
              skillId: existingSkill.skillId || `skill-${Date.now()}-${Math.random()}`,
              name: existingSkill.name,
              description: existingSkill.description,
              category: SkillCategory.Functional,
              rating: 1,
              tag: 'biz',
            });
          }
        } else {
          // 沒有重複，生成新技能
          functionalSkills.push({
            skillId: `skill-${Date.now()}-${Math.random()}`,
            name: skill.name,
            description: skill.description,
            category: SkillCategory.Functional,
            rating: 1,
            tag: 'career',
          });
        }
      }

      return [...generalSkills, ...functionalSkills];
    } catch (error) {
      console.error("Error generating business skills:", error);
      return [];
    }
  }

  async optimizeText(textToOptimize: string): Promise<string> {
    const prompt = renderPrompt('career', 'optimizeCareerGoal', {
      textToOptimize
    });

    try {
      const response = await this.client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text?.trim() || "";
    } catch (error) {
      console.error("Error optimizing text:", error);
      return textToOptimize;
    }
  }

  async optimizeBusinessGoal(role: string, businessGoal: string): Promise<string> {
    const prompt = renderPrompt('business', 'optimizeBusinessGoal', {
      role,
      businessGoal
    });

    try {
      const response = await this.client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text?.trim() || businessGoal;
    } catch (error) {
      console.error("Error optimizing business goal:", error);
      return businessGoal; // Return original text on error
    }
  }

  async generateCareerIntroAndSkills(currentRole: string, careerGoal: string, peerFeedback: string): Promise<{ intro: string, skills: ISkill[], alignment: any, skillThemes: string[] }> {
    const predefinedSkillsString = this.predefinedSkills.map((cat: any) => 
      `Category: ${cat.category}\nSkills:\n${cat.skills.map((s: any) => `- ${s.name}: ${s.description}`).join('\n')}`
    ).join('\n\n');

    const prompt = renderPrompt('career', 'careerAnalysis', {
      currentRole,
      careerGoal,
      peerFeedback: peerFeedback || 'No feedback provided.',
      predefinedSkillsString
    });
    
    try {
      const response = await this.client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              alignment: {
                type: Type.OBJECT,
                properties: {
                  level: { 
                    type: Type.STRING,
                    description: 'Alignment level: "Strong alignment", "Partial alignment", or "Low alignment"'
                  },
                  explanation: { 
                    type: Type.STRING,
                    description: 'Concise explanation with summary sentence followed by bullet points for details'
                  }
                },
                required: ['level', 'explanation']
              },
              skillThemes: {
                type: Type.ARRAY,
                description: 'An array of 4-5 skill themes that would be most impactful for their development.',
                items: { type: Type.STRING }
              },
              generalSkillNames: {
                type: Type.ARRAY,
                description: 'An array of exactly 3 skill names selected from the provided General Skills List.',
                items: { type: Type.STRING }
              },
              functionalSkills: {
                type: Type.ARRAY,
                description: 'An array of exactly 2 newly generated Functional skills, each with a name and description.',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ['name', 'description']
                }
              }
            },
            required: ['alignment', 'skillThemes', 'generalSkillNames', 'functionalSkills']
          },
        },
      });

      const jsonString = response.text?.trim() || "";
      if (!jsonString) {
        throw new Error('Empty response from Gemini API');
      }
      const parsedResponse = JSON.parse(jsonString);

      const allPredefinedSkills = this.predefinedSkills.flatMap((cat: any) =>
        cat.skills.map((s: any) => ({ ...s, category: cat.category as SkillCategory }))
      );

      const generalSkills: ISkill[] = parsedResponse.generalSkillNames.map((name: string) => {
        const foundSkill = allPredefinedSkills.find((s: any) => s.name === name);
        return {
          skillId: `skill-${Date.now()}-${Math.random()}`,
          name: name,
          description: foundSkill ? foundSkill.description : 'A key general skill for professional development.',
          category: foundSkill ? foundSkill.category : SkillCategory.ProblemSolving,
          rating: 1,
          tag: 'career',
        };
      }).slice(0, 3);

      // 處理 Functional Skills 並檢查重複
      const functionalSkills: ISkill[] = [];
      for (const skill of parsedResponse.functionalSkills.slice(0, 2)) {
        const similarityCheck = await this.checkSkillSimilarity(skill.name, skill.description);
        
        if (similarityCheck.isDuplicate && similarityCheck.similarSkill) {
          // 如果發現重複，使用現有技能
          const existingSkill = this.existingFunctionalSkills.find(s => 
            s.name === similarityCheck.similarSkill.name
          );
          if (existingSkill) {
            functionalSkills.push({
              skillId: existingSkill.skillId || `skill-${Date.now()}-${Math.random()}`,
              name: existingSkill.name,
              description: existingSkill.description,
              category: SkillCategory.Functional,
              rating: 1,
              tag: 'biz',
            });
          }
        } else {
          // 沒有重複，生成新技能
          functionalSkills.push({
            skillId: `skill-${Date.now()}-${Math.random()}`,
            name: skill.name,
            description: skill.description,
            category: SkillCategory.Functional,
            rating: 1,
            tag: 'career',
          });
        }
      }

      return {
        intro: "Analysis completed successfully.",
        skills: [...generalSkills, ...functionalSkills],
        alignment: parsedResponse.alignment || { level: 'Partial alignment', explanation: 'Analysis completed' },
        skillThemes: parsedResponse.skillThemes || []
      };
    } catch (error) {
      console.error("Error generating career content:", error);
      return {
        intro: "AItlas encountered an issue. Let's focus on the skills for now!",
        skills: [],
        alignment: { level: 'Partial alignment', explanation: 'Analysis completed' },
        skillThemes: []
      };
    }
  }

  async generateTalentTypeAnalysis(assessmentData: any): Promise<any> {
    const businessSkillsRatings = assessmentData.businessSkills.map((s: any) => `- ${s.name} (${s.category}): ${s.rating}/5`).join('\n');
    const careerSkillsRatings = assessmentData.careerSkills.map((s: any) => `- ${s.name} (${s.category}): ${s.rating}/5`).join('\n');

    // 計算 alignment analysis
    const alignmentAnalysis = generateAlignmentAnalysis(
      assessmentData.businessSkills,
      assessmentData.careerSkills,
      assessmentData.businessGoal,
      assessmentData.careerGoal
    );

    const prompt = renderPrompt('summary', 'talentTypeAnalysis', {
      role: assessmentData.role,
      businessGoal: assessmentData.businessGoal,
      careerGoal: assessmentData.careerGoal,
      keyResults: assessmentData.keyResults || '',
      businessSkillsRatings,
      careerSkillsRatings,
      businessFeedbackSupport: assessmentData.businessFeedbackSupport || 'N/A',
      careerFeedback: assessmentData.careerFeedback || 'N/A'
    });

    try {
      const response = await this.client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              alignmentScore: { type: Type.NUMBER },
              alignmentLevel: { type: Type.STRING },
              readinessLevel: { type: Type.STRING },
              talentType: { type: Type.STRING },
              talentDescription: { type: Type.STRING },
              focusAreas: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING } 
              },
              recommendations: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING } 
              },
              alignmentInsights: { type: Type.STRING }
            },
            required: ['alignmentScore', 'alignmentLevel', 'readinessLevel', 'talentType', 'talentDescription', 'focusAreas', 'recommendations', 'alignmentInsights']
          },
        },
      });

      const jsonString = response.text?.trim() || "";
      if (!jsonString) {
        throw new Error('Empty response from Gemini API');
      }
      const aiResponse = JSON.parse(jsonString);

      // 合併 AI 回應和計算的 alignment analysis
      return {
        ...aiResponse,
        alignmentComponents: alignmentAnalysis.components,
        calculatedAlignmentScore: alignmentAnalysis.score,
        calculatedAlignmentLevel: alignmentAnalysis.level,
        calculatedInsights: alignmentAnalysis.insights
      };

    } catch (error) {
      console.error("Error generating talent type analysis:", error);
      // 回退到計算的結果
      const readinessLevel = calculateReadinessLevel([...assessmentData.businessSkills, ...assessmentData.careerSkills]);
      const talentType = determineTalentType(alignmentAnalysis.level, readinessLevel);
      
      return {
        alignmentScore: alignmentAnalysis.score,
        alignmentLevel: alignmentAnalysis.level,
        readinessLevel,
        talentType,
        talentDescription: `You are a ${talentType} with ${alignmentAnalysis.level.toLowerCase()} alignment between your business and career goals.`,
        focusAreas: ['Problem Solving', 'Communication'],
        recommendations: ['Focus on skill development', 'Align your goals better', 'Seek mentorship'],
        alignmentInsights: alignmentAnalysis.insights,
        alignmentComponents: alignmentAnalysis.components,
        calculatedAlignmentScore: alignmentAnalysis.score,
        calculatedAlignmentLevel: alignmentAnalysis.level,
        calculatedInsights: alignmentAnalysis.insights
      };
    }
  }

  async generateVennDiagramFeedback(assessmentData: any, talentAnalysis: any): Promise<any> {
    const businessSkillsAverage = assessmentData.businessSkills.length > 0 
      ? assessmentData.businessSkills.reduce((sum: number, skill: any) => sum + skill.rating, 0) / assessmentData.businessSkills.length 
      : 0;
    const careerSkillsAverage = assessmentData.careerSkills.length > 0 
      ? assessmentData.careerSkills.reduce((sum: number, skill: any) => sum + skill.rating, 0) / assessmentData.careerSkills.length 
      : 0;

    const prompt = renderPrompt('summary', 'vennDiagramFeedback', {
      role: assessmentData.role,
      businessGoal: assessmentData.businessGoal,
      careerGoal: assessmentData.careerGoal,
      businessSkillsAverage: Math.round(businessSkillsAverage * 10) / 10,
      careerSkillsAverage: Math.round(careerSkillsAverage * 10) / 10,
      alignmentScore: talentAnalysis.calculatedAlignmentScore || talentAnalysis.alignmentScore,
      skillOverlapRate: Math.round((talentAnalysis.alignmentComponents?.skillOverlapRate || 0) * 100),
      skillRatingSimilarity: Math.round((talentAnalysis.alignmentComponents?.skillRatingSimilarity || 0) * 100),
      categoryBalance: Math.round((talentAnalysis.alignmentComponents?.categoryBalance || 0) * 100),
      semanticMatch: Math.round((talentAnalysis.alignmentComponents?.semanticMatch || 0) * 100)
    });

    try {
      const response = await this.client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              businessFeedback: { type: Type.STRING },
              careerFeedback: { type: Type.STRING },
              alignmentFeedback: { type: Type.STRING }
            },
            required: ['businessFeedback', 'careerFeedback', 'alignmentFeedback']
          },
        },
      });

      const jsonString = response.text?.trim() || "";
      if (!jsonString) {
        throw new Error('Empty response from Gemini API');
      }
      return JSON.parse(jsonString);

    } catch (error) {
      console.error("Error generating venn diagram feedback:", error);
      return {
        businessFeedback: "Focus on developing your core business skills to improve readiness for your current role.",
        careerFeedback: "Continue building expertise in areas that align with your career growth goals.",
        alignmentFeedback: "Work on aligning your business and career development to create synergy."
      };
    }
  }

  async generateSuggestedNextSteps(assessmentData: any, talentAnalysis: any): Promise<string[]> {
    const businessSkillsRatings = assessmentData.businessSkills.map((s: any) => `- ${s.name} (${s.category}): ${s.rating}/5`).join('\n');
    const careerSkillsRatings = assessmentData.careerSkills.map((s: any) => `- ${s.name} (${s.category}): ${s.rating}/5`).join('\n');

    const prompt = renderPrompt('summary', 'suggestedNextSteps', {
      role: assessmentData.role,
      businessGoal: assessmentData.businessGoal,
      careerGoal: assessmentData.careerGoal,
      keyResults: assessmentData.keyResults || '',
      businessSkillsRatings,
      careerSkillsRatings,
      talentType: talentAnalysis.talentType,
      focusAreas: talentAnalysis.focusAreas?.join(', ') || '',
      alignmentLevel: talentAnalysis.calculatedAlignmentLevel || talentAnalysis.alignmentLevel,
      readinessLevel: talentAnalysis.readinessLevel,
      businessFeedbackSupport: assessmentData.businessFeedbackSupport || 'N/A',
      careerFeedback: assessmentData.careerFeedback || 'N/A'
    });

    try {
      const response = await this.client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestedNextSteps: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "An array of exactly 3 actionable next steps."
              }
            },
            required: ['suggestedNextSteps']
          },
        },
      });

      const jsonString = response.text?.trim() || "";
      if (!jsonString) {
        throw new Error('Empty response from Gemini API');
      }
      const result = JSON.parse(jsonString);
      return result.suggestedNextSteps || [];

    } catch (error) {
      console.error("Error generating suggested next steps:", error);
      return [
        "Focus on developing your lowest-rated skills",
        "Seek mentorship in your focus areas",
        "Create a development plan aligned with your goals"
      ];
    }
  }

  // 保留原有的 generateSummary 方法作為向後兼容
  async generateSummary(assessmentData: any): Promise<ISummaryData> {
    const talentAnalysis = await this.generateTalentTypeAnalysis(assessmentData);
    const vennFeedback = await this.generateVennDiagramFeedback(assessmentData, talentAnalysis);
    const nextSteps = await this.generateSuggestedNextSteps(assessmentData, talentAnalysis);

    return {
      businessReadiness: Math.round(talentAnalysis.alignmentComponents?.skillOverlapRate * 100 || 0),
      careerReadiness: Math.round(talentAnalysis.alignmentComponents?.skillRatingSimilarity * 100 || 0),
      recommendations: talentAnalysis.talentDescription || "Continue developing your skills and aligning your goals.",
      suggestedNextSteps: nextSteps,
      // 新增的 alignment score 相關數據
      alignmentScore: talentAnalysis.calculatedAlignmentScore || talentAnalysis.alignmentScore,
      alignmentLevel: talentAnalysis.calculatedAlignmentLevel || talentAnalysis.alignmentLevel,
      talentType: talentAnalysis.talentType,
      alignmentInsights: talentAnalysis.calculatedInsights || talentAnalysis.alignmentInsights,
      alignmentComponents: talentAnalysis.alignmentComponents,
      vennDiagramFeedback: vennFeedback
    };
  }
}