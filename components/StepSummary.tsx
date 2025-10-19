import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AssessmentData, SummaryData, SummaryStage, SkillCategory, Skill } from '../types';
import ThinkingRobot from './ThinkingRobot';
import { apiService } from '../services/apiService';
import { useLanguage } from '../context/LanguageContext';
import { generateAlignmentAnalysis, calculateReadinessLevel, determineTalentType } from '../lib/alignmentScore';

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
  const [selectedVennArea, setSelectedVennArea] = useState<'business' | 'career' | 'alignment' | null>(null);
  const { t } = useLanguage();
  
  type AlignmentLevel = 'High' | 'Partial' | 'Low';
  type ReadinessLevel = 'High' | 'Medium' | 'Low';
  type TalentType =
    | 'Strategic Contributor'
    | 'Emerging Talent'
    | 'Foundational Builder'
    | 'Functional Expert'
    | 'Evolving Generalist'
    | 'Exploring Talent'
    | 'Re-direction Needed'
    | 'Potential Shifter'
    | 'Career Explorer';
  
  interface TalentNavigation {
    alignmentScore: number; // 0-100
    readinessScore: number; // 0-100
    alignmentLevel: AlignmentLevel;
    readinessLevel: ReadinessLevel;
    talentType: TalentType;
    focusAreas: string[];
    recommendations: string[];
  }
  
  const fetchSummary = useCallback(async () => {
    if (assessmentData.summary) return; // Don't re-fetch if summary already exists
    setIsLoading(true);
    // For now, we'll create a temporary assessment to generate summary
    const tempAssessmentId = 'temp-' + Date.now();
    const response = await apiService.generateSummary(tempAssessmentId);
    const summaryData = response.summary;
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

    return { skillStatsByCategory, focusAreas, rankedSkills, combinedSkills };
  }, [assessmentData, t]);

  // Filter skills based on selected Venn area
  const filteredSkills = useMemo(() => {
    if (!summaryCalculations) return [];
    
    if (!selectedVennArea) {
      return summaryCalculations.rankedSkills; // Show all skills
    }
    
    if (selectedVennArea === 'alignment') {
      // Show skills that appear in both business and career
      return summaryCalculations.combinedSkills.filter(({ relevance }) => 
        relevance.includes('business') && relevance.includes('career')
      );
    }
    
    // Show skills for the selected area
    return summaryCalculations.combinedSkills.filter(({ relevance }) => 
      relevance.includes(selectedVennArea)
    );
  }, [summaryCalculations, selectedVennArea]);

  // Filter skill gap overview based on selected Venn area
  const filteredSkillStats = useMemo(() => {
    if (!summaryCalculations) return [];
    
    if (!selectedVennArea) {
      return summaryCalculations.skillStatsByCategory; // Show all categories
    }
    
    // Filter categories that have skills in the selected area
    return summaryCalculations.skillStatsByCategory.filter(stat => {
      const skillsInCategory = summaryCalculations.combinedSkills.filter(({ skill }) => 
        skill.category === stat.category
      );
      
      if (selectedVennArea === 'alignment') {
        return skillsInCategory.some(({ relevance }) => 
          relevance.includes('business') && relevance.includes('career')
        );
      }
      
      return skillsInCategory.some(({ relevance }) => 
        relevance.includes(selectedVennArea)
      );
    });
  }, [summaryCalculations, selectedVennArea]);

  // Deterministic Talent Navigation analysis using new alignment score system
  const talentNavigation: TalentNavigation | null = useMemo(() => {
    if (!assessmentData.summary) return null;

    // 使用新的 alignment score 計算系統
    const alignmentAnalysis = generateAlignmentAnalysis(
      assessmentData.businessSkills,
      assessmentData.careerSkills,
      assessmentData.businessGoal,
      assessmentData.careerGoal
    );

    const alignmentScore = assessmentData.summary.alignmentScore || alignmentAnalysis.score;
    const alignmentLevel = assessmentData.summary.alignmentLevel || alignmentAnalysis.level;

    // 計算 readiness score
    const allSkills = [...assessmentData.businessSkills, ...assessmentData.careerSkills];
    const readinessLevel = calculateReadinessLevel(allSkills);

    // 使用新的 talent type 判定
    const talentType = assessmentData.summary.talentType || determineTalentType(alignmentLevel, readinessLevel);

    // Focus areas from summary or calculate from lowest categories
    let focusAreas: string[] = [];
    if (assessmentData.summary.alignmentComponents) {
      // 使用 summary 中的 focus areas 或根據 alignment components 計算
      focusAreas = assessmentData.summary.focusAreas || [];
    } else {
      // 回退到原有的計算方式
      const categories = new Map<string, { count: number; total: number }>();
      for (const s of allSkills) {
        const key = s.category;
        const item = categories.get(key) || { count: 0, total: 0 };
        item.count += 1;
        item.total += s.rating;
        categories.set(key, item);
      }
      const categoryAverages = Array.from(categories.entries()).map(([cat, { count, total }]) => ({ cat, avg: count ? total / count : 0 }));
      focusAreas = categoryAverages.sort((x, y) => x.avg - y.avg).slice(0, 3).map(x => t(`skill_category_${x.cat}`));
    }


    // 使用 summary 中的 recommendations 或回退到預設建議
    const recommendations = assessmentData.summary.suggestedNextSteps || getDefaultRecommendations(talentType);

    return {
      alignmentScore,
      alignmentLevel,
      readinessLevel,
      talentType,
      focusAreas,
      recommendations
    };
  }, [assessmentData.summary, assessmentData.businessSkills, assessmentData.careerSkills, assessmentData.businessGoal, assessmentData.careerGoal, t]);

  // 預設建議函數
  const getDefaultRecommendations = (talentType: string): string[] => {
    const recMap: Record<string, string[]> = {
      'Strategic Contributor': [
        'Mentor others to scale your impact',
        'Lead cross-functional initiatives with clear outcomes',
        'Shape strategy and decision-making rituals',
      ],
      'Emerging Talent': [
        'Own a small cross-functional project end-to-end',
        'Practice leadership behaviors in team rituals',
        'Seek a sponsor for stretch opportunities',
      ],
      'Foundational Builder': [
        'Focus on hands-on practice with guided tasks',
        'Pair with a senior for weekly skill drills',
        'Track progress on 2-3 core skills',
      ],
      'Functional Expert': [
        'Broaden influence beyond function (teach, document, demo)',
        'Enable mobility by pairing with adjacent teams',
        'Translate expertise into reusable playbooks',
      ],
      'Evolving Generalist': [
        'Rotate projects to widen exposure',
        'Request a mentor for career clarity',
        'Define a 90-day growth theme',
      ],
      'Exploring Talent': [
        'Clarify goals with manager; pick 1-2 bets',
        'Try short skill trials (2-4 weeks)',
        'Reflect weekly on fit and energy',
      ],
      'Re-direction Needed': [
        'Re-align goals with business needs',
        'Negotiate role-fit or scope changes',
        'Prioritize outcomes over activities',
      ],
      'Potential Shifter': [
        'Establish career clarity and learning plan',
        'Seek project rotation to test fit',
        'Find a peer coach in target area',
      ],
      'Career Explorer': [
        'Start with skill discovery and goal clarity',
        'Try diverse projects to find passion',
        'Build foundational skills systematically',
      ],
    };
    return recMap[talentType] || recMap['Evolving Generalist'];
  };

  const getAlignmentBadge = (lvl: AlignmentLevel) => {
    const map: Record<AlignmentLevel, { icon: string; cls: string }> = {
      High: { icon: '✅', cls: 'text-green-400' },
      Partial: { icon: '⚖️', cls: 'text-yellow-400' },
      Low: { icon: '🧭', cls: 'text-orange-400' }, // use a positive, guidance-oriented symbol
    };
    const { icon, cls } = map[lvl];
    return <span className={`font-semibold ${cls}`}>{icon} {lvl}</span>;
  };

  const getReadinessBadge = (lvl: ReadinessLevel) => {
    const map: Record<ReadinessLevel, { icon: string; cls: string }> = {
      High: { icon: '💪', cls: 'text-green-400' },
      Medium: { icon: '⚖️', cls: 'text-yellow-400' },
      Low: { icon: '🌱', cls: 'text-cyan-400' },
    };
    const { icon, cls } = map[lvl];
    return <span className={`font-semibold ${cls}`}>{icon} {lvl}</span>;
  };

  const talentTypeDescriptions: Record<TalentType, string> = {
    'Strategic Contributor': 'You drive impact across teams and help shape strategy. Keep scaling your influence through coaching and system-level thinking.',
    'Emerging Talent': 'You are growing quickly with clear potential. Lean into ownership moments and practice visible leadership behaviors.',
    'Foundational Builder': 'You are laying strong foundations. Consistent practice and guided challenges will accelerate your momentum.',
    'Functional Expert': 'You bring deep expertise. Share knowledge and expand your impact across functions to multiply value.',
    'Evolving Generalist': 'You are building breadth and adaptability. Explore adjacent domains and clarify your next growth theme.',
    'Exploring Talent': 'You are discovering your best fit. Short, low-risk trials and reflections will surface your strengths.',
    'Re-direction Needed': 'You have strong skills—re-aim them toward the most business-aligned goals for outsized impact.',
    'Potential Shifter': 'You are ready for a shift. Clarify direction and try a rotation to test and build confidence.',
    'Career Explorer': 'You are at the start of a new path. Guided learning and role shadowing will help you move forward with confidence.',
  };


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

  // 使用 summary 中的 venn diagram feedback 或預設 messages
  const vennDiagramMessages = assessmentData.summary?.vennDiagramFeedback || {
    businessFeedback: "Your business skills show strong execution capabilities. Focus on scaling impact through systematic approaches and cross-functional collaboration.",
    careerFeedback: "Your career development path demonstrates clear growth potential. Continue building expertise while expanding leadership influence.",
    alignmentFeedback: "Your business and career goals show promising alignment. This synergy creates opportunities for accelerated growth and meaningful impact."
  };

  const getVennMessage = (area: string) => {
    if (area === 'business') return vennDiagramMessages.businessFeedback;
    if (area === 'career') return vennDiagramMessages.careerFeedback;
    if (area === 'alignment') return vennDiagramMessages.alignmentFeedback;
    return '';
  };

  const VennDiagram: React.FC = () => {
    const circleSize = 60;
    const overlap = 20;
    const centerX = 90; // 移到更中心位置
    const centerY = 70; // 移到更中心位置

    return (
      <div className="flex justify-center my-6">
        <svg width="180" height="140" className="cursor-pointer"> {/* 放大 container */}
          {/* Business Skills Circle */}
          <circle
            cx={centerX - overlap/2}
            cy={centerY}
            r={circleSize}
            fill={selectedVennArea === 'business' ? 'rgba(0, 191, 255, 0.3)' : 'rgba(0, 191, 255, 0.15)'}
            stroke="rgba(0, 191, 255, 0.8)"
            strokeWidth="2"
            className="transition-all duration-300 hover:fill-cyan-400/30 backdrop-blur-sm"
            onClick={() => setSelectedVennArea(selectedVennArea === 'business' ? null : 'business')}
            style={{ 
              filter: selectedVennArea === 'business' 
                ? 'drop-shadow(0 0 20px rgba(0, 191, 255, 0.6))' 
                : 'drop-shadow(0 0 10px rgba(0, 191, 255, 0.3))',
              opacity: selectedVennArea && selectedVennArea !== 'business' && selectedVennArea !== 'alignment' ? '0.4' : '1'
            }}
          />
          
          {/* Career Skills Circle */}
          <circle
            cx={centerX + overlap/2}
            cy={centerY}
            r={circleSize}
            fill={selectedVennArea === 'career' ? 'rgba(138, 43, 226, 0.3)' : 'rgba(138, 43, 226, 0.15)'}
            stroke="rgba(138, 43, 226, 0.8)"
            strokeWidth="2"
            className="transition-all duration-300 hover:fill-purple-400/30 backdrop-blur-sm"
            onClick={() => setSelectedVennArea(selectedVennArea === 'career' ? null : 'career')}
            style={{ 
              filter: selectedVennArea === 'career' 
                ? 'drop-shadow(0 0 20px rgba(138, 43, 226, 0.6))' 
                : 'drop-shadow(0 0 10px rgba(138, 43, 226, 0.3))',
              opacity: selectedVennArea && selectedVennArea !== 'career' && selectedVennArea !== 'alignment' ? '0.4' : '1'
            }}
          />
          
          {/* Alignment intersection area - enhanced visibility when selected */}
          <circle
            cx={centerX}
            cy={centerY}
            r={circleSize - overlap}
            fill={selectedVennArea === 'alignment' ? 'rgba(255, 105, 180, 0.4)' : 'transparent'}
            stroke={selectedVennArea === 'alignment' ? 'rgba(255, 105, 180, 0.8)' : 'none'}
            strokeWidth={selectedVennArea === 'alignment' ? '2' : '0'}
            className="cursor-pointer transition-all duration-300"
            onClick={() => setSelectedVennArea(selectedVennArea === 'alignment' ? null : 'alignment')}
            style={{
              filter: selectedVennArea === 'alignment' 
                ? 'drop-shadow(0 0 15px rgba(255, 105, 180, 0.5))' 
                : 'none'
            }}
          />
        </svg>
      </div>
    );
  };

  // Calculate readiness percentage for donut chart
  const getReadinessPercentage = () => {
    if (!selectedVennArea) {
      return 0;
    }

    const skills = selectedVennArea === 'business' ? assessmentData.businessSkills :
                   selectedVennArea === 'career' ? assessmentData.careerSkills :
                   [...assessmentData.businessSkills, ...assessmentData.careerSkills];

    if (skills.length === 0) return 0;

    const totalRating = skills.reduce((sum, skill) => sum + skill.rating, 0);
    const maxPossibleRating = skills.length * 5;
    const readinessPercentage = Math.round((totalRating / maxPossibleRating) * 100);
    
    return readinessPercentage;
  };

  // Get color based on selected area
  const getDonutColor = () => {
    if (selectedVennArea === 'business') return '#00bfff'; // Cyan
    if (selectedVennArea === 'career') return '#8a2be2'; // Purple  
    if (selectedVennArea === 'alignment') return '#ff69b4'; // Pink
    return '#64748b'; // Default slate
  };

  // Donut Chart Component for Readiness Level
  const DonutChart: React.FC = () => {
    const size = 120;
    const strokeWidth = 20;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const readinessPercentage = getReadinessPercentage();
    const donutColor = getDonutColor();
    
    // Progress segment (colored)
    const progressDasharray = `${(readinessPercentage / 100) * circumference} ${circumference}`;
    
    // Background segment (transparent gray)
    const backgroundDasharray = `${circumference - (readinessPercentage / 100) * circumference} ${circumference}`;
    const backgroundDashoffset = `-${(readinessPercentage / 100) * circumference}`;

    return (
      <div className="flex flex-col items-center">
        <div className="relative">
          <svg width={size} height={size} className="drop-shadow-lg">
            {/* Background circle (transparent gray) */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="rgba(148, 163, 184, 0.3)" // slate-400 with transparency
              strokeWidth={strokeWidth}
              strokeDasharray={backgroundDasharray}
              strokeDashoffset={backgroundDashoffset}
              strokeLinecap="round"
              style={{
                transform: 'rotate(-90deg)',
                transformOrigin: 'center'
              }}
            />
            
            {/* Progress circle (semi-transparent colored) */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={donutColor}
              strokeWidth={strokeWidth}
              strokeDasharray={progressDasharray}
              strokeDashoffset="0"
              strokeLinecap="round"
              className="transition-all duration-500"
              style={{
                transform: 'rotate(-90deg)',
                transformOrigin: 'center',
                opacity: 0.6 // Semi-transparent
              }}
            />
          </svg>
          
          {/* Center percentage */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-white">{readinessPercentage}%</span>
          </div>
        </div>
      </div>
    );
  };

  const renderReport = () => (
    <>
      {/* Talent Navigation Card - moved to top */}
      {talentNavigation && (
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-slate-200 mb-3">🌱 Your Talent Type</h4>
          <div className="bg-gradient-to-br from-purple-800/20 to-blue-800/20 p-5 rounded-lg border border-purple-700/30">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="text-xl font-bold text-white">{talentNavigation.talentType}</div>
              <div className="text-sm text-slate-300">
                Alignment: {getAlignmentBadge(talentNavigation.alignmentLevel)} • Skill Readiness: {getReadinessBadge(talentNavigation.readinessLevel)}
              </div>
            </div>
            <p className="text-slate-300 mt-3 text-sm leading-relaxed">
              {talentTypeDescriptions[talentNavigation.talentType]}
            </p>
            {talentNavigation.focusAreas.length > 0 && (
              <p className="text-slate-300 mt-4 text-sm">
                <span className="mr-1">💡</span>
                Focus Areas: {talentNavigation.focusAreas.join(' · ')}
              </p>
            )}
            <ul className="mt-3 space-y-1">
              {talentNavigation.recommendations.map((rec, idx) => (
                <li key={idx} className="text-slate-300 text-sm flex items-start">
                  <span className="text-purple-400 mr-2 mt-0.5">→</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Interactive Venn Diagram & Donut Chart - Side by Side Layout */}
      <div className="mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left: Venn Diagram */}
          <div className="flex flex-col items-center">
            <VennDiagram />
          </div>
          
          {/* Right: Donut Chart */}
          <div className="flex flex-col items-center">
            <DonutChart />
          </div>
        </div>
        
        {/* Area Labels - Centered below both diagrams */}
        <div className="flex justify-center items-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-cyan-400/30 border border-cyan-400"></div>
            <span className="text-sm text-slate-300">Business Skills</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-400/30 border border-purple-400"></div>
            <span className="text-sm text-slate-300">Career Skills</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-pink-400/30 border border-pink-400"></div>
            <span className="text-sm text-slate-300">Alignment</span>
          </div>
        </div>
        
        {/* Interactive Message Box - Full Width Below */}
        <div className={`backdrop-blur-md border p-6 rounded-xl shadow-2xl transition-all duration-500 mt-8 ${
          selectedVennArea === 'business' 
            ? 'bg-gradient-to-br from-cyan-900/40 to-cyan-800/30 border-cyan-500/50' 
            : selectedVennArea === 'career'
            ? 'bg-gradient-to-br from-purple-900/40 to-purple-800/30 border-purple-500/50'
            : selectedVennArea === 'alignment'
            ? 'bg-gradient-to-br from-pink-900/40 to-pink-800/30 border-pink-500/50'
            : 'bg-gradient-to-br from-slate-800/30 to-slate-700/30 border-slate-600/30'
        }`}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div className="flex-1">
              {selectedVennArea ? (
                <div>
                  <h5 className="text-lg font-semibold text-slate-100 mb-3">
                    {selectedVennArea === 'business' ? 'Business Skills' :
                     selectedVennArea === 'career' ? 'Career Skills' :
                     'Alignment Analysis'}
                  </h5>
                  <p className="text-slate-200 text-sm leading-relaxed">
                    {getVennMessage(selectedVennArea)}
                  </p>
                </div>
              ) : (
                <div>
                  <h5 className="text-lg font-semibold text-slate-100 mb-3">Interactive Skill Explorer</h5>
                  <p className="text-slate-400 text-sm italic">
                    Click on different parts of the diagram to filter skills and reflect on your development journey
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Skill Gap Overview */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-semibold text-slate-200">📊 Skill Gap Overview</h4>
          {selectedVennArea && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">Filtered by:</span>
              <span className={`text-sm font-semibold px-2 py-1 rounded ${
                selectedVennArea === 'business' ? 'bg-cyan-900/30 text-cyan-300' :
                selectedVennArea === 'career' ? 'bg-purple-900/30 text-purple-300' :
                'bg-pink-900/30 text-pink-300'
              }`}>
                {selectedVennArea === 'business' ? 'Business Skills' :
                 selectedVennArea === 'career' ? 'Career Skills' :
                 'Alignment Skills'}
              </span>
              <button 
                onClick={() => setSelectedVennArea(null)}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Clear filter
              </button>
            </div>
          )}
        </div>
        <div className="bg-slate-800/50 p-4 rounded-lg space-y-3">
            {filteredSkillStats.map(stat => (
                <div key={stat.category} className="grid grid-cols-12 gap-2 items-center text-sm">
                    <div className="font-bold text-slate-300 col-span-12 md:col-span-5">{t(`skill_category_${stat.category}`)}</div>
                    <div className="text-xs text-slate-400 col-span-6 md:col-span-4">{stat.skillCount} skills | Avg {stat.averageRating.toFixed(1)}/5</div>
                    <div className="col-span-6 md:col-span-3 text-right md:text-left"><GapIndicator avgRating={stat.averageRating} /></div>
                </div>
            ))}
            {filteredSkillStats.length === 0 && selectedVennArea && (
              <div className="text-center text-slate-500 py-4">
                <p>No skill categories found for this filter.</p>
                <button 
                  onClick={() => setSelectedVennArea(null)}
                  className="text-cyan-400 hover:text-cyan-300 text-sm mt-2"
                >
                  Show all categories
                </button>
              </div>
            )}
          <p className="text-right text-sm text-slate-400 mt-3 border-t border-slate-700 pt-2">
            → Focus: {focusAreas.join(', ')}
          </p>
        </div>
      </div>

      {/* Ranked Skill Focus */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-semibold text-slate-200">🏆 Your Ranked Skill Focus</h4>
          {selectedVennArea && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">Filtered by:</span>
              <span className={`text-sm font-semibold px-2 py-1 rounded ${
                selectedVennArea === 'business' ? 'bg-cyan-900/30 text-cyan-300' :
                selectedVennArea === 'career' ? 'bg-purple-900/30 text-purple-300' :
                'bg-pink-900/30 text-pink-300'
              }`}>
                {selectedVennArea === 'business' ? 'Business Skills' :
                 selectedVennArea === 'career' ? 'Career Skills' :
                 'Alignment Skills'}
              </span>
              <button 
                onClick={() => setSelectedVennArea(null)}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Clear filter
              </button>
            </div>
          )}
        </div>
        <div className="text-sm space-y-2 text-slate-300">
            {filteredSkills.map(({skill, relevance}, index) => (
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
            {filteredSkills.length === 0 && selectedVennArea && (
              <div className="text-center text-slate-500 py-8">
                <p>No skills found for this filter.</p>
                <button 
                  onClick={() => setSelectedVennArea(null)}
                  className="text-cyan-400 hover:text-cyan-300 text-sm mt-2"
                >
                  Show all skills
                </button>
              </div>
            )}
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
          <div className="flex flex-col items-center gap-2 mb-8">
            <h2 className="text-3xl font-bold text-slate-100 text-center">
              {stage === 'report' ? 'Talent Readiness Profile' : t('summary_final_input_title')}
            </h2>
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