import { GoogleGenAI, Type } from '@google/genai';
import { AssessmentData, Skill, SummaryData, SkillCategory } from '../types';
import { PREDEFINED_SKILLS } from '../lib/skills';

// FIX: Initialize the GoogleGenAI client. The API key must be read from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const generateKeyResults = async (role: string, businessGoal: string): Promise<string> => {
    const prompt = `
        As a business analyst, suggest 3 specific and measurable Key Results (KRs) for the following objective.
        The person responsible for this objective is a "${role}".
        The objective is: "${businessGoal}".

        Format the Key Results as a bulleted list, with each KR on a new line starting with a dash. For example:
        - Increase user engagement by 15%
        - Launch the new feature by the end of Q3
        - Reduce customer churn by 5%
    `;

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

    let prompt = `
        You are a skills analyst. Your task is to recommend 5 skills for a person with the role '${role}' working towards this business goal: "${businessGoal}".
    `;

    if (keyResults) {
        prompt += ` Consider these specific key results as well: "${keyResults}".`;
    }

    prompt += `
        Perform the following two tasks:
        1.  Select exactly 3 skills from the following list of General skills that are most relevant. Only return the names of the skills you select.
        2.  Generate exactly 2 new 'Functional' skills. These should be specific, technical, or domain-specific skills directly related to the user's role and goal. For each functional skill, provide a name and a description.

        General Skills List:
        ${predefinedSkillsString}
    `;

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
    const prompt = `You are a career coach. A user has provided the following text about their personal development goal. Rewrite it to be more constructive, specific, and actionable. Keep it concise (1-2 sentences) and encouraging.
    Original text: "${textToOptimize}"
    
    Return only the rewritten text, without any preamble.`;

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


export const generateCareerIntroAndSkills = async (currentRole: string, careerGoal: string, peerFeedback: string): Promise<{ intro: string, skills: Skill[] }> => {
    const predefinedSkillsString = PREDEFINED_SKILLS.map(cat => 
        `Category: ${cat.category}\nSkills:\n${cat.skills.map(s => `- ${s.name}: ${s.description}`).join('\n')}`
    ).join('\n\n');

    const prompt = `
        You are a skills analyst and career coach. Your task is to provide personalized career development recommendations for a user.
        User's Current Role: "${currentRole}"
        User's Personal Growth Goal for the Year: "${careerGoal}"
        Recent Feedback Received by User: "${peerFeedback || 'No feedback provided.'}"

        Based on this information, perform the following three tasks:
        1.  **Generate an Introductory Paragraph:** Write a short, encouraging paragraph (2-3 sentences) that acknowledges the user's input and sets a positive tone for the skill recommendations. This should act as a bridge between their goals and the skills needed to achieve them.
        2.  **Select General Skills:** Select exactly 3 skills from the following list of General skills that are most relevant for their growth goal. Only return the names of the skills you select.
        3.  **Generate Functional Skills:** Generate exactly 2 new 'Functional' skills. These should be specific, technical, or domain-specific skills that directly relate to achieving their stated goal. For each functional skill, provide a name and a description.

        General Skills List:
        ${predefinedSkillsString}
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        intro: { 
                            type: Type.STRING,
                            description: 'A short, encouraging introductory paragraph (2-3 sentences).'
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
                    required: ['intro', 'generalSkillNames', 'functionalSkills']
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
            intro: parsedResponse.intro,
            skills: [...generalSkills, ...functionalSkills]
        };
        
    } catch (error) {
        console.error("Error generating career content:", error);
        return {
            intro: "AItlas encountered an issue generating your personalized introduction. Let's focus on the skills for now!",
            skills: []
        };
    }
};


export const generateSummary = async (assessmentData: AssessmentData): Promise<SummaryData> => {
    const prompt = `
        Based on the following skill self-assessment, generate a summary.
        Current Role: ${assessmentData.role}
        User's Career Goal: ${assessmentData.careerGoal}

        Business Skills Ratings (1=Needs Development, 5=Expert):
        ${assessmentData.businessSkills.map(s => `- ${s.name} (${s.category}): ${s.rating}/5`).join('\n')}

        Career Growth Skills Ratings (1=Needs Development, 5=Expert):
        ${assessmentData.careerSkills.map(s => `- ${s.name} (${s.category}): ${s.rating}/5`).join('\n')}
        
        User-provided context on what would help them: ${assessmentData.businessFeedbackSupport || 'N/A'}, ${assessmentData.careerFeedback || 'N/A'}

        Provide the following in your response:
        1. "businessReadiness": A percentage (0-100) indicating readiness for the current business role based on the ratings.
        2. "careerReadiness": A percentage (0-100) indicating readiness for the next career role based on the ratings.
        3. "recommendations": A short, encouraging paragraph (2-3 sentences) with high-level strategic advice for career development based on the assessment. This should be written in a friendly, coaching tone.
        4. "suggestedNextSteps": An array of exactly 3 concise, actionable next steps the user can take to improve their lowest-rated skills. Each step should be a clear action, like "Lead a small project..." or "Mentor a junior engineer...".
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        businessReadiness: { type: Type.NUMBER },
                        careerReadiness: { type: Type.NUMBER },
                        recommendations: { type: Type.STRING },
                        suggestedNextSteps: { 
                            type: Type.ARRAY, 
                            description: "An array of exactly 3 actionable next steps.",
                            items: { type: Type.STRING } 
                        },
                    },
                    required: ['businessReadiness', 'careerReadiness', 'recommendations', 'suggestedNextSteps'],
                },
            },
        });

        const jsonString = response.text.trim();
        return JSON.parse(jsonString) as SummaryData;

    } catch (error) {
        console.error("Error generating summary:", error);
        // Return a default/error summary object
        return {
            businessReadiness: 0,
            careerReadiness: 0,
            recommendations: "Could not generate recommendations due to an error.",
            suggestedNextSteps: ["Error generating suggestions. Please try again."],
        };
    }
};
