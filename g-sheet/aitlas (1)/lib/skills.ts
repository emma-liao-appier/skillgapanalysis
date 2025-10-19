import { SkillCategory } from '../types';

interface PredefinedSkill {
    name: string;
    description: string;
}

interface SkillCategoryData {
    category: SkillCategory;
    skills: PredefinedSkill[];
}

export const PREDEFINED_SKILLS: SkillCategoryData[] = [
    {
        category: SkillCategory.ProblemSolving,
        skills: [
            { name: 'Data Analysis', description: 'Ability to collect, organize, and interpret data to make informed decisions.' },
            { name: 'Root Cause Analysis', description: 'Systematically identifying the fundamental cause of a problem rather than its symptoms.' },
            { name: 'Strategic Thinking', description: 'Aligning actions and decisions with long-term organizational goals.' },
        ],
    },
    {
        category: SkillCategory.Communication,
        skills: [
            { name: 'Stakeholder Management', description: 'Effectively managing relationships and expectations with key stakeholders.' },
            { name: 'Technical Presentation', description: 'Clearly communicating complex technical information to diverse audiences.' },
            { name: 'Cross-functional Collaboration', description: 'Working effectively with teams from different departments to achieve common goals.' },
        ],
    },
    {
        category: SkillCategory.AICapability,
        skills: [
            { name: 'AI Literacy', description: 'Understanding the basic concepts, capabilities, and limitations of AI technologies.' },
            { name: 'Prompt Engineering', description: 'Skillfully crafting inputs for AI models to generate desired and accurate outputs.' },
            { name: 'AI-Powered Tool Utilization', description: 'Leveraging AI tools to enhance productivity, automate tasks, and generate insights.' },
        ],
    },
    {
        category: SkillCategory.Leadership,
        skills: [
            { name: 'Mentoring & Coaching', description: 'Guiding and developing the skills and knowledge of team members.' },
            { name: 'Decision Making', description: 'Making timely and well-reasoned decisions, even with incomplete information.' },
            { name: 'Project Management', description: 'Planning, executing, and overseeing projects to ensure they are completed on time and within budget.' },
        ],
    },
];
