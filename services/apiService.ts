import { AssessmentData, Skill, SummaryData } from '../types';

type AssessmentStatus = 'draft' | 'completed' | 'archived';

type AssessmentUpdatePayload = Partial<AssessmentData> & {
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

  private buildAssessmentUpdatePayload(userProfile: any, updates: AssessmentUpdatePayload) {
    const payload: any = {
      userEmail: this.normalizeEmail(userProfile.email),
    };

    const fields: (keyof AssessmentUpdatePayload)[] = [
      'language',
      'role',
      'careerGoal',
      'peerFeedback',
      'careerIntro',
      'businessGoal',
      'keyResults',
      'businessSkills',
      'careerSkills',
      'businessFeedbackSupport',
      'businessFeedbackObstacles',
      'careerFeedback',
      'summary',
      'nextSteps',
      'nextStepsOther',
      'finalThoughts',
      'additionalInputs',
      'status'
    ];

    fields.forEach(field => {
      const value = updates[field];
      if (value !== undefined) {
        payload[field] = this.cloneValue(value);
      }
    });

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

    return payload;
  }

  private async upsertAssessment(userProfile: any, updates: AssessmentUpdatePayload) {
    const assessments = await this.getUserAssessments(userProfile.id) as any[];

    if (assessments.length > 0) {
      const latestAssessment = assessments.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )[0];

      const updatePayload = this.buildAssessmentUpdatePayload(userProfile, updates);
      return this.updateAssessment(latestAssessment._id, updatePayload);
    }

    const createPayload = this.buildAssessmentCreatePayload(userProfile, updates);
    return this.createAssessment(createPayload as any);
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

  // 保存業務目標和關鍵結果
  async saveBusinessData(email: string, updates: AssessmentUpdatePayload) {
    const userProfile = await this.getCachedUserProfile(email);
    const normalizedEmail = this.normalizeEmail(email);

    if (updates.businessGoal && updates.businessGoal !== userProfile.q4Okr) {
      const updatedUser = await this.updateUser(userProfile.id, { q4Okr: updates.businessGoal });
      userProfile.q4Okr = updatedUser.q4Okr;
      this.userProfileCache[normalizedEmail] = userProfile;
    }

    return this.upsertAssessment(userProfile, updates);
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

  // 保存職業發展資料到資料庫
  async saveCareerData(email: string, updates: AssessmentUpdatePayload) {
    const userProfile = await this.getCachedUserProfile(email);
    return this.upsertAssessment(userProfile, updates);
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
