import { AssessmentData, Skill, SummaryData } from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';

class ApiService {
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
  async saveBusinessData(email: string, businessGoal: string, keyResults: string, businessSkills?: any[], businessFeedbackSupport?: string, businessFeedbackObstacles?: string) {
    // 首先獲取用戶 ID
    const userProfile = await this.getUserProfile(email) as any;
    const userId = userProfile.id;

    // 更新用戶的 q4Okr 欄位（如果 businessGoal 有變更）
    if (businessGoal && businessGoal !== userProfile.q4Okr) {
      await this.updateUser(userId, { q4Okr: businessGoal });
    }

    // 檢查是否已有進行中的評估
    const assessments = await this.getUserAssessments(userId) as any[];
    
    if (assessments.length > 0) {
      // 總是使用最新的評估（按 updatedAt 排序）
      const latestAssessment = assessments.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
      
      // 更新現有評估
      return this.updateAssessment(latestAssessment._id, {
        businessGoal,
        keyResults,
        businessSkills: businessSkills || [],
        businessFeedbackSupport: businessFeedbackSupport || '',
        businessFeedbackObstacles: businessFeedbackObstacles || ''
      });
    } else {
      // 只有在沒有任何評估時才創建新的
      const newAssessment = await this.createAssessment({
        userId,
        language: 'English',
        role: userProfile.role,
        careerGoal: 'To be defined',
        businessGoal,
        keyResults,
        businessSkills: businessSkills || [],
        careerSkills: [],
        businessFeedbackSupport: businessFeedbackSupport || '',
        businessFeedbackObstacles: businessFeedbackObstacles || ''
      } as any);
      return newAssessment;
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

  // 保存職業發展資料到資料庫
  async saveCareerData(email: string, careerGoal?: string, careerSkills?: any[], careerFeedback?: string, nextSteps?: string[], nextStepsOther?: string, finalThoughts?: string) {
    // 首先獲取用戶 ID
    const userProfile = await this.getUserProfile(email) as any;
    const userId = userProfile.id;

    // 檢查是否已有進行中的評估
    const assessments = await this.getUserAssessments(userId) as any[];
    
    if (assessments.length > 0) {
      // 總是使用最新的評估（按 updatedAt 排序）
      const latestAssessment = assessments.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
      
      // 準備更新資料
      const updateData: any = {};
      if (careerGoal !== undefined) updateData.careerGoal = careerGoal;
      if (careerSkills !== undefined) updateData.careerSkills = careerSkills;
      if (careerFeedback !== undefined) updateData.careerFeedback = careerFeedback;
      if (nextSteps !== undefined) updateData.nextSteps = nextSteps;
      if (nextStepsOther !== undefined) updateData.nextStepsOther = nextStepsOther;
      if (finalThoughts !== undefined) updateData.finalThoughts = finalThoughts;
      
      // 更新現有評估
      return this.updateAssessment(latestAssessment._id, updateData);
    } else {
      // 只有在沒有任何評估時才創建新的
      const newAssessment = await this.createAssessment({
        userId,
        language: 'English',
        role: userProfile.role,
        careerGoal: careerGoal || 'To be defined',
        businessGoal: 'To be defined',
        keyResults: 'To be defined',
        businessSkills: [],
        careerSkills: careerSkills || [],
        careerFeedback: careerFeedback || '',
        nextSteps: nextSteps || [],
        nextStepsOther: nextStepsOther || '',
        finalThoughts: finalThoughts || ''
      } as any);
      return newAssessment;
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
