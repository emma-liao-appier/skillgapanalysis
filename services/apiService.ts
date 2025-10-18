import { AssessmentData, Skill, SummaryData } from '../types';

type AssessmentStatus = 'draft' | 'completed' | 'archived';

type AssessmentUpdatePayload = Partial<AssessmentData> & {
  languageCode?: string;
  languageLabel?: string;
  additionalInputs?: any;
  status?: AssessmentStatus;
};

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';

class ApiService {
  private userProfileCache: { [email: string]: any } = {};
  private pendingRequests: Map<string, Promise<any>> = new Map();

  private normalizeEmail(email: string) {
    return email?.toLowerCase();
  }

  private cloneValue<T>(value: T): T {
    if (Array.isArray(value)) {
      return [...value] as T;
    }
    if (value && typeof value === 'object') {
      return { ...(value as Record<string, unknown>) } as T;
    }
    return value;
  }

  private async getCachedUserProfile(email: string) {
    const cacheKey = this.normalizeEmail(email);
    if (!this.userProfileCache[cacheKey]) {
      const profile = await this.getUserProfile(email) as any;
      this.userProfileCache[cacheKey] = profile;
    }
    return this.userProfileCache[cacheKey];
  }

  private buildAssessmentUpdatePayload(userProfile: any, updates: AssessmentUpdatePayload, existing?: any) {
    const payload: any = {
      userEmail: this.normalizeEmail(userProfile.email),
    };

    const currentAssessment = existing ?? {};

    const resolveLanguage = (value?: string) => value ?? currentAssessment.language ?? 'English';
    const languageValue = updates.language;

    if (languageValue !== undefined) {
      payload.language = languageValue;
    }

    if (
      languageValue !== undefined ||
      updates.languageCode !== undefined ||
      updates.languageLabel !== undefined ||
      currentAssessment.languageSelection
    ) {
      const resolvedLanguage = resolveLanguage(languageValue);
      payload.languageSelection = {
        code: updates.languageCode ?? currentAssessment.languageSelection?.code,
        label: updates.languageLabel ?? currentAssessment.languageSelection?.label ?? resolvedLanguage,
        value: resolvedLanguage
      };
    }

    const businessStage: any = { ...(currentAssessment.businessStage || {}) };
    if (updates.role !== undefined) {
      payload.role = updates.role;
      businessStage.role = updates.role;
    }
    if (updates.businessGoal !== undefined) {
      payload.businessGoal = updates.businessGoal;
      businessStage.goal = updates.businessGoal;
    }
    if (updates.keyResults !== undefined) {
      payload.keyResults = updates.keyResults;
      businessStage.keyResults = updates.keyResults;
    }
    if (updates.businessSkills !== undefined) {
      const clonedSkills = this.cloneValue(updates.businessSkills);
      payload.businessSkills = clonedSkills;
      businessStage.skills = clonedSkills;
    }
    if (updates.businessFeedbackSupport !== undefined) {
      payload.businessFeedbackSupport = updates.businessFeedbackSupport ?? '';
      businessStage.supportNeeds = updates.businessFeedbackSupport ?? '';
    }
    if (updates.businessFeedbackObstacles !== undefined) {
      payload.businessFeedbackObstacles = updates.businessFeedbackObstacles ?? '';
      businessStage.obstacles = updates.businessFeedbackObstacles ?? '';
    }
    if (Object.keys(businessStage).length > 0) {
      payload.businessStage = businessStage;
    }

    const careerStage: any = { ...(currentAssessment.careerStage || {}) };
    if (updates.careerGoal !== undefined) {
      payload.careerGoal = updates.careerGoal;
      careerStage.goal = updates.careerGoal;
    }
    if (updates.peerFeedback !== undefined) {
      payload.peerFeedback = updates.peerFeedback ?? '';
      careerStage.peerFeedback = updates.peerFeedback ?? '';
    }
    if (updates.careerIntro !== undefined) {
      payload.careerIntro = updates.careerIntro ?? '';
      careerStage.intro = updates.careerIntro ?? '';
    }
    if (updates.careerSkills !== undefined) {
      const clonedCareerSkills = this.cloneValue(updates.careerSkills);
      payload.careerSkills = clonedCareerSkills;
      careerStage.skills = clonedCareerSkills;
    }
    if (updates.careerFeedback !== undefined) {
      payload.careerFeedback = updates.careerFeedback ?? '';
      careerStage.selfReflection = updates.careerFeedback ?? '';
    }
    if (Object.keys(careerStage).length > 0) {
      payload.careerStage = careerStage;
    }

    const finalInput: any = { ...(currentAssessment.finalInput || {}) };
    if (updates.nextSteps !== undefined) {
      const selections = this.cloneValue(updates.nextSteps);
      payload.nextSteps = selections;
      finalInput.selections = selections;
    }
    if (updates.nextStepsOther !== undefined) {
      const other = updates.nextStepsOther ?? '';
      payload.nextStepsOther = other;
      finalInput.otherText = other;
    }
    if (updates.finalThoughts !== undefined) {
      const reflections = updates.finalThoughts ?? '';
      payload.finalThoughts = reflections;
      finalInput.reflections = reflections;
    }
    if (Object.keys(finalInput).length > 0) {
      payload.finalInput = finalInput;
    }

    if (updates.summary !== undefined) {
      payload.summary = this.cloneValue(updates.summary);
    }

    if (updates.additionalInputs !== undefined) {
      payload.additionalInputs = this.cloneValue(updates.additionalInputs);
    }

    if (updates.status !== undefined) {
      payload.status = updates.status;
    }

    return payload;
  }

  private buildAssessmentCreatePayload(userProfile: any, updates: AssessmentUpdatePayload) {
    const payload: any = {
      userId: userProfile.id,
      userEmail: this.normalizeEmail(userProfile.email),
      language: updates.language ?? 'English',
      role: updates.role ?? userProfile.role ?? 'Unknown Role',
      careerGoal: updates.careerGoal ?? 'To be defined',
      peerFeedback: updates.peerFeedback ?? '',
      careerIntro: updates.careerIntro ?? '',
      businessGoal: updates.businessGoal ?? 'To be defined',
      keyResults: updates.keyResults ?? 'To be defined',
      businessSkills: updates.businessSkills ? this.cloneValue(updates.businessSkills) : [],
      careerSkills: updates.careerSkills ? this.cloneValue(updates.careerSkills) : [],
      businessFeedbackSupport: updates.businessFeedbackSupport ?? '',
      businessFeedbackObstacles: updates.businessFeedbackObstacles ?? '',
      careerFeedback: updates.careerFeedback ?? '',
      nextSteps: updates.nextSteps ? this.cloneValue(updates.nextSteps) : [],
      nextStepsOther: updates.nextStepsOther ?? '',
      finalThoughts: updates.finalThoughts ?? '',
      status: updates.status ?? 'draft'
    };

    if (updates.summary !== undefined) {
      payload.summary = this.cloneValue(updates.summary);
    }

    if (updates.additionalInputs !== undefined) {
      payload.additionalInputs = this.cloneValue(updates.additionalInputs);
    }

    payload.languageSelection = {
      code: updates.languageCode ?? undefined,
      label: updates.languageLabel ?? payload.language,
      value: payload.language
    };

    payload.businessStage = {
      role: payload.role,
      goal: payload.businessGoal,
      keyResults: payload.keyResults,
      skills: payload.businessSkills,
      supportNeeds: payload.businessFeedbackSupport,
      obstacles: payload.businessFeedbackObstacles
    };

    payload.careerStage = {
      goal: payload.careerGoal,
      peerFeedback: payload.peerFeedback,
      intro: payload.careerIntro,
      skills: payload.careerSkills,
      selfReflection: payload.careerFeedback
    };

    payload.finalInput = {
      selections: payload.nextSteps,
      otherText: payload.nextStepsOther,
      reflections: payload.finalThoughts
    };

    return payload;
  }

  private async upsertAssessment(userProfile: any, updates: AssessmentUpdatePayload) {
    try {
      const assessments = await this.getUserAssessments(userProfile.id) as any[];

      if (assessments.length > 0) {
        const latestAssessment = assessments.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )[0];

        const updatePayload = this.buildAssessmentUpdatePayload(userProfile, updates, latestAssessment);
        return this.updateAssessment(latestAssessment._id, updatePayload);
      }

      const createPayload = this.buildAssessmentCreatePayload(userProfile, updates);
      return this.createAssessment(createPayload as any);
    } catch (error) {
      console.error('Error in upsertAssessment:', error);
      throw error;
    }
  }
  
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // 創建請求的唯一標識符
    const requestKey = `${options.method || 'GET'}:${endpoint}:${JSON.stringify(options.body || '')}`;
    
    // 如果相同的請求正在進行中，返回該請求的Promise
    if (this.pendingRequests.has(requestKey)) {
      return this.pendingRequests.get(requestKey);
    }
    
    const requestPromise = this.executeRequest<T>(endpoint, options);
    
    // 將請求添加到進行中的請求Map
    this.pendingRequests.set(requestKey, requestPromise);
    
    try {
      const result = await requestPromise;
      return result;
    } finally {
      // 請求完成後從Map中移除
      this.pendingRequests.delete(requestKey);
    }
  }
  
  private async executeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // User management
  async createUser(email: string, name: string, role?: string, department?: string) {
    return this.makeRequest('/api/users', {
      method: 'POST',
      body: JSON.stringify({ email, name, role, department }),
    });
  }

  async getUserByEmail(email: string) {
    return this.makeRequest(`/api/users/email/${encodeURIComponent(email)}`);
  }

  async lookupUserByEmail(email: string) {
    return this.makeRequest(`/api/users/lookup/${encodeURIComponent(email)}`);
  }

  // SSO 認證
  async authenticateSSO(email: string) {
    return this.makeRequest('/api/users/authenticate', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // 獲取用戶完整檔案
  async getUserProfile(email: string) {
    return this.makeRequest(`/api/users/profile/${encodeURIComponent(email)}`);
  }

  // 技能推薦和管理
  async recommendSkills(email: string, businessGoal: string, keyResults: string) {
    return this.makeRequest(`/api/skills/recommend/${encodeURIComponent(email)}`, {
      method: 'POST',
      body: JSON.stringify({ businessGoal, keyResults }),
    });
  }

  async getSkillsForAddSkill(category?: string, search?: string) {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    
    return this.makeRequest(`/api/skills/add-skill?${params.toString()}`);
  }

  async createSkill(skillData: {
    name: string;
    description: string;
    skillBenefit?: string;
    category: string;
    type: string;
    division?: string;
    department?: string;
  }) {
    return this.makeRequest('/api/skills', {
      method: 'POST',
      body: JSON.stringify(skillData),
    });
  }

  async acceptRecommendedSkills(email: string, skills: any[]) {
    return this.makeRequest(`/api/skills/accept/${encodeURIComponent(email)}`, {
      method: 'POST',
      body: JSON.stringify({ skills }),
    });
  }

  async updateAssessment(assessmentId: string, updates: Partial<AssessmentData>) {
    console.log('Updating assessment:', assessmentId, 'with data:', updates);
    return this.makeRequest(`/api/assessments/${assessmentId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async getAssessment(assessmentId: string) {
    return this.makeRequest(`/api/assessments/${assessmentId}`);
  }

  async getUserAssessments(userId: string) {
    return this.makeRequest(`/api/assessments/user/${userId}`);
  }

  async createAssessment(assessmentData: Partial<AssessmentData>) {
    return this.makeRequest('/api/assessments', {
      method: 'POST',
      body: JSON.stringify(assessmentData),
    });
  }

  // 更新用戶資料
  async updateUser(userId: string, userData: any) {
    return this.makeRequest(`/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  // 保存業務目標和關鍵結果 - 使用新的增量更新 API
  async saveBusinessData(email: string, updates: AssessmentUpdatePayload) {
    try {
      console.log('Saving business data for:', email, 'with updates:', updates);
      const userProfile = await this.getCachedUserProfile(email);
      const normalizedEmail = this.normalizeEmail(email);

      if (updates.businessGoal && updates.businessGoal !== userProfile.q4Okr) {
        console.log('Updating user q4Okr:', updates.businessGoal);
        const updatedUser = await this.updateUser(userProfile.id, { q4Okr: updates.businessGoal });
        userProfile.q4Okr = updatedUser.q4Okr;
        this.userProfileCache[normalizedEmail] = userProfile;
      }

      // 使用新的增量更新 API
      const result = await this.makeRequest('/api/assessments/incremental/business', {
        method: 'PUT',
        body: JSON.stringify({
          userEmail: normalizedEmail,
          period: '2025Q4',
          role: updates.role,
          businessGoal: updates.businessGoal,
          keyResults: updates.keyResults,
          businessSkills: updates.businessSkills,
          businessFeedbackSupport: updates.businessFeedbackSupport,
          businessFeedbackObstacles: updates.businessFeedbackObstacles
        })
      });

      console.log('Business data saved successfully:', result);
      return result;
    } catch (error) {
      console.error('Error saving business data:', error);
      throw error;
    }
  }

  // 載入用戶的評估資料
  async loadUserAssessment(email: string) {
    const userProfile = await this.getUserProfile(email) as any;
    const userId = userProfile.id;
    const assessments = await this.getUserAssessments(userId) as any[];

    if (assessments.length > 0) {
      // 返回最新的評估（按 updatedAt 排序）
      const latestAssessment = assessments.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
      return latestAssessment;
    }
    return null;
  }

  // 保存職業發展資料到資料庫 - 使用新的增量更新 API
  async saveCareerData(email: string, updates: AssessmentUpdatePayload) {
    try {
      console.log('Saving career data for:', email, 'with updates:', updates);
      const userProfile = await this.getCachedUserProfile(email);
      const normalizedEmail = this.normalizeEmail(email);

      // 使用新的增量更新 API
      const result = await this.makeRequest('/api/assessments/incremental/career', {
        method: 'PUT',
        body: JSON.stringify({
          userEmail: normalizedEmail,
          period: '2025Q4',
          careerGoal: updates.careerGoal,
          careerDevelopmentFocus: updates.careerDevelopmentFocus,
          careerFeedbackThemes: updates.careerFeedbackThemes,
          careerSkills: updates.careerSkills
        })
      });

      console.log('Career data saved successfully:', result);
      return result;
    } catch (error) {
      console.error('Error saving career data:', error);
      throw error;
    }
  }

  // 保存摘要資料 - 使用新的增量更新 API
  async saveSummaryData(email: string, updates: AssessmentUpdatePayload) {
    try {
      console.log('Saving summary data for:', email, 'with updates:', updates);
      const userProfile = await this.getCachedUserProfile(email);
      const normalizedEmail = this.normalizeEmail(email);

      // 使用新的增量更新 API
      const result = await this.makeRequest('/api/assessments/incremental/summary', {
        method: 'PUT',
        body: JSON.stringify({
          userEmail: normalizedEmail,
          period: '2025Q4',
          nextSteps: updates.nextSteps,
          nextStepsOther: updates.nextStepsOther,
          finalThoughts: updates.finalThoughts
        })
      });

      console.log('Summary data saved successfully:', result);
      return result;
    } catch (error) {
      console.error('Error saving summary data:', error);
      throw error;
    }
  }

  // 保存分析資料 - 使用新的增量更新 API
  async saveAnalyticsData(email: string, updates: AssessmentUpdatePayload) {
    try {
      console.log('Saving analytics data for:', email, 'with updates:', updates);
      const userProfile = await this.getCachedUserProfile(email);
      const normalizedEmail = this.normalizeEmail(email);

      // 使用新的增量更新 API
      const result = await this.makeRequest('/api/assessments/incremental/analytics', {
        method: 'PUT',
        body: JSON.stringify({
          userEmail: normalizedEmail,
          period: '2025Q4',
          readinessBusiness: updates.readinessBusiness,
          readinessCareer: updates.readinessCareer,
          alignmentScore: updates.alignmentScore,
          talentType: updates.talentType,
          focusAreas: updates.focusAreas,
          categoryAverages: updates.categoryAverages
        })
      });

      console.log('Analytics data saved successfully:', result);
      return result;
    } catch (error) {
      console.error('Error saving analytics data:', error);
      throw error;
    }
  }

  // AI-powered generation
  async generateKeyResults(role: string, businessGoal: string) {
    return this.makeRequest('/api/assessments/generate-key-results', {
      method: 'POST',
      body: JSON.stringify({ role, businessGoal }),
    });
  }

  async generateBusinessSkills(assessmentId: string, role: string, businessGoal: string, keyResults?: string) {
    return this.makeRequest(`/api/assessments/${assessmentId}/generate-business-skills`, {
      method: 'POST',
      body: JSON.stringify({ role, businessGoal, keyResults }),
    });
  }

  async generateCareerSkills(assessmentId: string, role: string, careerGoal: string, peerFeedback?: string) {
    return this.makeRequest(`/api/assessments/${assessmentId}/generate-career-skills`, {
      method: 'POST',
      body: JSON.stringify({ role, careerGoal, peerFeedback }),
    });
  }

  async generateSummary(assessmentId: string): Promise<{ summary: SummaryData }> {
    return this.makeRequest<{ summary: SummaryData }>(`/api/assessments/${assessmentId}/generate-summary`, {
      method: 'POST',
    });
  }

  async optimizeText(text: string) {
    return this.makeRequest('/api/assessments/optimize-text', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  async optimizeBusinessGoal(role: string, businessGoal: string) {
    return this.makeRequest('/api/assessments/optimize-business-goal', {
      method: 'POST',
      body: JSON.stringify({ role, businessGoal }),
    });
  }

  // 360 Feedback
  async createFeedbackInvites(inviteData: any) {
    return this.makeRequest('/api/feedback/invites', {
      method: 'POST',
      body: JSON.stringify(inviteData),
    });
  }

  async getFeedbackInvites(email: string) {
    return this.makeRequest(`/api/feedback/invites?email=${encodeURIComponent(email)}`);
  }

  async getPendingInviteCount(email: string) {
    return this.makeRequest(`/api/feedback/invites/count?email=${encodeURIComponent(email)}`);
  }

  async submitFeedbackResponse(inviteId: string, responseData: any) {
    return this.makeRequest(`/api/feedback/invites/${inviteId}/respond`, {
      method: 'POST',
      body: JSON.stringify(responseData),
    });
  }

  async getFeedbackSummary(assessmentId: string) {
    return this.makeRequest(`/api/feedback/assessees/${assessmentId}/summary`);
  }

  // Health check
  async healthCheck() {
    return this.makeRequest('/health');
  }
}

export const apiService = new ApiService();
