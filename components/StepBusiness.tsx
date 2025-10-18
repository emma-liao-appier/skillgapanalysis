import React, { useState, useCallback, useEffect } from 'react';
import { AssessmentData, Skill, SkillCategory, BusinessStage } from '../types';
import SkillRating from './SkillRating';
import ThinkingRobot from './ThinkingRobot';
import RatingExplanation from './RatingExplanation';
import OptimizableInput from './OptimizableInput';
import OptimizeButton from './OptimizeButton';
import { apiService } from '../services/apiService';
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
  user: any; // 用戶資訊
}

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
    useEffect(() => {
      if (skillType === 'catalogue' && category !== SkillCategory.Functional) {
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
            id: selectedCatalogueSkill.skillId,
            name: selectedCatalogueSkill.name,
            description: selectedCatalogueSkill.description,
            category: selectedCatalogueSkill.category.toLowerCase() as SkillCategory,
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
            <h4 className="text-lg font-semibold text-slate-200">{t('business_add_skill_title')}</h4>
            
            {/* 技能類型選擇 */}
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Skill Type</label>
                <div className="flex gap-4">
                    <label className="flex items-center">
                        <input 
                            type="radio" 
                            value="catalogue" 
                            checked={skillType === 'catalogue'}
                            onChange={(e) => setSkillType(e.target.value as 'catalogue' | 'custom')}
                            className="mr-2"
                        />
                        From Catalogue
                    </label>
                    <label className="flex items-center">
                        <input 
                            type="radio" 
                            value="custom" 
                            checked={skillType === 'custom'}
                            onChange={(e) => setSkillType(e.target.value as 'catalogue' | 'custom')}
                            className="mr-2"
                        />
                        Custom Functional Skill
                    </label>
                </div>
            </div>

            {/* 技能類別選擇 */}
            <div>
                 <label htmlFor="skill-category" className="block text-sm font-medium text-slate-300 mb-1">{t('business_add_skill_category')}</label>
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

            {/* 從目錄選擇技能 */}
            {skillType === 'catalogue' && category !== SkillCategory.Functional && (
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Select Skill</label>
                    {isLoadingCatalogue ? (
                        <div className="text-slate-400">Loading skills...</div>
                    ) : (
                        <select 
                            value={selectedCatalogueSkill?.skillId || ''} 
                            onChange={e => {
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
                            <div className="font-medium">{selectedCatalogueSkill.name}</div>
                            <div className="text-slate-400">{selectedCatalogueSkill.description}</div>
                        </div>
                    )}
                </div>
            )}

            {/* 自定義技能輸入 */}
            {skillType === 'custom' && (
                <>
                    <div>
                         <label htmlFor="skill-name" className="block text-sm font-medium text-slate-300 mb-1">{t('business_add_skill_name')}</label>
                         <input 
                             id="skill-name" 
                             type="text" 
                             value={name} 
                             onChange={e => setName(e.target.value)} 
                             className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500" 
                         />
                    </div>
                     <div>
                         <label htmlFor="skill-desc" className="block text-sm font-medium text-slate-300 mb-1">{t('business_add_skill_desc')}</label>
                         <textarea 
                             id="skill-desc" 
                             value={description} 
                             onChange={e => setDescription(e.target.value)} 
                             rows={2} 
                             className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500" 
                         />
                    </div>
                </>
            )}

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
  user,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingKR, setIsGeneratingKR] = useState(false);
  const [isOptimizingGoal, setIsOptimizingGoal] = useState(false);
  const [isOptimizingSupport, setIsOptimizingSupport] = useState(false);
  const [isOptimizingObstacles, setIsOptimizingObstacles] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const { t } = useLanguage();

  const handleGenerateSkills = useCallback(async () => {
    if (!assessmentData.businessGoal) {
      alert("Please enter your business goal.");
      return;
    }
    setIsLoading(true);
    
    try {
      // 使用新的 AI 技能推薦 API
      const response = await apiService.recommendSkills(
        user?.email || 'emma.liao@appier.com', // 使用實際的用戶 email
        assessmentData.businessGoal,
        assessmentData.keyResults
      );
      
      // 將推薦的技能轉換為前端格式
      const fetchedSkills = response.skills.map((skill: any) => ({
        id: skill.id,
        name: skill.name,
        description: skill.description,
        category: skill.category.toLowerCase(),
        rating: 0
      }));
      
      updateSkills(fetchedSkills);
      setStage('rating');
    } catch (error) {
      console.error('Error generating skills:', error);
      alert('Failed to generate skills. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [assessmentData.businessGoal, assessmentData.keyResults, updateSkills, setStage]);
  
  const handleSuggestKeyResults = async () => {
    setIsGeneratingKR(true);
    const response = await apiService.generateKeyResults(assessmentData.role, assessmentData.businessGoal) as { keyResults?: string };
    const suggestions = response.keyResults || '';
    updateKeyResults(suggestions);
    setIsGeneratingKR(false);
  };

  const handleOptimizeBusinessGoal = async () => {
    if (!assessmentData.role || !assessmentData.businessGoal) {
      alert("Please enter both your role and business goal before optimizing.");
      return;
    }
    
    setIsOptimizingGoal(true);
    try {
      const response = await apiService.optimizeBusinessGoal(assessmentData.role, assessmentData.businessGoal) as { optimizedGoal?: string } | string;
      if (typeof response === 'string') {
        updateBusinessGoal(response);
      } else {
        updateBusinessGoal(response.optimizedGoal || '');
      }
    } catch (error) {
      console.error("Error optimizing business goal:", error);
      alert("Failed to optimize business goal. Please try again.");
    } finally {
      setIsOptimizingGoal(false);
    }
  };

  const handleOptimizeSupport = async () => {
    if (!assessmentData.businessFeedbackSupport) {
      alert("Please enter some text before optimizing.");
      return;
    }
    
    setIsOptimizingSupport(true);
    try {
      const response = await apiService.optimizeText(assessmentData.businessFeedbackSupport) as { optimizedText?: string } | string;
      if (typeof response === 'string') {
        updateBusinessFeedbackSupport(response);
      } else {
        updateBusinessFeedbackSupport(response.optimizedText || '');
      }
    } catch (error) {
      console.error("Error optimizing support feedback:", error);
      alert("Failed to optimize support feedback. Please try again.");
    } finally {
      setIsOptimizingSupport(false);
    }
  };

  const handleOptimizeObstacles = async () => {
    if (!assessmentData.businessFeedbackObstacles) {
      alert("Please enter some text before optimizing.");
      return;
    }
    
    setIsOptimizingObstacles(true);
    try {
      const response = await apiService.optimizeText(assessmentData.businessFeedbackObstacles) as { optimizedText?: string } | string;
      if (typeof response === 'string') {
        updateBusinessFeedbackObstacles(response);
      } else {
        updateBusinessFeedbackObstacles(response.optimizedText || '');
      }
    } catch (error) {
      console.error("Error optimizing obstacles feedback:", error);
      alert("Failed to optimize obstacles feedback. Please try again.");
    } finally {
      setIsOptimizingObstacles(false);
    }
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
      // 保存業務目標到資料庫
      saveBusinessData();
      setStage('results');
    } else if (stage === 'results') {
      // 保存關鍵結果到資料庫
      saveBusinessData();
      // If skills are already generated, just move to the rating page. Otherwise, generate them.
      if (assessmentData.businessSkills.length > 0) {
        setStage('rating');
      } else {
        handleGenerateSkills();
      }
    } else if (stage === 'rating') {
      // 保存技能評分到資料庫
      saveBusinessData();
      setStage('feedback');
    } else if (stage === 'feedback') {
      // 保存反饋資料到資料庫
      saveBusinessData();
      onComplete();
    }
  }

  // 保存業務資料到資料庫
  const saveBusinessData = async () => {
    try {
      await apiService.saveBusinessData(
        user?.email || 'emma.liao@appier.com', // 使用實際的用戶 email
        assessmentData.businessGoal,
        assessmentData.keyResults,
        assessmentData.businessSkills,
        assessmentData.businessFeedbackSupport,
        assessmentData.businessFeedbackObstacles
      );
    } catch (error) {
      console.error('Error saving business data:', error);
    }
  };
  
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
            <OptimizableInput
                id="business-goal"
                value={assessmentData.businessGoal}
                onChange={updateBusinessGoal}
                placeholder={t('business_goal_placeholder')}
                label={t('business_goal_label')}
                rows={4}
                onOptimize={assessmentData.role && assessmentData.businessGoal ? handleOptimizeBusinessGoal : undefined}
                isOptimizing={isOptimizingGoal}
            />
          </div>
        );
      case 'results':
        return (
          <div className="flex flex-col items-center justify-center h-full gap-4 mt-8 text-center">
            <OptimizableInput
                id="key-results"
                value={assessmentData.keyResults}
                onChange={updateKeyResults}
                placeholder={t('business_key_results_placeholder')}
                label={t('business_key_results_label')}
                rows={5}
                labelClassName="text-center"
            />
            <OptimizeButton
                onClick={handleSuggestKeyResults}
                disabled={false}
                isLoading={isGeneratingKR}
                hasContent={true}
                className="text-sm px-6 py-2"
            />
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
                <OptimizableInput
                    id="business-feedback-support"
                    value={assessmentData.businessFeedbackSupport}
                    onChange={updateBusinessFeedbackSupport}
                    placeholder={t('business_feedback_placeholder_support')}
                    label={t('business_feedback_label_support')}
                    rows={3}
                    onOptimize={assessmentData.businessFeedbackSupport ? handleOptimizeSupport : undefined}
                    isOptimizing={isOptimizingSupport}
                    labelClassName="text-center"
                />
                <OptimizableInput
                    id="business-feedback-obstacles"
                    value={assessmentData.businessFeedbackObstacles}
                    onChange={updateBusinessFeedbackObstacles}
                    placeholder={t('business_feedback_placeholder_obstacles')}
                    label={t('business_feedback_label_obstacles')}
                    rows={3}
                    onOptimize={assessmentData.businessFeedbackObstacles ? handleOptimizeObstacles : undefined}
                    isOptimizing={isOptimizingObstacles}
                    labelClassName="text-center"
                />
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