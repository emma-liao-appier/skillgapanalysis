import React, { useState } from 'react';
import { Step, AssessmentData, Skill, SummaryData, LanguageCode, BusinessStage, CareerStage } from './types';
import Header from './components/Header';
import StepLanguage from './components/StepLanguage';
import StepIntro from './components/StepIntro';
import StepBusiness from './components/StepBusiness';
import StepCareer from './components/StepCareer';
import StepSummary from './components/StepSummary';
import { LanguageProvider } from './context/LanguageContext';
import { languages } from './lib/translations';

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>(Step.Language);
  const [businessStage, setBusinessStage] = useState<BusinessStage>('goal');
  const [careerStage, setCareerStage] = useState<CareerStage>('goal');
  const [language, setLanguage] = useState<LanguageCode>('en');
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

  const isBusinessComplete = assessmentData.businessSkills.length > 0 && assessmentData.businessSkills.every(s => s.rating > 0);
  const isCareerComplete = assessmentData.careerSkills.length > 0 && assessmentData.careerSkills.every(s => s.rating > 0);

  const updateBusinessSkills = (skills: Skill[]) => {
    setAssessmentData(prev => ({ ...prev, businessSkills: skills }));
  };

  const updateCareerSkills = (skills: Skill[]) => {
    setAssessmentData(prev => ({ ...prev, careerSkills: skills }));
  };
  
  const updateRole = (role: string) => {
    setAssessmentData(prev => ({ ...prev, role }));
  };
  
  const updateCareerGoal = (goal: string) => {
    setAssessmentData(prev => ({ ...prev, careerGoal: goal }));
  };

  const updatePeerFeedback = (feedback: string) => {
    setAssessmentData(prev => ({ ...prev, peerFeedback: feedback }));
  };

  const updateCareerIntro = (intro: string) => {
    setAssessmentData(prev => ({ ...prev, careerIntro: intro }));
  };

  const updateBusinessGoal = (goal: string) => {
    setAssessmentData(prev => ({ ...prev, businessGoal: goal }));
  };

  const updateKeyResults = (results: string) => {
    setAssessmentData(prev => ({ ...prev, keyResults: results }));
  };

  const updateBusinessFeedbackSupport = (feedback: string) => {
    setAssessmentData(prev => ({ ...prev, businessFeedbackSupport: feedback }));
  };

  const updateBusinessFeedbackObstacles = (feedback: string) => {
    setAssessmentData(prev => ({ ...prev, businessFeedbackObstacles: feedback }));
  };

  const updateCareerFeedback = (feedback: string) => {
    setAssessmentData(prev => ({ ...prev, careerFeedback: feedback }));
  };

  const updateSummary = (summary: SummaryData) => {
    setAssessmentData(prev => ({ ...prev, summary }));
  };
  
  const updateNextSteps = (steps: string[]) => {
    setAssessmentData(prev => ({...prev, nextSteps: steps }));
  };
  
  const updateNextStepsOther = (other: string) => {
    setAssessmentData(prev => ({...prev, nextStepsOther: other }));
  };

  const updateFinalThoughts = (thoughts: string) => {
    setAssessmentData(prev => ({...prev, finalThoughts: thoughts }));
  };


  const handleLanguageChange = (code: LanguageCode) => {
    setLanguage(code);
    const langName = languages.find(l => l.code === code)?.name || 'English';
    setAssessmentData(prev => ({ ...prev, language: langName }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case Step.Language:
        return <StepLanguage 
                  selectedLanguage={language} 
                  onLanguageChange={handleLanguageChange} 
                  onNext={() => setCurrentStep(Step.Intro)} 
                />;
      case Step.Intro:
        return <StepIntro onNext={() => setCurrentStep(Step.Business)} />;
      case Step.Business:
        return <StepBusiness 
                  assessmentData={assessmentData}
                  stage={businessStage}
                  setStage={setBusinessStage}
                  updateSkills={updateBusinessSkills} 
                  updateRole={updateRole}
                  updateBusinessGoal={updateBusinessGoal}
                  updateKeyResults={updateKeyResults}
                  updateBusinessFeedbackSupport={updateBusinessFeedbackSupport}
                  updateBusinessFeedbackObstacles={updateBusinessFeedbackObstacles}
                  onComplete={() => setCurrentStep(Step.Career)}
                />;
      case Step.Career:
        return <StepCareer 
                  assessmentData={assessmentData} 
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
                  assessmentData={assessmentData}
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
