import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AssessmentData, SummaryData, SummaryStage, SkillCategory, Skill } from '../types';
import ThinkingRobot from './ThinkingRobot';
import { generateSummary } from '../services/geminiService';
import { useLanguage } from '../context/LanguageContext';

interface StepSummaryProps {
  assessmentData: AssessmentData;
  updateSummary: (summary: SummaryData) => void;
  updateNextSteps: (steps: string[]) => void;
  updateNextStepsOther: (other: string) => void;
  updateFinalThoughts: (thoughts: string) => void;
}

const ProgressCircle: React.FC<{ percentage: number; label: string; color: string }> = ({ percentage, label, color }) => {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center relative">
      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
        <circle className="text-slate-700" strokeWidth="10" stroke="currentColor" fill="transparent" r={radius} cx="60" cy="60" />
        <circle
          className={color}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="60"
          cy="60"
          style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
        />
      </svg>
      <span className="absolute text-2xl font-bold top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">{percentage}%</span>
      <p className="mt-2 text-sm font-semibold text-slate-300">{label}</p>
    </div>
  );
};


const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
  const fullStars = Math.round(rating > 0 ? rating : 0);
  const emptyStars = 5 - fullStars;
  return (
    <span className="text-amber-400" aria-label={`${fullStars} out of 5 stars`}>
      {'★'.repeat(fullStars)}
      <span className="text-slate-500">{'★'.repeat(emptyStars)}</span>
    </span>
  );
};

const GapIndicator: React.FC<{ avgRating: number }> = ({ avgRating }) => {
  if (avgRating <= 3.0) {
    return <span className="font-semibold text-red-400">🔥 High</span>;
  }
  if (avgRating < 4.0) {
    return <span className="font-semibold text-amber-400">⚠️ Moderate</span>;
  }
  return <span className="font-semibold text-green-400">✅ Low</span>;
};


const FeedbackRequestModal: React.FC<{onClose: () => void;}> = ({ onClose }) => {
    const { t } = useLanguage();
    const [emails, setEmails] = useState('');
    const handleSend = () => {
        alert(`${t('summary_360_feedback_alert')}\n\n${emails}`);
        onClose();
    }
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
                <h3 className="text-xl font-semibold text-white">{t('summary_360_feedback_title')}</h3>
                <p className="text-slate-400 mt-2 text-sm">{t('summary_360_feedback_desc')}</p>
                <textarea 
                    value={emails}
                    onChange={(e) => setEmails(e.target.value)}
                    rows={4}
                    className="w-full mt-4 bg-slate-700 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder={t('summary_360_feedback_placeholder')}
                />
                <div className="flex justify-end gap-3 mt-4">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-300 bg-slate-600 rounded-md hover:bg-slate-500 transition-colors">{t('common_cancel')}</button>
                    <button onClick={handleSend} className="px-4 py-2 text-sm font-semibold text-white bg-cyan-600 rounded-md hover:bg-cyan-500 transition-colors">{t('summary_360_feedback_send')}</button>
                </div>
            </div>
        </div>
    )
}

const EmailGrowthPlanModal: React.FC<{onClose: () => void;}> = ({ onClose }) => {
    const { t } = useLanguage();
    const [email, setEmail] = useState('mail@ssss.com');
    const [isSent, setIsSent] = useState(false);

    const handleSend = () => {
        console.log(`Emailing growth plan to: ${email}`);
        setIsSent(true);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md text-center">
                {!isSent ? (
                    <>
                        <h3 className="text-xl font-semibold text-white">{t('summary_email_modal_title')}</h3>
                        <p className="text-slate-400 mt-2 text-sm">{t('summary_email_modal_desc')}</p>
                        <label htmlFor="email-input" className="block text-left text-sm font-medium text-slate-300 mt-4 mb-1">{t('summary_email_modal_confirm_label')}</label>
                        <input
                            id="email-input"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-300 bg-slate-600 rounded-md hover:bg-slate-500 transition-colors">{t('common_cancel')}</button>
                            <button onClick={handleSend} className="px-4 py-2 text-sm font-semibold text-white bg-cyan-600 rounded-md hover:bg-cyan-500 transition-colors">{t('summary_email_modal_send')}</button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                            <span className="text-4xl text-green-400">✉️</span>
                        </div>
                        <h3 className="text-xl font-semibold text-white mt-4">AItlas says:</h3>
                        <p className="text-slate-300 mt-1">{t('summary_email_modal_success_message')}</p>
                        <button onClick={onClose} className="mt-6 w-12 h-12 flex items-center justify-center bg-slate-600 hover:bg-slate-500 rounded-full text-2xl font-bold transition-colors mx-auto" aria-label={t('summary_email_modal_close')}>
                            ✓
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}

const nextStepsOptions = [
    'next_steps_1', 'next_steps_2', 'next_steps_3', 'next_steps_4', 'next_steps_5', 'next_steps_6', 'next_steps_other'
];


const StepSummary: React.FC<StepSummaryProps> = ({ assessmentData, updateSummary, updateNextSteps, updateNextStepsOther, updateFinalThoughts }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stage, setStage] = useState<SummaryStage>('report');
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const { t } = useLanguage();
  
  const fetchSummary = useCallback(async () => {
    if (assessmentData.summary) return; // Don't re-fetch if summary already exists
    setIsLoading(true);
    const summaryData = await generateSummary(assessmentData);
    updateSummary(summaryData);
    setIsLoading(false);
  }, [assessmentData, updateSummary]);

  useEffect(() => {
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const summaryCalculations = useMemo(() => {
    if (!assessmentData.summary) return null;

    const skillMap = new Map<string, { skill: Skill, relevance: ('business' | 'career')[] }>();

    assessmentData.businessSkills.forEach(skill => {
        if (!skillMap.has(skill.name)) {
            skillMap.set(skill.name, { skill, relevance: [] });
        }
        skillMap.get(skill.name)!.relevance.push('business');
    });
    
    assessmentData.careerSkills.forEach(skill => {
        if (!skillMap.has(skill.name)) {
            skillMap.set(skill.name, { skill, relevance: [] });
        }
        if (!skillMap.get(skill.name)!.relevance.includes('career')) {
            skillMap.get(skill.name)!.relevance.push('career');
        }
    });

    const combinedSkills = Array.from(skillMap.values());
    const allSkills = combinedSkills.map(item => item.skill);

    const skillStatsByCategory = Object.values(SkillCategory).map(category => {
        const skillsInCategory = allSkills.filter(s => s.category === category);
        if (skillsInCategory.length === 0) return null;

        const totalRating = skillsInCategory.reduce((acc, s) => acc + s.rating, 0);
        const averageRating = totalRating / skillsInCategory.length;
        
        return {
            category,
            skillCount: skillsInCategory.length,
            averageRating,
        };
    }).filter((s): s is NonNullable<typeof s> => s !== null);


    const focusAreas = [...skillStatsByCategory]
        .sort((a, b) => a.averageRating - b.averageRating)
        .slice(0, 2)
        .map(s => t(`skill_category_${s.category}`));
        
    const rankedSkills = combinedSkills.sort((a, b) => a.skill.rating - b.skill.rating);

    return { skillStatsByCategory, focusAreas, rankedSkills };
  }, [assessmentData, t]);


  const handleSubmit = async () => {
    setIsSubmitting(true);
    console.log("--- SUBMITTING ASSESSMENT DATA TO BACKEND ---");
    console.log(JSON.stringify(assessmentData, null, 2));
    console.log("This data would be sent to a backend API which then writes to Google Sheets.");
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    alert("Assessment submitted successfully! The final data object has been logged to the developer console for your review.");
  };

  const handleNextStepChange = (option: string) => {
    const currentSteps = assessmentData.nextSteps || [];
    const newSteps = currentSteps.includes(option)
      ? currentSteps.filter(item => item !== option)
      : [...currentSteps, option];
    updateNextSteps(newSteps);
  };

  if (isLoading) {
      return <ThinkingRobot message={t('loading_summary')} />;
  }
  
  if (!assessmentData.summary || !summaryCalculations) {
    return <div className="text-center text-slate-400">{t('summary_load_error')}</div>
  }
  
  const { skillStatsByCategory, focusAreas, rankedSkills } = summaryCalculations;

  const renderReport = () => (
    <>
      <h3 className="text-2xl font-bold text-slate-100 text-center mb-2">🎯 {t('summary_title')}</h3>
      <div className="flex justify-center items-center gap-8 my-4">
        <ProgressCircle percentage={assessmentData.summary.businessReadiness} label={t('summary_business_readiness')} color="text-cyan-400" />
        <ProgressCircle percentage={assessmentData.summary.careerReadiness} label={t('summary_career_readiness')} color="text-green-400" />
      </div>
      <p className="text-center max-w-3xl mx-auto text-slate-300 mb-8 bg-slate-800/50 p-4 rounded-lg">
        <span className="text-xl inline-block mr-2">💡</span>{assessmentData.summary.recommendations}
      </p>

      {/* Skill Gap Overview */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-slate-200 mb-3">📊 Skill Gap Overview</h4>
        <div className="bg-slate-800/50 p-4 rounded-lg space-y-3">
            {skillStatsByCategory.map(stat => (
                <div key={stat.category} className="grid grid-cols-12 gap-2 items-center text-sm">
                    <div className="font-bold text-slate-300 col-span-12 md:col-span-5">{t(`skill_category_${stat.category}`)}</div>
                    <div className="text-xs text-slate-400 col-span-6 md:col-span-4">{stat.skillCount} skills | Avg {stat.averageRating.toFixed(1)}/5</div>
                    <div className="col-span-6 md:col-span-3 text-right md:text-left"><GapIndicator avgRating={stat.averageRating} /></div>
                </div>
            ))}
          <p className="text-right text-sm text-slate-400 mt-3 border-t border-slate-700 pt-2">
            → Focus: {focusAreas.join(', ')}
          </p>
        </div>
      </div>

      {/* Ranked Skill Focus */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-slate-200 mb-3">🏆 Your Ranked Skill Focus</h4>
        <div className="text-sm space-y-2 text-slate-300">
            {rankedSkills.map(({skill, relevance}, index) => (
                <div key={skill.id} className="grid grid-cols-12 gap-2 items-center bg-slate-800/40 p-2 rounded-md">
                    <div className="col-span-12 sm:col-span-5 flex items-baseline">
                        <span className="text-slate-500 w-6 text-right mr-1">{index + 1}.</span>
                        <span className="font-semibold text-slate-200">{skill.name}</span>
                    </div>
                    <div className="col-span-5 sm:col-span-3 text-xs text-cyan-400">[{t(`skill_category_${skill.category}`)}]</div>
                    <div className="col-span-7 sm:col-span-2"><StarRating rating={skill.rating} /></div>
                    <div className="col-span-12 sm:col-span-2 text-xs text-slate-400 sm:text-right">
                        {relevance.includes('business') && 'Biz'}
                        {relevance.length > 1 && <span className="text-cyan-400 mx-1">🎯</span>}
                        {relevance.includes('career') && 'Career'}
                    </div>
                </div>
            ))}
        </div>
      </div>
      
      {/* Suggested Next Steps */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-slate-200 mb-3">📅 Suggested Next Steps</h4>
        <ul className="space-y-2">
          {assessmentData.summary.suggestedNextSteps.map((step, i) => (
            <li key={i} className="flex items-start gap-3 bg-slate-800/40 p-3 rounded-md">
              <span className="text-cyan-400 mt-1">☑</span>
              <span className="text-slate-300">{step}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-700 flex flex-col sm:flex-row items-center justify-center gap-4">
        <button onClick={() => setIsEmailModalOpen(true)} className="w-full sm:w-auto text-sm px-4 py-2 font-semibold text-slate-300 bg-slate-700 rounded-md hover:bg-slate-600 transition-colors">
            {t('summary_action_send')}
        </button>
        <button onClick={() => setIsFeedbackModalOpen(true)} className="w-full sm:w-auto text-sm px-4 py-2 font-semibold text-slate-300 bg-slate-700 rounded-md hover:bg-slate-600 transition-colors">
            {t('summary_action_360')}
        </button>
      </div>
    </>
  );

  const renderFinalInput = () => (
    <div>
        <div className="mb-6">
            <label className="block text-lg font-semibold text-slate-100 mb-3">{t('summary_next_steps_label')}</label>
            <div className="space-y-3">
                {nextStepsOptions.map(optionKey => (
                    <div key={optionKey}>
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                className="mt-1 h-4 w-4 rounded border-slate-500 bg-slate-700 text-cyan-600 focus:ring-cyan-500"
                                checked={assessmentData.nextSteps?.includes(optionKey)}
                                onChange={() => handleNextStepChange(optionKey)}
                            />
                            <span className="text-slate-300">{t(optionKey)}</span>
                        </label>
                        {optionKey === 'next_steps_other' && assessmentData.nextSteps?.includes('next_steps_other') && (
                             <input 
                                type="text"
                                value={assessmentData.nextStepsOther}
                                onChange={(e) => updateNextStepsOther(e.target.value)}
                                className="w-full mt-2 ml-7 bg-slate-700 border border-slate-600 rounded-md px-3 py-1 text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                placeholder={t('next_steps_other_placeholder')}
                             />
                        )}
                    </div>
                ))}
            </div>
        </div>
        <div className="mt-8">
            <label htmlFor="final-thoughts" className="block text-lg font-semibold text-slate-100 mb-2">{t('summary_final_thoughts_label')}</label>
            <textarea
                id="final-thoughts"
                value={assessmentData.finalThoughts}
                onChange={(e) => updateFinalThoughts(e.target.value)}
                rows={3}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder={t('summary_final_thoughts_placeholder')}
            />
        </div>
    </div>
  );

  return (
    <div className="flex flex-col" style={{minHeight: '436px'}}>
      {isFeedbackModalOpen && <FeedbackRequestModal onClose={() => setIsFeedbackModalOpen(false)} />}
      {isEmailModalOpen && <EmailGrowthPlanModal onClose={() => setIsEmailModalOpen(false)} />}
      <div className="flex-grow">
          <div className="flex items-center gap-2 mb-6">
            <span className="w-5 h-5 bg-purple-400/80 rounded-full flex items-center justify-center text-sm font-bold text-purple-900">
                📊
            </span>
            <h3 className="text-xl font-semibold text-slate-100">{stage === 'report' ? t('header_summary') : t('summary_final_input_title')}</h3>
          </div>
          {stage === 'report' ? renderReport() : renderFinalInput()}
      </div>

       <div className="mt-auto pt-6 border-t border-slate-700 flex justify-between items-center">
             <button
                onClick={() => stage === 'finalInput' && setStage('report')}
                className={`px-6 py-2 font-semibold rounded-full transition-colors ${stage === 'report' ? 'invisible' : 'bg-slate-600 text-white hover:bg-slate-500'}`}
            >
                &lt; {t('common_back')}
            </button>

            {stage === 'report' ? (
                <button
                    onClick={() => setStage('finalInput')}
                    className="px-6 py-2 bg-cyan-500 text-white font-semibold rounded-full hover:bg-cyan-600 transition-colors"
                >
                    {t('common_continue')} &gt;
                </button>
            ) : (
                <button 
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-cyan-500 text-white font-semibold rounded-full hover:bg-cyan-600 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {isSubmitting ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {t('common_submitting')}
                        </>
                    ) : (
                        t('summary_submit_button')
                    )}
                </button>
            )}
        </div>
    </div>
  );
};

export default StepSummary;