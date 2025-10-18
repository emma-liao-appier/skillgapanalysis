import React, { useState } from 'react';
import { Step, AssessmentData, Skill, SummaryData, LanguageCode, BusinessStage, CareerStage } from './types';
import Header from './components/Header';
import SSOAuth from './components/SSOAuth';
import StepLanguage from './components/StepLanguage';
import StepIntro from './components/StepIntro';
import StepBusiness from './components/StepBusiness';
import StepCareer from './components/StepCareer';
import StepSummary from './components/StepSummary';
import { LanguageProvider } from './context/LanguageContext';
import { languages } from './lib/translations';
import { apiService } from './services/apiService';

// 擴展 Window 接口以包含 timeout 屬性
declare global {
  interface Window {
    businessGoalSaveTimeout?: NodeJS.Timeout;
    keyResultsSaveTimeout?: NodeJS.Timeout;
    businessFeedbackSupportSaveTimeout?: NodeJS.Timeout;
    businessFeedbackObstaclesSaveTimeout?: NodeJS.Timeout;
    careerGoalSaveTimeout?: NodeJS.Timeout;
    careerFeedbackSaveTimeout?: NodeJS.Timeout;
  }
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string;
  division: string;
  location: string;
  jobLevel: string;
  careerLadder: string;
  lineManager: string;
  functionalLead: string;
}

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>(Step.Language);
  const [businessStage, setBusinessStage] = useState<BusinessStage>('goal');
  const [careerStage, setCareerStage] = useState<CareerStage>('goal');
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [devMode, setDevMode] = useState(false);
  const [assessmentData, setAssessmentData] = useState<AssessmentData>({
    language: 'English',
    role: '',
    careerGoal: '',
    peerFeedback: '',
    businessGoal: 'As a [Your Role], my primary goal for this quarter is to increase team productivity and project delivery speed by 20%.',
    keyResults: '',
    businessSkills: [],
    careerSkills: [],
    businessFeedbackSupport: '',
    businessFeedbackObstacles: '',
    careerFeedback: '',
    nextSteps: [],
    nextStepsOther: '',
    finalThoughts: '',
  });

  // Mock data for developer mode
  const mockAssessmentData: AssessmentData = {
    language: 'English',
    role: 'Senior Software Engineer',
    careerGoal: 'I want to become a technical lead and mentor junior developers while building scalable systems.',
    peerFeedback: 'Great at problem-solving and always willing to help teammates. Could improve on project management.',
    businessGoal: 'As a Senior Software Engineer, my primary goal for this quarter is to increase team productivity and project delivery speed by 20%.',
    keyResults: '- Reduce bug resolution time by 15%\n- Implement two new features for the main product\n- Improve code review efficiency by 25%',
    businessSkills: [
      { id: '1', name: 'JavaScript Programming', description: 'Advanced JavaScript development', rating: 3, category: 'functional' as any },
      { id: '2', name: 'Project Management', description: 'Leading technical projects', rating: 2, category: 'leadership' as any },
      { id: '3', name: 'Code Review', description: 'Reviewing and improving code quality', rating: 4, category: 'communication' as any },
      { id: '4', name: 'System Design', description: 'Designing scalable architectures', rating: 3, category: 'problem_solving' as any },
      { id: '5', name: 'Database Optimization', description: 'Optimizing database performance', rating: 2, category: 'functional' as any },
    ],
    careerSkills: [
      { id: '6', name: 'Technical Leadership', description: 'Leading technical teams', rating: 2, category: 'leadership' as any },
      { id: '7', name: 'Mentoring', description: 'Guiding junior developers', rating: 3, category: 'communication' as any },
      { id: '8', name: 'Architecture Design', description: 'Designing system architectures', rating: 4, category: 'problem_solving' as any },
      { id: '9', name: 'Team Communication', description: 'Effective team communication', rating: 4, category: 'communication' as any },
      { id: '10', name: 'Agile Methodologies', description: 'Agile development practices', rating: 3, category: 'leadership' as any },
    ],
    businessFeedbackSupport: 'Need more time for focused development work and clearer project priorities.',
    businessFeedbackObstacles: 'Frequent context switching and unclear requirements slow down progress.',
    careerFeedback: 'Would benefit from more leadership opportunities and technical mentorship.',
    summary: {
      businessReadiness: 75,
      careerReadiness: 68,
      recommendations: 'You have strong technical skills and are well-positioned for growth. Focus on developing leadership capabilities and project management skills to advance your career.',
      suggestedNextSteps: [
        'Lead a small technical project to practice management skills',
        'Mentor a junior developer to develop coaching abilities',
        'Take on more system design responsibilities to build expertise'
      ]
    },
    nextSteps: [],
    nextStepsOther: '',
    finalThoughts: '',
  };

  const isBusinessComplete = assessmentData.businessSkills.length > 0 && assessmentData.businessSkills.every(s => s.rating > 0);
  const isCareerComplete = assessmentData.careerSkills.length > 0 && assessmentData.careerSkills.every(s => s.rating > 0);

  const updateBusinessSkills = (skills: Skill[]) => {
    setAssessmentData(prev => ({ ...prev, businessSkills: skills }));
  };

  const updateCareerSkills = async (skills: Skill[]) => {
    setAssessmentData(prev => ({ ...prev, careerSkills: skills }));
    
    // 立即保存到資料庫
    if (user?.email) {
      try {
        await apiService.saveCareerData(user.email, undefined, skills);
      } catch (error) {
        console.error('Error saving career skills:', error);
      }
    }
  };
  
  const updateRole = (role: string) => {
    setAssessmentData(prev => ({ ...prev, role }));
  };

  const handleUserAuthenticated = async (authenticatedUser: User) => {
    setUser(authenticatedUser);
    
    try {
      // 載入用戶的完整資料
      const userProfile = await apiService.getUserProfile(authenticatedUser.email) as any;
      
      // 載入現有的評估資料
      const existingAssessment = await apiService.loadUserAssessment(authenticatedUser.email) as any;
      
      // 更新 assessmentData 使用資料庫中的資料
      setAssessmentData(prev => ({ 
        ...prev, 
        role: authenticatedUser.role,
        businessGoal: userProfile?.q4Okr || prev.businessGoal, // 始終使用 q4Okr，不使用已保存的評估資料
        keyResults: existingAssessment?.keyResults || prev.keyResults,
        businessSkills: existingAssessment?.businessSkills || prev.businessSkills,
        careerSkills: existingAssessment?.careerSkills || prev.careerSkills,
        careerGoal: existingAssessment?.careerGoal || prev.careerGoal,
        careerFeedback: existingAssessment?.careerFeedback || prev.careerFeedback,
        nextSteps: existingAssessment?.nextSteps || prev.nextSteps,
        nextStepsOther: existingAssessment?.nextStepsOther || prev.nextStepsOther,
        finalThoughts: existingAssessment?.finalThoughts || prev.finalThoughts,
        businessFeedbackSupport: existingAssessment?.businessFeedbackSupport || prev.businessFeedbackSupport,
        businessFeedbackObstacles: existingAssessment?.businessFeedbackObstacles || prev.businessFeedbackObstacles,
        // 如果有其他需要載入的資料，可以在這裡添加
      }));
      
      setAuthError(null);
    } catch (error) {
      console.error('Error loading user profile:', error);
      // 如果載入失敗，至少設定基本資料
      setAssessmentData(prev => ({ ...prev, role: authenticatedUser.role }));
      setAuthError(null);
    }
  };

  const handleAuthError = (message: string) => {
    setAuthError(message);
  };
  
  const updateCareerGoal = async (goal: string) => {
    setAssessmentData(prev => ({ ...prev, careerGoal: goal }));
    
    // 使用防抖動機制，延遲保存到資料庫
    if (user?.email) {
      // 清除之前的定時器
      if (window.careerGoalSaveTimeout) {
        clearTimeout(window.careerGoalSaveTimeout);
      }
      
      // 設置新的定時器，1秒後保存
      window.careerGoalSaveTimeout = setTimeout(async () => {
        try {
          await apiService.saveCareerData(user.email, goal);
        } catch (error) {
          console.error('Error saving career goal:', error);
        }
      }, 1000);
    }
  };

  const updatePeerFeedback = (feedback: string) => {
    setAssessmentData(prev => ({ ...prev, peerFeedback: feedback }));
  };

  const updateCareerIntro = (intro: string) => {
    setAssessmentData(prev => ({ ...prev, careerIntro: intro }));
  };

  const updateBusinessGoal = async (goal: string) => {
    setAssessmentData(prev => ({ ...prev, businessGoal: goal }));
    
    // 使用防抖動機制，延遲保存到資料庫
    if (user?.email) {
      // 清除之前的定時器
      if (window.businessGoalSaveTimeout) {
        clearTimeout(window.businessGoalSaveTimeout);
      }
      
      // 設置新的定時器，1秒後保存
      window.businessGoalSaveTimeout = setTimeout(async () => {
        try {
          await apiService.saveBusinessData(
            user.email,
            goal,
            assessmentData.keyResults,
            assessmentData.businessSkills,
            assessmentData.businessFeedbackSupport,
            assessmentData.businessFeedbackObstacles
          );
        } catch (error) {
          console.error('Error saving business goal:', error);
        }
      }, 1000);
    }
  };

  const updateKeyResults = async (results: string) => {
    setAssessmentData(prev => ({ ...prev, keyResults: results }));
    
    // 使用防抖動機制，延遲保存到資料庫
    if (user?.email) {
      // 清除之前的定時器
      if (window.keyResultsSaveTimeout) {
        clearTimeout(window.keyResultsSaveTimeout);
      }
      
      // 設置新的定時器，1秒後保存
      window.keyResultsSaveTimeout = setTimeout(async () => {
        try {
          await apiService.saveBusinessData(
            user.email,
            assessmentData.businessGoal,
            results,
            assessmentData.businessSkills,
            assessmentData.businessFeedbackSupport,
            assessmentData.businessFeedbackObstacles
          );
        } catch (error) {
          console.error('Error saving key results:', error);
        }
      }, 1000);
    }
  };

  const updateBusinessFeedbackSupport = async (feedback: string) => {
    setAssessmentData(prev => ({ ...prev, businessFeedbackSupport: feedback }));
    
    // 使用防抖動機制，延遲保存到資料庫
    if (user?.email) {
      // 清除之前的定時器
      if (window.businessFeedbackSupportSaveTimeout) {
        clearTimeout(window.businessFeedbackSupportSaveTimeout);
      }
      
      // 設置新的定時器，1秒後保存
      window.businessFeedbackSupportSaveTimeout = setTimeout(async () => {
        try {
          await apiService.saveBusinessData(
            user.email,
            assessmentData.businessGoal,
            assessmentData.keyResults,
            assessmentData.businessSkills,
            feedback,
            assessmentData.businessFeedbackObstacles
          );
        } catch (error) {
          console.error('Error saving business feedback support:', error);
        }
      }, 1000);
    }
  };

  const updateBusinessFeedbackObstacles = async (feedback: string) => {
    setAssessmentData(prev => ({ ...prev, businessFeedbackObstacles: feedback }));
    
    // 使用防抖動機制，延遲保存到資料庫
    if (user?.email) {
      // 清除之前的定時器
      if (window.businessFeedbackObstaclesSaveTimeout) {
        clearTimeout(window.businessFeedbackObstaclesSaveTimeout);
      }
      
      // 設置新的定時器，1秒後保存
      window.businessFeedbackObstaclesSaveTimeout = setTimeout(async () => {
        try {
          await apiService.saveBusinessData(
            user.email,
            assessmentData.businessGoal,
            assessmentData.keyResults,
            assessmentData.businessSkills,
            assessmentData.businessFeedbackSupport,
            feedback
          );
        } catch (error) {
          console.error('Error saving business feedback obstacles:', error);
        }
      }, 1000);
    }
  };

  const updateCareerFeedback = async (feedback: string) => {
    setAssessmentData(prev => ({ ...prev, careerFeedback: feedback }));
    
    // 使用防抖動機制，延遲保存到資料庫
    if (user?.email) {
      // 清除之前的定時器
      if (window.careerFeedbackSaveTimeout) {
        clearTimeout(window.careerFeedbackSaveTimeout);
      }
      
      // 設置新的定時器，1秒後保存
      window.careerFeedbackSaveTimeout = setTimeout(async () => {
        try {
          await apiService.saveCareerData(user.email, undefined, undefined, feedback);
        } catch (error) {
          console.error('Error saving career feedback:', error);
        }
      }, 1000);
    }
  };

  const updateSummary = (summary: SummaryData) => {
    setAssessmentData(prev => ({ ...prev, summary }));
  };
  
  const updateNextSteps = async (steps: string[]) => {
    setAssessmentData(prev => ({...prev, nextSteps: steps }));
    
    // 立即保存到資料庫
    if (user?.email) {
      try {
        await apiService.saveCareerData(user.email, undefined, undefined, undefined, steps);
      } catch (error) {
        console.error('Error saving next steps:', error);
      }
    }
  };
  
  const updateNextStepsOther = async (other: string) => {
    setAssessmentData(prev => ({...prev, nextStepsOther: other }));
    
    // 立即保存到資料庫
    if (user?.email) {
      try {
        await apiService.saveCareerData(user.email, undefined, undefined, undefined, undefined, other);
      } catch (error) {
        console.error('Error saving next steps other:', error);
      }
    }
  };

  const updateFinalThoughts = async (thoughts: string) => {
    setAssessmentData(prev => ({...prev, finalThoughts: thoughts }));
    
    // 立即保存到資料庫
    if (user?.email) {
      try {
        await apiService.saveCareerData(user.email, undefined, undefined, undefined, undefined, undefined, thoughts);
      } catch (error) {
        console.error('Error saving final thoughts:', error);
      }
    }
  };


  const handleLanguageChange = (code: LanguageCode) => {
    setLanguage(code);
    const langName = languages.find(l => l.code === code)?.name || 'English';
    setAssessmentData(prev => ({ ...prev, language: langName }));
  };

  const renderStep = () => {
    // Show authentication if user is not authenticated
    if (!user) {
      return (
        <SSOAuth 
          onUserAuthenticated={handleUserAuthenticated}
          onError={handleAuthError}
        />
      );
    }

    // Developer mode: use mock data
    const dataToUse = devMode ? mockAssessmentData : assessmentData;

    switch (currentStep) {
      case Step.Language:
        return <StepLanguage 
                  selectedLanguage={language} 
                  onLanguageChange={handleLanguageChange} 
                  onNext={() => setCurrentStep(Step.Intro)} 
                />;
      case Step.Intro:
        return <StepIntro user={user} onNext={() => setCurrentStep(Step.Business)} />;
      case Step.Business:
        return <StepBusiness 
                  assessmentData={dataToUse}
                  stage={businessStage}
                  setStage={setBusinessStage}
                  updateSkills={updateBusinessSkills}
                  updateRole={updateRole}
                  updateBusinessGoal={updateBusinessGoal}
                  updateKeyResults={updateKeyResults}
                  updateBusinessFeedbackSupport={updateBusinessFeedbackSupport}
                  updateBusinessFeedbackObstacles={updateBusinessFeedbackObstacles}
                  onComplete={() => setCurrentStep(Step.Career)}
                  user={user}
                />;
      case Step.Career:
        return <StepCareer 
                  assessmentData={dataToUse} 
                  stage={careerStage}
                  setStage={setCareerStage}
                  updateSkills={updateCareerSkills} 
                  updateCareerGoal={updateCareerGoal}
                  updatePeerFeedback={updatePeerFeedback}
                  updateCareerIntro={updateCareerIntro}
                  updateCareerFeedback={updateCareerFeedback}
                  onComplete={() => setCurrentStep(Step.Summary)}
               />;
      case Step.Summary:
        return <StepSummary 
                  assessmentData={dataToUse}
                  updateSummary={updateSummary}
                  updateNextSteps={updateNextSteps}
                  updateNextStepsOther={updateNextStepsOther}
                  updateFinalThoughts={updateFinalThoughts}
                />;
      default:
        return null;
    }
  };

  return (
    <LanguageProvider value={{ language, setLanguage: handleLanguageChange }}>
      <div className="bg-slate-900 text-white min-h-screen flex flex-col items-center justify-center p-4 font-sans">
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-8">
          {/* Developer Mode Toggle */}
          <div className="flex justify-end">
            <label className="flex items-center gap-2 text-sm text-slate-400">
              <input
                type="checkbox"
                checked={devMode}
                onChange={(e) => setDevMode(e.target.checked)}
                className="rounded border-slate-600 bg-slate-700 text-cyan-600 focus:ring-cyan-500"
              />
              Developer Mode
            </label>
          </div>
          <Header 
            currentStep={currentStep} 
            setCurrentStep={setCurrentStep}
            isBusinessComplete={isBusinessComplete}
            isCareerComplete={isCareerComplete}
          />
          <main className="bg-slate-800 border border-slate-700 rounded-2xl p-8 min-h-[500px]">
            {renderStep()}
          </main>
        </div>
      </div>
    </LanguageProvider>
  );
};

export default App;
