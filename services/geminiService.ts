import { GoogleGenAI, Type } from '@google/genai';
import { AssessmentData, Skill, SummaryData, SkillCategory } from '../types';
import { PREDEFINED_SKILLS } from '../lib/skills';
import { renderPrompt, PromptRenderer } from '../lib/prompts';
import { generateAlignmentAnalysis, calculateReadinessLevel, determineTalentType } from '../lib/alignmentScore';

// FIX: Initialize the GoogleGenAI client. The API key must be read from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const generateKeyResults = async (role: string, businessGoal: string): Promise<string> => {
    const prompt = renderPrompt('business', 'keyResults', {
        role,
        businessGoal
    });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        
        return response.text.trim();

    } catch (error) {
        console.error("Error generating key results:", error);
        return "Could not generate suggestions due to an error.";
    }
};

export const generateBusinessSkills = async (role: string, businessGoal: string, keyResults?: string): Promise<Skill[]> => {
    const predefinedSkillsString = PREDEFINED_SKILLS.map(cat => 
        `Category: ${cat.category}\nSkills:\n${cat.skills.map(s => `- ${s.name}: ${s.description}`).join('\n')}`
    ).join('\n\n');

    const prompt = renderPrompt('business', 'businessSkills', {
        role,
        businessGoal,
        keyResults,
        predefinedSkillsString
    });

    try {
        const response = await ai.models.generateContent({
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

        const jsonString = response.text.trim();
        const parsedResponse = JSON.parse(jsonString);

        const allPredefinedSkills = PREDEFINED_SKILLS.flatMap(cat =>
            cat.skills.map(s => ({ ...s, category: cat.category as SkillCategory }))
        );

        const generalSkills: Skill[] = parsedResponse.generalSkillNames.map((name: string) => {
            const foundSkill = allPredefinedSkills.find(s => s.name === name);
            return {
                id: `skill-${Date.now()}-${Math.random()}`,
                name: name,
                description: foundSkill ? foundSkill.description : 'A key general skill for professional development.',
                category: foundSkill ? foundSkill.category : SkillCategory.ProblemSolving, // Default category
                rating: 0,
            };
        }).slice(0, 3); // Ensure only 3 are returned

        const functionalSkills: Skill[] = parsedResponse.functionalSkills.map((skill: { name: string, description: string }) => ({
            id: `skill-${Date.now()}-${Math.random()}`,
            name: skill.name,
            description: skill.description,
            category: SkillCategory.Functional,
            rating: 0,
        })).slice(0, 2); // Ensure only 2 are returned

        return [...generalSkills, ...functionalSkills];

    } catch (error) {
        console.error("Error generating business skills:", error);
        return [];
    }
};

export const optimizeText = async (textToOptimize: string): Promise<string> => {
    const prompt = renderPrompt('career', 'optimizeCareerGoal', {
        textToOptimize
    });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error optimizing text:", error);
        return textToOptimize; // Return original text on error
    }
};

export const optimizeBusinessGoal = async (role: string, businessGoal: string): Promise<string> => {
    const prompt = renderPrompt('business', 'optimizeBusinessGoal', {
        role,
        businessGoal
    });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error optimizing business goal:", error);
        return businessGoal; // Return original text on error
    }
};


export const generateCareerIntroAndSkills = async (currentRole: string, careerGoal: string, peerFeedback: string): Promise<{ intro: string, skills: Skill[], alignment: any, skillThemes: string[] }> => {
    const predefinedSkillsString = PREDEFINED_SKILLS.map(cat => 
        `Category: ${cat.category}\nSkills:\n${cat.skills.map(s => `- ${s.name}: ${s.description}`).join('\n')}`
    ).join('\n\n');

    const prompt = renderPrompt('career', 'careerAnalysis', {
        currentRole,
        careerGoal,
        peerFeedback: peerFeedback || 'No feedback provided.',
        predefinedSkillsString
    });
    
    try {
        const response = await ai.models.generateContent({
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

        const jsonString = response.text.trim();
        const parsedResponse = JSON.parse(jsonString);

        const allPredefinedSkills = PREDEFINED_SKILLS.flatMap(cat =>
            cat.skills.map(s => ({ ...s, category: cat.category as SkillCategory }))
        );

        const generalSkills: Skill[] = parsedResponse.generalSkillNames.map((name: string) => {
            const foundSkill = allPredefinedSkills.find(s => s.name === name);
            return {
                id: `skill-${Date.now()}-${Math.random()}`,
                name: name,
                description: foundSkill ? foundSkill.description : 'A key general skill for professional development.',
                category: foundSkill ? foundSkill.category : SkillCategory.ProblemSolving,
                rating: 0,
            };
        }).slice(0, 3);

        const functionalSkills: Skill[] = parsedResponse.functionalSkills.map((skill: { name: string, description: string }) => ({
            id: `skill-${Date.now()}-${Math.random()}`,
            name: skill.name,
            description: skill.description,
            category: SkillCategory.Functional,
            rating: 0,
        })).slice(0, 2);

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
};


export const generateTalentTypeAnalysis = async (assessmentData: AssessmentData): Promise<any> => {
    const businessSkillsRatings = assessmentData.businessSkills.map(s => `- ${s.name} (${s.category}): ${s.rating}/5`).join('\n');
    const careerSkillsRatings = assessmentData.careerSkills.map(s => `- ${s.name} (${s.category}): ${s.rating}/5`).join('\n');

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
        const response = await ai.models.generateContent({
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

        const jsonString = response.text.trim();
        const aiResponse = JSON.parse(jsonString) as any;

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
};

export const generateVennDiagramFeedback = async (assessmentData: AssessmentData, talentAnalysis: any): Promise<any> => {
    const businessSkillsAverage = assessmentData.businessSkills.length > 0 
        ? assessmentData.businessSkills.reduce((sum, skill) => sum + skill.rating, 0) / assessmentData.businessSkills.length 
        : 0;
    const careerSkillsAverage = assessmentData.careerSkills.length > 0 
        ? assessmentData.careerSkills.reduce((sum, skill) => sum + skill.rating, 0) / assessmentData.careerSkills.length 
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
        const response = await ai.models.generateContent({
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

        const jsonString = response.text.trim();
        return JSON.parse(jsonString) as any;

    } catch (error) {
        console.error("Error generating venn diagram feedback:", error);
        return {
            businessFeedback: "Focus on developing your core business skills to improve readiness for your current role.",
            careerFeedback: "Continue building expertise in areas that align with your career growth goals.",
            alignmentFeedback: "Work on aligning your business and career development to create synergy."
        };
    }
};

export const generateSuggestedNextSteps = async (assessmentData: AssessmentData, talentAnalysis: any): Promise<string[]> => {
    const businessSkillsRatings = assessmentData.businessSkills.map(s => `- ${s.name} (${s.category}): ${s.rating}/5`).join('\n');
    const careerSkillsRatings = assessmentData.careerSkills.map(s => `- ${s.name} (${s.category}): ${s.rating}/5`).join('\n');

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
        const response = await ai.models.generateContent({
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

        const jsonString = response.text.trim();
        const result = JSON.parse(jsonString) as any;
        return result.suggestedNextSteps || [];

    } catch (error) {
        console.error("Error generating suggested next steps:", error);
        return [
            "Focus on developing your lowest-rated skills",
            "Seek mentorship in your focus areas",
            "Create a development plan aligned with your goals"
        ];
    }
};

// 保留原有的 generateSummary 函數作為向後兼容
export const generateSummary = async (assessmentData: AssessmentData): Promise<SummaryData> => {
    const talentAnalysis = await generateTalentTypeAnalysis(assessmentData);
    const vennFeedback = await generateVennDiagramFeedback(assessmentData, talentAnalysis);
    const nextSteps = await generateSuggestedNextSteps(assessmentData, talentAnalysis);

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
};
