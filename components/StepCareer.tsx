import React, { useState, useCallback } from 'react';
import { AssessmentData, Skill, CareerStage } from '../types';
import SkillRating from './SkillRating';
import RatingExplanation from './RatingExplanation';
import ThinkingRobot from './ThinkingRobot';
import { generateCareerIntroAndSkills, optimizeText } from '../services/geminiService';
import { useLanguage } from '../context/LanguageContext';

interface StepCareerProps {
  assessmentData: AssessmentData;
  stage: CareerStage;
  setStage: (stage: CareerStage) => void;
  updateSkills: (skills: Skill[]) => void;
  updateCareerGoal: (goal: string) => void;
  updatePeerFeedback: (feedback: string) => void;
  updateCareerIntro: (intro: string) => void;
  updateCareerFeedback: (feedback: string) => void;
  onComplete: () => void;
}

const StepCareer: React.FC<StepCareerProps> = ({ 
    assessmentData, 
    stage,
    setStage,
    updateSkills, 
    updateCareerGoal,
    updatePeerFeedback,
    updateCareerIntro,
    updateCareerFeedback,
    onComplete,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const { t } = useLanguage();

  const handleGenerateContent = useCallback(async () => {
    if (!assessmentData.role || !assessmentData.careerGoal) {
      alert("Please ensure your current role and growth goal are entered.");
      return;
    }
    setStage('intro');
    setIsLoading(true);
    const { intro, skills } = await generateCareerIntroAndSkills(
        assessmentData.role, 
        assessmentData.careerGoal, 
        assessmentData.peerFeedback
    );
    updateCareerIntro(intro);
    updateSkills(skills);
    setIsLoading(false);
  }, [assessmentData.role, assessmentData.careerGoal, assessmentData.peerFeedback, updateSkills, updateCareerIntro, setStage]);

  const handleOptimizeGoal = async () => {
      if (!assessmentData.careerGoal) return;
      setIsOptimizing(true);
      const optimizedGoal = await optimizeText(assessmentData.careerGoal);
      updateCareerGoal(optimizedGoal);
      setIsOptimizing(false);
  };

  const handleRateSkill = (skillId: string, rating: number) => {
    const updatedSkills = assessmentData.careerSkills.map(skill =>
      skill.id === skillId ? { ...skill, rating } : skill
    );
    updateSkills(updatedSkills);
  };

  const handleDeleteSkill = (skillId: string) => {
    const updatedSkills = assessmentData.careerSkills.filter(skill => skill.id !== skillId);
    updateSkills(updatedSkills);
  };

  const handleBack = () => {
    if (stage === 'intro') setStage('goal');
    if (stage === 'rating') setStage('intro');
    if (stage === 'feedback') setStage('rating');
  }

  const handleNext = () => {
    if (stage === 'goal') {
        handleGenerateContent();
    } else if (stage === 'intro') {
        setStage('rating');
    } else if (stage === 'rating') {
        setStage('feedback');
    }
  }

  const getNextButtonText = () => {
    if (stage === 'goal') return t('career_nav_next_skills_generate');
    if (stage === 'intro') return t('career_nav_to_rating');
    if (stage === 'rating') return t('career_nav_next_feedback');
    return t('career_nav_finish');
  }

  const isNextDisabled = () => {
    if (stage === 'goal') return !assessmentData.careerGoal || isOptimizing;
    if (stage === 'intro') return isLoading;
    if (stage === 'rating') return assessmentData.careerSkills.length === 0 || assessmentData.careerSkills.some(s => s.rating === 0);
    return false;
  }
  
  const renderContent = () => {
      switch(stage) {
          case 'goal':
              return (
                <div className="flex flex-col items-center justify-center h-full gap-6 mt-4">
                  <p className="text-slate-300">{t('career_current_role_is')} <span className="font-semibold">{assessmentData.role}</span></p>

                  <div className="w-full max-w-lg">
                      <label htmlFor="career-goal" className="block text-slate-300 text-center mb-2">{t('career_goal_label')}</label>
                      <div className="relative">
                          <textarea
                              id="career-goal"
                              value={assessmentData.careerGoal}
                              onChange={(e) => updateCareerGoal(e.target.value)}
                              rows={3}
                              placeholder={t('career_goal_placeholder')}
                              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          />
                          <button
                              onClick={handleOptimizeGoal}
                              disabled={isOptimizing || !assessmentData.careerGoal}
                              className="absolute bottom-2 right-2 px-3 py-1 text-xs bg-slate-600 text-cyan-300 font-semibold rounded-md hover:bg-slate-500 transition-colors disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            {isOptimizing ? t('career_optimizing_button') : t('career_optimize_button')}
                          </button>
                      </div>
                  </div>

                  <div className="w-full max-w-lg">
                      <label htmlFor="peer-feedback" className="block text-slate-300 text-center mb-2">{t('career_feedback_received_label')}</label>
                      <textarea
                          id="peer-feedback"
                          value={assessmentData.peerFeedback}
                          onChange={(e) => updatePeerFeedback(e.target.value)}
                          rows={3}
                          placeholder={t('career_feedback_received_placeholder')}
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                  </div>
                </div>
              );
          case 'intro':
              return (
                <div className="flex flex-col items-center justify-center h-full text-center" style={{minHeight: '250px'}}>
                  {isLoading ? (
                      <ThinkingRobot message={t('loading_career_skills')} />
                  ) : (
                      <div className="bg-slate-700/50 p-6 rounded-lg max-w-2xl mx-auto">
                          <h4 className="text-lg font-semibold text-slate-100">AItlas says...</h4>
                          <p className="mt-2 text-slate-300 whitespace-pre-wrap">{assessmentData.careerIntro}</p>
                      </div>
                  )}
                </div>
              );
          case 'rating':
              return (
                 <>
                    <RatingExplanation />
                    <ul className="space-y-4 mt-6">
                        {assessmentData.careerSkills.map((skill) => (
                        <SkillRating key={skill.id} skill={skill} onRate={handleRateSkill} onDelete={handleDeleteSkill} />
                        ))}
                    </ul>
                 </>
              );
          case 'feedback':
              return (
                <div className="flex flex-col items-center justify-center h-full gap-4 mt-8">
                    <label htmlFor="career-feedback" className="text-slate-300 max-w-lg text-center">
                        {t('career_feedback_label')}
                    </label>
                    <textarea
                        id="career-feedback"
                        value={assessmentData.careerFeedback}
                        onChange={(e) => updateCareerFeedback(e.target.value)}
                        rows={5}
                        placeholder={t('career_feedback_placeholder')}
                        className="w-full max-w-lg bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                </div>
              )
      }
  }

  return (
    <div className="flex flex-col" style={{minHeight: '436px'}}>
        <div className="flex-grow">
            <div className="flex items-center gap-2 mb-6">
                <span className="w-5 h-5 bg-green-400/80 rounded-full flex items-center justify-center text-sm font-bold text-green-900">
                    🌱
                </span>
                <h3 className="text-xl font-semibold text-slate-100">{t('career_title')}</h3>
            </div>
            {renderContent()}
        </div>
        
        <div className="mt-auto pt-6 border-t border-slate-700 flex justify-between items-center">
             <button
                onClick={handleBack}
                className={`px-6 py-2 font-semibold rounded-full transition-colors ${stage === 'goal' ? 'invisible' : 'bg-slate-600 text-white hover:bg-slate-500'}`}
            >
                &lt; {t('common_back')}
            </button>

            <button
                onClick={stage === 'feedback' ? onComplete : handleNext}
                disabled={isNextDisabled()}
                className="px-6 py-2 bg-cyan-500 text-white font-semibold rounded-full hover:bg-cyan-600 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
            >
                {getNextButtonText()} &gt;
            </button>
        </div>
    </div>
  );
};

export default StepCareer;
