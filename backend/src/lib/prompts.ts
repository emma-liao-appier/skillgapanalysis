/**
 * AItlas Prompt Configuration
 * 集中管理所有 AItlas AI 生成的 prompt 模板
 */

export interface PromptConfig {
  version: string;
  model: string;
  prompts: {
    business: {
      keyResults: string;
      businessSkills: string;
      optimizeBusinessGoal: string;
    };
    career: {
      careerAnalysis: string;
      optimizeCareerGoal: string;
    };
    summary: {
      talentTypeAnalysis: string;
      vennDiagramFeedback: string;
      suggestedNextSteps: string;
    };
    utility: {
      skillSimilarityCheck: string;
    };
  };
}

export const AITLAS_PROMPTS: PromptConfig = {
  version: "1.0.0",
  model: "gemini-2.5-flash",
  prompts: {
    business: {
      keyResults: `
        Suggest 3 specific and measurable Key Results (KRs) for the following objective.
        The person responsible for this objective is a "{{role}}".
        The objective is: "{{businessGoal}}".

        Return ONLY the Key Results as a bulleted list, with each KR on a new line starting with a dash. Do not include any introductory text or explanations. For example:
        - Increase user engagement by 15%
        - Launch the new feature by the end of Q3
        - Reduce customer churn by 5%
      `,

      businessSkills: `
        You are a skills analyst. Your task is to recommend 5 skills for a person with the role '{{role}}' working towards this business goal: "{{businessGoal}}".
        {{#if keyResults}}Consider these specific key results as well: "{{keyResults}}".{{/if}}

        Perform the following two tasks:
        1. Select exactly 3 skills from the following list of General skills that are most relevant. Only return the names of the skills you select.
        2. Generate exactly 2 new 'Functional' skills. These should be specific, technical, or domain-specific skills directly related to the user's role and goal. For each functional skill, provide a name and a description.

        General Skills List:
        {{predefinedSkillsString}}
      `,

      optimizeBusinessGoal: `
        You are a business strategy consultant and career coach. A user in the role of "{{role}}" has written this goal: "{{businessGoal}}".
        Your task is to refine it into one clear, specific, and actionable business objective that describes what success looks like this quarter.

        Current Role: "{{role}}"
        Original Business Goal: "{{businessGoal}}"

        Guidelines:
        - Keep it concise (one sentence, max two)
        - Focus on the intended *outcome or impact*, not tasks
        - Use clear, professional, and motivational language
        - Make sure it fits the responsibilities of the {{role}}

        Return only the rewritten business goal.
      `
    },

    career: {
      careerAnalysis: `
        You are a professional talent development coach. Based on the user's career development scenario, recommend the most relevant skills for their growth.

        User's Current Role: "{{currentRole}}"
        User's Personal Growth Goal for the Year: "{{careerGoal}}"
        Recent Feedback Received by User: "{{peerFeedback}}"

        Your task is to:

        1. **Select General Skills:** Select exactly 3 skills from the following list that are most relevant for their growth goal.

        2. **Generate Functional Skills:** Generate exactly 2 new 'Functional' skills that directly relate to achieving their stated goal.

        General Skills List:
        {{predefinedSkillsString}}
      `,

      optimizeCareerGoal: `
        You are a career coach. A user has provided the following text about their personal development goal. Rewrite it to be more constructive, specific, and actionable. Keep it concise (1-2 sentences) and encouraging.
        Original text: "{{textToOptimize}}"
        
        Return only the rewritten text, without any preamble.
      `
    },

    summary: {
      talentTypeAnalysis: `
        You are a talent development expert. Analyze the user's career development profile using a comprehensive alignment scoring system.

        User Profile:
        - Current Role: {{role}}
        - Business Goal: {{businessGoal}}
        - Career Goal: {{careerGoal}}
        - Key Results: {{keyResults}}

        Skill Assessment:
        Business Skills Ratings (1=Needs Development, 5=Expert):
        {{businessSkillsRatings}}

        Career Growth Skills Ratings (1=Needs Development, 5=Expert):
        {{careerSkillsRatings}}

        User Context: {{businessFeedbackSupport}}, {{careerFeedback}}

        Calculate alignment score using these components:
        1. **Skill Overlap Rate (40%)**: Percentage of skills that appear in both business and career lists
        2. **Skill Rating Similarity (30%)**: How close the ratings are for shared skills (indicates consistent effort direction)
        3. **Category Balance Index (20%)**: How well-distributed skills are across categories (Functional, Leadership, etc.)
        4. **Semantic Match (10%)**: Keyword overlap between business and career goals

        Provide analysis:
        1. "alignmentScore": Numerical score (0-100) based on the weighted calculation above
        2. "alignmentLevel": "High" (70+), "Partial" (40-69), or "Low" (<40) based on alignment score
        3. "readinessLevel": "High" (75+), "Medium" (50-74), or "Low" (<50) based on average skill ratings
        4. "talentType": One of these types based on alignment + readiness matrix:
           - Strategic Contributor (High alignment + High readiness)
           - Emerging Talent (High alignment + Medium readiness)
           - Foundational Builder (High alignment + Low readiness)
           - Functional Expert (Partial alignment + High readiness)
           - Evolving Generalist (Partial alignment + Medium readiness)
           - Exploring Talent (Partial alignment + Low readiness)
           - Re-direction Needed (Low alignment + High readiness)
           - Potential Shifter (Low alignment + Medium readiness)
           - Career Explorer (Low alignment + Low readiness)
        5. "talentDescription": A brief, encouraging description of this talent type (2-3 sentences)
        6. "focusAreas": Array of 2-3 skill categories that need the most development
        7. "recommendations": Array of 3-4 specific, actionable recommendations for this talent type
        8. "alignmentInsights": Brief explanation of what's driving the alignment score (strengths and gaps)
      `,

      vennDiagramFeedback: `
        You are a career coach providing targeted feedback based on the user's comprehensive assessment results.

        User Profile:
        - Role: {{role}}
        - Business Goal: {{businessGoal}}
        - Career Goal: {{careerGoal}}
        - Business Skills Average: {{businessSkillsAverage}}/5
        - Career Skills Average: {{careerSkillsAverage}}/5
        - Alignment Score: {{alignmentScore}}%

        Alignment Analysis Components:
        - Skill Overlap Rate: {{skillOverlapRate}}%
        - Skill Rating Similarity: {{skillRatingSimilarity}}%
        - Category Balance: {{categoryBalance}}%
        - Semantic Match: {{semanticMatch}}%

        Provide constructive, actionable feedback for each area:

        1. "businessFeedback": Specific advice for improving business readiness (2-3 sentences, actionable)
           - Focus on skill gaps and development opportunities
           - Consider their current role and business goals
           - Provide concrete next steps

        2. "careerFeedback": Specific advice for career development (2-3 sentences, actionable)
           - Address career growth opportunities
           - Consider skill development for future roles
           - Provide actionable career advancement steps

        3. "alignmentFeedback": Specific advice for aligning business and career goals (2-3 sentences, actionable)
           - Address alignment gaps identified in the analysis
           - Suggest ways to bridge business and career development
           - Provide strategies for creating synergy

        Make each feedback:
        - Constructive and encouraging
        - Specific and actionable
        - Relevant to their current situation
        - Focused on next steps they can take within 3-6 months
      `,

      suggestedNextSteps: `
        You are a career development coach creating a personalized action plan based on the user's complete assessment.

        Complete User Profile:
        - Role: {{role}}
        - Business Goal: {{businessGoal}}
        - Career Goal: {{careerGoal}}
        - Key Results: {{keyResults}}
        
        Skill Assessment Results:
        Business Skills: {{businessSkillsRatings}}
        Career Skills: {{careerSkillsRatings}}
        
        Talent Analysis:
        - Talent Type: {{talentType}}
        - Focus Areas: {{focusAreas}}
        - Alignment Level: {{alignmentLevel}}
        - Readiness Level: {{readinessLevel}}
        
        User Context: {{businessFeedbackSupport}}, {{careerFeedback}}

        Generate exactly 3 personalized, actionable next steps that:
        1. Address their lowest-rated skills
        2. Align with their talent type and development needs
        3. Are specific and achievable within 3-6 months
        4. Build toward their stated goals
        5. Include concrete actions (e.g., "Lead a cross-functional project", "Complete a certification in...")

        Return as an array of 3 concise action items.
      `
    },

    utility: {
      skillSimilarityCheck: `
        You are a skill similarity analyzer. Compare the new skill with existing functional skills and determine if they are too similar.
        
        New Skill:
        Name: "{{newSkillName}}"
        Description: "{{newSkillDescription}}"
        
        Existing Functional Skills:
        {{existingSkillsString}}
        
        Analyze if the new skill is too similar to any existing skill. Consider:
        1. Core competencies overlap
        2. Skill scope similarity
        3. Domain specificity
        
        Return JSON with:
        - "isDuplicate": boolean (true if similarity > 80%)
        - "similarSkill": object with name and description if duplicate found, null otherwise
        - "similarityScore": number (0-100)
      `
    }
  }
};

/**
 * Prompt 模板渲染器
 * 使用簡單的模板語法替換變數
 */
export class PromptRenderer {
  /**
   * 渲染 prompt 模板
   * @param template - prompt 模板字串
   * @param variables - 變數物件
   * @returns 渲染後的 prompt
   */
  static render(template: string, variables: Record<string, any>): string {
    let rendered = template;

    // 處理條件語法 {{#if variable}}...{{/if}}
    rendered = rendered.replace(/\{\{#if\s+(\w+)\}\}(.*?)\{\{\/if\}\}/gs, (match, variable, content) => {
      return variables[variable] ? content : '';
    });

    // 處理一般變數替換 {{variable}}
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      rendered = rendered.replace(regex, variables[key] || '');
    });

    return rendered.trim();
  }

  /**
   * 獲取特定類型的 prompt
   * @param category - prompt 類別 (business, career, summary, utility)
   * @param type - prompt 類型
   * @returns prompt 模板
   */
  static getPrompt(category: keyof PromptConfig['prompts'], type: string): string {
    const categoryPrompts = AITLAS_PROMPTS.prompts[category] as any;
    return categoryPrompts[type] || '';
  }

  /**
   * 渲染特定 prompt
   * @param category - prompt 類別
   * @param type - prompt 類型
   * @param variables - 變數
   * @returns 渲染後的 prompt
   */
  static renderPrompt(
    category: keyof PromptConfig['prompts'], 
    type: string, 
    variables: Record<string, any>
  ): string {
    const template = PromptRenderer.getPrompt(category, type);
    return PromptRenderer.render(template, variables);
  }
}

/**
 * Prompt 版本管理
 */
export class PromptVersionManager {
  private static currentVersion = AITLAS_PROMPTS.version;

  /**
   * 獲取當前 prompt 版本
   */
  static getCurrentVersion(): string {
    return this.currentVersion;
  }

  /**
   * 檢查 prompt 版本
   * @param version - 要檢查的版本
   * @returns 是否為當前版本
   */
  static isCurrentVersion(version: string): boolean {
    return version === this.currentVersion;
  }

  /**
   * 獲取 prompt 配置
   * @param version - 版本號 (可選，預設使用當前版本)
   * @returns prompt 配置
   */
  static getConfig(version?: string): PromptConfig {
    if (version && !this.isCurrentVersion(version)) {
      console.warn(`Requested prompt version ${version} is not current. Using version ${this.currentVersion}`);
    }
    return AITLAS_PROMPTS;
  }
}

// 匯出常用的 prompt 渲染方法
export const renderPrompt = PromptRenderer.renderPrompt;
export const getPrompt = PromptRenderer.getPrompt;
