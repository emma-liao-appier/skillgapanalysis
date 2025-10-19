import React, { useState, useCallback } from 'react';
import { AssessmentData, Skill, SkillCategory, BusinessStage } from '../types';
import SkillRating from './SkillRating';
import ThinkingRobot from './ThinkingRobot';
import RatingExplanation from './RatingExplanation';
import { generateBusinessSkills, generateKeyResults } from '../services/geminiService';
import { useLanguage } from '../context/LanguageContext';

interface StepBusinessProps {
  assessmentData: AssessmentData;
  stage: BusinessStage;
  setStage: (stage: BusinessStage) => void;
  updateSkills: (skills: Skill[]) => void;
  updateRole: (role: string) => void;
  updateBusinessGoal: (goal: string) => void;
  updateKeyResults: (results: string) => void;
  updateBusinessFeedbackSupport: (feedback: string) => void;
  updateBusinessFeedbackObstacles: (feedback: string) => void;
  onComplete: () => void;
}

const AddSkillForm: React.FC<{onAddSkill: (skill: Skill) => void; onCancel: () => void;}> = ({ onAddSkill, onCancel }) => {
    const { t } = useLanguage();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<SkillCategory>(SkillCategory.Functional);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!name || !description) {
            alert('Please fill out all fields.');
            return;
        }
        onAddSkill({
            id: `custom-${Date.now()}`,
            name,
            description,
            category,
            rating: 0,
        });
    };
    
    const skillCategories = Object.values(SkillCategory);

    return (
        <form onSubmit={handleSubmit} className="bg-slate-700 p-4 rounded-lg mt-4 border border-slate-600 space-y-4">
            <h4 className="text-lg font-semibold text-slate-200">{t('business_add_skill_title')}</h4>
             <div>
                 <label htmlFor="skill-category" className="block text-sm font-medium text-slate-300 mb-1">{t('business_add_skill_category')}</label>
                 <select id="skill-category" value={category} onChange={e => setCategory(e.target.value as SkillCategory)} className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500">
                    {skillCategories.map(cat => (
                        <option key={cat} value={cat}>{t(`skill_category_${cat}`)}</option>
                    ))}
                 </select>
            </div>
            <div>
                 <label htmlFor="skill-name" className="block text-sm font-medium text-slate-300 mb-1">{t('business_add_skill_name')}</label>
                 <input id="skill-name" type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500" />
            </div>
             <div>
                 <label htmlFor="skill-desc" className="block text-sm font-medium text-slate-300 mb-1">{t('business_add_skill_desc')}</label>
                 <textarea id="skill-desc" value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500" />
            </div>
            <div className="flex justify-end gap-3">
                 <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-semibold text-slate-300 bg-slate-600 rounded-md hover:bg-slate-500 transition-colors">{t('common_cancel')}</button>
                 <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-cyan-600 rounded-md hover:bg-cyan-500 transition-colors">{t('business_add_skill_button')}</button>
            </div>
        </form>
    )
}

const StepBusiness: React.FC<StepBusinessProps> = ({
  assessmentData,
  stage,
  setStage,
  updateSkills,
  updateRole,
  updateBusinessGoal,
  updateKeyResults,
  updateBusinessFeedbackSupport,
  updateBusinessFeedbackObstacles,
  onComplete,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingKR, setIsGeneratingKR] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const { t } = useLanguage();

  const handleGenerateSkills = useCallback(async () => {
    if (!assessmentData.businessGoal) {
      alert("Please enter your business goal.");
      return;
    }
    setIsLoading(true);
    const fetchedSkills = await generateBusinessSkills(
      assessmentData.role,
      assessmentData.businessGoal,
      assessmentData.keyResults
    );
    updateSkills(fetchedSkills);
    setStage('rating');
    setIsLoading(false);
  }, [assessmentData.role, assessmentData.businessGoal, assessmentData.keyResults, updateSkills, setStage]);
  
  const handleSuggestKeyResults = async () => {
    setIsGeneratingKR(true);
    const suggestions = await generateKeyResults(assessmentData.role, assessmentData.businessGoal);
    updateKeyResults(suggestions);
    setIsGeneratingKR(false);
  };


  const handleRateSkill = (skillId: string, rating: number) => {
    const updatedSkills = assessmentData.businessSkills.map(skill =>
      skill.id === skillId ? { ...skill, rating } : skill
    );
    updateSkills(updatedSkills);
  };

  const handleDeleteSkill = (skillId: string) => {
    const updatedSkills = assessmentData.businessSkills.filter(skill => skill.id !== skillId);
    updateSkills(updatedSkills);
  };
  
  const handleAddSkill = (newSkill: Skill) => {
    updateSkills([...assessmentData.businessSkills, newSkill]);
    setShowAddForm(false);
  };

  const handleBack = () => {
    if (stage === 'results') setStage('goal');
    if (stage === 'rating') setStage('results');
    if (stage === 'feedback') setStage('rating');
  }

  const handleNext = () => {
    if (stage === 'goal') {
      setStage('results');
    } else if (stage === 'results') {
      // If skills are already generated, just move to the rating page. Otherwise, generate them.
      if (assessmentData.businessSkills.length > 0) {
        setStage('rating');
      } else {
        handleGenerateSkills();
      }
    } else if (stage === 'rating') {
      setStage('feedback');
    }
  }
  
  const getNextButtonText = () => {
    if (stage === 'goal') return t('business_nav_next_results');
    if (stage === 'results') {
      return assessmentData.businessSkills.length > 0 ? t('business_nav_next_skills_existing') : t('business_nav_next_skills_generate');
    }
    if (stage === 'rating') return t('business_nav_next_feedback');
    return t('business_nav_finish');
  }

  const renderContent = () => {
    if (isLoading) {
      return <ThinkingRobot message={t('loading_business_skills')} />;
    }
    switch (stage) {
      case 'goal':
        return (
          <div className="flex flex-col items-center justify-center h-full gap-6 mt-8 text-center">
            {/* Role Input */}
            <div className="w-full max-w-lg">
                <label htmlFor="role-input" className="block text-slate-300 mb-2">
                    {t('business_role_label')}
                </label>
                <input 
                    id="role-input"
                    type="text"
                    value={assessmentData.role}
                    onChange={(e) => updateRole(e.target.value)}
                    placeholder={t('business_role_placeholder')}
                    className="w-full max-w-md mx-auto bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
            </div>

            {/* Business Goal Input */}
            <div className="w-full max-w-lg">
                 <label htmlFor="business-goal" className="block text-slate-300 mb-2">
                    {t('business_goal_label')}
                </label>
                <textarea
                    id="business-goal"
                    value={assessmentData.businessGoal}
                    onChange={(e) => updateBusinessGoal(e.target.value)}
                    rows={4}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
            </div>
          </div>
        );
      case 'results':
        return (
          <div className="flex flex-col items-center justify-center h-full gap-4 mt-8 text-center">
            <label htmlFor="key-results" className="text-slate-300 max-w-lg">
              {t('business_key_results_label')}
            </label>
            <div className="w-full max-w-lg relative">
                 <textarea
                    id="key-results"
                    value={assessmentData.keyResults}
                    onChange={(e) => updateKeyResults(e.target.value)}
                    rows={5}
                    placeholder={t('business_key_results_placeholder')}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                 <button
                    onClick={handleSuggestKeyResults}
                    disabled={isGeneratingKR}
                    className="absolute bottom-2 right-2 px-3 py-1 text-xs bg-slate-600 text-cyan-300 font-semibold rounded-md hover:bg-slate-500 transition-colors disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-wait flex items-center gap-1"
                >
                    {isGeneratingKR ? (
                        <>
                            <span className="text-sm animate-robot-think">🤖</span>
                            {t('business_suggesting_kr')}
                        </>
                    ) : (
                        t('business_suggest_kr_button')
                    )}
                </button>
            </div>
          </div>
        );
      case 'rating':
        return (
            <div>
                 <div className="mb-6 text-center">
                    <h4 className="text-xl font-semibold text-slate-100">{t('business_assessment_title')}</h4>
                    <p className="text-sm text-slate-400 max-w-2xl mx-auto mt-1">{t('business_assessment_explanation')}</p>
                </div>
                <RatingExplanation />
                <ul className="space-y-4 mt-6">
                    {assessmentData.businessSkills.map((skill) => (
                    <SkillRating key={skill.id} skill={skill} onRate={handleRateSkill} onDelete={handleDeleteSkill} />
                    ))}
                </ul>
                <div className="mt-6">
                    {showAddForm ? (
                        <AddSkillForm onAddSkill={handleAddSkill} onCancel={() => setShowAddForm(false)}/>
                    ) : (
                        <div className="text-center">
                            <button onClick={() => setShowAddForm(true)} className="px-5 py-2 text-sm font-semibold text-cyan-400 bg-slate-700 rounded-full hover:bg-slate-600 transition-colors">
                                {t('business_add_skill_form_button')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
      case 'feedback':
        return (
            <div className="flex flex-col items-center justify-center h-full gap-6 mt-4">
                <div className="w-full max-w-lg">
                    <label htmlFor="business-feedback-support" className="text-slate-300 block text-center mb-2">
                        {t('business_feedback_label_support')}
                    </label>
                    <textarea
                        id="business-feedback-support"
                        value={assessmentData.businessFeedbackSupport}
                        onChange={(e) => updateBusinessFeedbackSupport(e.target.value)}
                        rows={3}
                        placeholder={t('business_feedback_placeholder_support')}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                </div>
                 <div className="w-full max-w-lg">
                    <label htmlFor="business-feedback-obstacles" className="text-slate-300 block text-center mb-2">
                        {t('business_feedback_label_obstacles')}
                    </label>
                    <textarea
                        id="business-feedback-obstacles"
                        value={assessmentData.businessFeedbackObstacles}
                        onChange={(e) => updateBusinessFeedbackObstacles(e.target.value)}
                        rows={3}
                        placeholder={t('business_feedback_placeholder_obstacles')}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                </div>
            </div>
        )
    }
  };
  
  const isNextDisabled = () => {
    if(stage === 'goal') return !assessmentData.role || !assessmentData.businessGoal;
    if(stage === 'rating') return assessmentData.businessSkills.length === 0 || assessmentData.businessSkills.some(s => s.rating === 0);
    return false;
  }

  return (
    <div className="flex flex-col" style={{minHeight: '436px'}}>
        <div className="flex-grow">
            <div className="flex items-center gap-2 mb-6">
                <span className="w-5 h-5 bg-blue-400/80 rounded-full flex items-center justify-center text-sm font-bold text-blue-900">
                🏢
                </span>
                <h3 className="text-xl font-semibold text-slate-100">{t('header_business')}</h3>
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

export default StepBusiness;