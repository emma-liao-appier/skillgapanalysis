import React, { useState, useCallback } from 'react';
import { AssessmentData, Skill, CareerStage, SkillCategory } from '../types';
import SkillRating from './SkillRating';
import RatingExplanation from './RatingExplanation';
import ThinkingRobot from './ThinkingRobot';
import AItlasReflection from './AItlasReflection';
import OptimizableInput from './OptimizableInput';
import { apiService } from '../services/apiService';
import { useLanguage } from '../context/LanguageContext';

const AddSkillForm: React.FC<{onAddSkill: (skill: Skill) => void; onCancel: () => void;}> = ({ onAddSkill, onCancel }) => {
    const { t } = useLanguage();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<SkillCategory>(SkillCategory.Functional);
    const [skillType, setSkillType] = useState<'catalogue' | 'custom'>('catalogue');
    const [catalogueSkills, setCatalogueSkills] = useState<any[]>([]);
    const [selectedCatalogueSkill, setSelectedCatalogueSkill] = useState<any>(null);
    const [isLoadingCatalogue, setIsLoadingCatalogue] = useState(false);

    // 載入技能目錄
    const loadCatalogueSkills = async (category: string) => {
      setIsLoadingCatalogue(true);
      try {
        const response = await apiService.getSkillsForAddSkill(category);
        setCatalogueSkills(response.skills[category] || []);
      } catch (error) {
        console.error('Error loading catalogue skills:', error);
      } finally {
        setIsLoadingCatalogue(false);
      }
    };

    // 當類別改變時載入對應的技能目錄
    React.useEffect(() => {
      if (skillType === 'catalogue') {
        loadCatalogueSkills(category);
      }
    }, [category, skillType]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (skillType === 'catalogue') {
          if (!selectedCatalogueSkill) {
            alert('Please select a skill from the catalogue.');
            return;
          }
          onAddSkill({
            id: selectedCatalogueSkill.skillId || `skill-${Date.now()}`,
            name: selectedCatalogueSkill.name,
            description: selectedCatalogueSkill.description,
            category: selectedCatalogueSkill.category,
            rating: 0,
          });
        } else {
          if (!name || !description) {
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
        }
    };
    
    const skillCategories = Object.values(SkillCategory);

    return (
        <form onSubmit={handleSubmit} className="bg-slate-700 p-4 rounded-lg mt-4 border border-slate-600 space-y-4">
            <h4 className="text-lg font-semibold text-slate-200">{t('career_add_skill_title')}</h4>
            
            {/* Skill Type Selection */}
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">{t('career_add_skill_type')}</label>
                <div className="flex gap-4">
                    <label className="flex items-center">
                        <input
                            type="radio"
                            value="catalogue"
                            checked={skillType === 'catalogue'}
                            onChange={(e) => setSkillType(e.target.value as 'catalogue' | 'custom')}
                            className="mr-2"
                        />
                        <span className="text-slate-300">{t('career_add_skill_from_catalogue')}</span>
                    </label>
                    <label className="flex items-center">
                        <input
                            type="radio"
                            value="custom"
                            checked={skillType === 'custom'}
                            onChange={(e) => setSkillType(e.target.value as 'catalogue' | 'custom')}
                            className="mr-2"
                        />
                        <span className="text-slate-300">{t('career_add_skill_custom')}</span>
                    </label>
                </div>
            </div>

            {/* Category Selection */}
            <div>
                <label htmlFor="skill-category" className="block text-sm font-medium text-slate-300 mb-1">{t('career_add_skill_category')}</label>
                <select 
                    id="skill-category" 
                    value={category} 
                    onChange={e => setCategory(e.target.value as SkillCategory)} 
                    className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                    {skillCategories.map(cat => (
                        <option key={cat} value={cat}>{t(`skill_category_${cat}`)}</option>
                    ))}
                </select>
            </div>

            {/* Catalogue Skills Selection */}
            {skillType === 'catalogue' && (
                <div>
                    <label htmlFor="catalogue-skill" className="block text-sm font-medium text-slate-300 mb-1">{t('career_add_skill_select')}</label>
                    {isLoadingCatalogue ? (
                        <div className="text-slate-400">Loading skills...</div>
                    ) : (
                        <select
                            id="catalogue-skill"
                            value={selectedCatalogueSkill?.skillId || ''}
                            onChange={(e) => {
                                const skill = catalogueSkills.find(s => s.skillId === e.target.value);
                                setSelectedCatalogueSkill(skill);
                            }}
                            className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        >
                            <option value="">Select a skill...</option>
                            {catalogueSkills.map(skill => (
                                <option key={skill.skillId} value={skill.skillId}>
                                    {skill.name}
                                </option>
                            ))}
                        </select>
                    )}
                    {selectedCatalogueSkill && (
                        <div className="mt-2 p-2 bg-slate-800 rounded text-sm text-slate-300">
                            <strong>{selectedCatalogueSkill.name}</strong><br/>
                            {selectedCatalogueSkill.description}
                        </div>
                    )}
                </div>
            )}

            {/* Custom Skill Input */}
            {skillType === 'custom' && (
                <>
                    <div>
                        <label htmlFor="skill-name" className="block text-sm font-medium text-slate-300 mb-1">{t('career_add_skill_name')}</label>
                        <input 
                            id="skill-name" 
                            type="text" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500" 
                        />
                    </div>
                    <div>
                        <label htmlFor="skill-desc" className="block text-sm font-medium text-slate-300 mb-1">{t('career_add_skill_desc')}</label>
                        <textarea 
                            id="skill-desc" 
                            value={description} 
                            onChange={e => setDescription(e.target.value)} 
                            rows={3}
                            className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500" 
                        />
                    </div>
                </>
            )}

            <div className="flex justify-end gap-3">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-semibold text-slate-300 bg-slate-600 rounded-md hover:bg-slate-500 transition-colors">{t('common_cancel')}</button>
                <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-cyan-600 rounded-md hover:bg-cyan-500 transition-colors">{t('career_add_skill_button')}</button>
            </div>
        </form>
    )
}

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
  const [isOptimizingFeedback, setIsOptimizingFeedback] = useState(false);
  const [alignmentData, setAlignmentData] = useState<any>(null);
  const [skillThemes, setSkillThemes] = useState<string[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const { t } = useLanguage();

  const handleGenerateContent = useCallback(async () => {
    if (!assessmentData.role || !assessmentData.careerGoal) {
      alert("Please ensure your current role and growth goal are entered.");
      return;
    }
    setIsLoading(true);
    setIsReady(false);
    // Generate skills directly and go to rating stage
    const tempAssessmentId = 'temp-' + Date.now();
    const response = await apiService.generateCareerSkills(
      tempAssessmentId,
      assessmentData.role, 
      assessmentData.careerGoal, 
      assessmentData.peerFeedback
    );
    const { intro, skills, alignment, skillThemes: themes } = response as { intro: string, skills: Skill[], alignment: any, skillThemes: string[] };
    updateCareerIntro(intro);
    updateSkills(skills);
    setAlignmentData(alignment);
    setSkillThemes(themes || []);
    setIsLoading(false);
    setIsReady(true);
  }, [assessmentData.role, assessmentData.careerGoal, assessmentData.peerFeedback, updateSkills, updateCareerIntro, setStage]);

  const handleProceedToSkills = () => {
    setStage('rating');
    setIsReady(false);
  };

  const handleSkillThemesChange = useCallback(async (updatedThemes: string[]) => {
    setSkillThemes(updatedThemes);
    // Regenerate skills based on updated themes
    if (assessmentData.role && assessmentData.careerGoal) {
      const tempAssessmentId = 'temp-' + Date.now();
      const response = await apiService.generateCareerSkills(
        tempAssessmentId,
        assessmentData.role, 
        assessmentData.careerGoal, 
        assessmentData.peerFeedback
      );
      updateSkills((response as { skills: Skill[] }).skills);
    }
  }, [assessmentData.role, assessmentData.careerGoal, assessmentData.peerFeedback, updateSkills]);

  const handleOptimizeGoal = async () => {
      if (!assessmentData.careerGoal) return;
      setIsOptimizing(true);
      const response = await apiService.optimizeText(assessmentData.careerGoal);
      const optimizedGoal = (response as { optimizedText?: string }).optimizedText || assessmentData.careerGoal;
      updateCareerGoal(optimizedGoal);
      setIsOptimizing(false);
  };

  const handleOptimizeFeedback = async () => {
      if (!assessmentData.careerFeedback) return;
      setIsOptimizingFeedback(true);
      try {
          const response = await apiService.optimizeText(assessmentData.careerFeedback) as { optimizedText?: string } | string;
          if (typeof response === 'string') {
              updateCareerFeedback(response);
          } else {
              updateCareerFeedback(response.optimizedText || '');
          }
      } catch (error) {
          console.error("Error optimizing career feedback:", error);
          alert("Failed to optimize career feedback. Please try again.");
      } finally {
          setIsOptimizingFeedback(false);
      }
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

  const handleAddSkill = (newSkill: Skill) => {
    updateSkills([...assessmentData.careerSkills, newSkill]);
    setShowAddForm(false);
  };

  const handleBack = () => {
    if (stage === 'rating') setStage('goal');
    if (stage === 'feedback') setStage('rating');
  }

  const handleNext = () => {
    if (stage === 'goal') {
        if (isReady) {
            handleProceedToSkills();
        } else {
            handleGenerateContent();
        }
    } else if (stage === 'rating') {
        setStage('feedback');
    }
  }

  const getNextButtonText = () => {
    if (stage === 'goal') {
      if (isReady) return 'Next';
      return t('career_nav_next_skills_generate');
    }
    if (stage === 'rating') return t('career_nav_next_feedback');
    return t('career_nav_finish');
  }

  const isNextDisabled = () => {
    if (stage === 'goal') {
      if (isReady) return false; // Enable button when ready
      return !assessmentData.careerGoal || isOptimizing || isLoading;
    }
    if (stage === 'rating') return assessmentData.careerSkills.length === 0 || assessmentData.careerSkills.some(s => s.rating === 0);
    return false;
  }
  
  const renderContent = () => {
      switch(stage) {
          case 'goal':
              if (isLoading) {
                  return <ThinkingRobot message={t('loading_career_skills')} />;
              }
              if (isReady) {
                  return (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl p-8 border border-slate-700/50 max-w-2xl">
                        <div className="flex items-center justify-center mb-4">
                          <span className="text-4xl mr-3">✅</span>
                        </div>
                        <h3 className="text-xl font-bold text-green-400 mb-4">{t('career_ready_title')}</h3>
                        <p className="text-slate-300 text-base leading-relaxed mb-6">
                          {t('career_ready_message')}
                        </p>
                      </div>
                    </div>
                  );
              }
              return (
                <div className="flex flex-col items-center justify-center h-full gap-6 mt-4">
                  <p className="text-slate-300">{t('career_current_role_is')} <span className="font-semibold">{assessmentData.role}</span></p>

                  <OptimizableInput
                      id="career-goal"
                      value={assessmentData.careerGoal}
                      onChange={updateCareerGoal}
                      placeholder={t('career_goal_placeholder')}
                      label={t('career_goal_label')}
                      rows={3}
                      onOptimize={assessmentData.careerGoal ? handleOptimizeGoal : undefined}
                      isOptimizing={isOptimizing}
                      labelClassName="text-center"
                  />

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
          case 'rating':
              return (
                 <>
                    <div className="mb-6 text-center">
                        <h4 className="text-xl font-semibold text-slate-100">{t('career_assessment_title')}</h4>
                        <p className="text-sm text-slate-400 max-w-2xl mx-auto mt-1">{t('career_assessment_explanation')}</p>
                    </div>
                    <RatingExplanation />
                    <ul className="space-y-4 mt-6">
                        {assessmentData.careerSkills.map((skill) => (
                        <SkillRating key={skill.id} skill={skill} onRate={handleRateSkill} onDelete={handleDeleteSkill} />
                        ))}
                    </ul>
                    <div className="mt-6">
                        {showAddForm ? (
                            <AddSkillForm onAddSkill={handleAddSkill} onCancel={() => setShowAddForm(false)}/>
                        ) : (
                            <div className="text-center">
                                <button onClick={() => setShowAddForm(true)} className="px-5 py-2 text-sm font-semibold text-cyan-400 bg-slate-700 rounded-full hover:bg-slate-600 transition-colors">
                                    {t('career_add_skill_form_button')}
                                </button>
                            </div>
                        )}
                    </div>
                 </>
              );
          case 'feedback':
              return (
                <div className="flex flex-col items-center justify-center h-full gap-4 mt-8">
                    <OptimizableInput
                        id="career-feedback"
                        value={assessmentData.careerFeedback}
                        onChange={updateCareerFeedback}
                        placeholder={t('career_feedback_placeholder')}
                        label={t('career_feedback_label')}
                        rows={5}
                        onOptimize={assessmentData.careerFeedback ? handleOptimizeFeedback : undefined}
                        isOptimizing={isOptimizingFeedback}
                        labelClassName="text-center"
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
