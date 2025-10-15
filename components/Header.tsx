import React from 'react';
import { Step } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface HeaderProps {
  currentStep: Step;
  setCurrentStep: (step: Step) => void;
  isBusinessComplete: boolean;
  isCareerComplete: boolean;
}

const stepKeys = [
  { id: Step.Language, key: 'header_language' },
  { id: Step.Intro, key: 'header_intro' },
  { id: Step.Business, key: 'header_business' },
  { id: Step.Career, key: 'header_career' },
  { id: Step.Summary, key: 'header_summary' },
];

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
)

const Header: React.FC<HeaderProps> = ({ currentStep, setCurrentStep, isBusinessComplete, isCareerComplete }) => {
  const { t } = useLanguage();
  
  const steps = stepKeys.map(step => ({ ...step, label: t(step.key)}));

  const isStepLocked = (stepId: Step): boolean => {
    if (stepId === Step.Career) {
      return !isBusinessComplete;
    }
    if (stepId === Step.Summary) {
      return !isBusinessComplete || !isCareerComplete;
    }
    return false;
  };
  
  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <header className="w-full px-4">
      <nav className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isLocked = isStepLocked(step.id);
          
          const canNavigate = !isLocked && (isCompleted || isCurrent);

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <button
                  onClick={() => canNavigate && setCurrentStep(step.id)}
                  disabled={isLocked}
                  className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ease-in-out
                    ${isCurrent ? 'bg-cyan-500 border-cyan-400 scale-110' : ''}
                    ${isCompleted ? 'bg-cyan-600 border-cyan-500' : ''}
                    ${!isCompleted && !isCurrent ? 'bg-slate-700 border-slate-600' : ''}
                    ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                  title={isLocked ? t('header_tooltip_locked') : t('header_tooltip_nav', { step: step.label })}
                >
                  {isCompleted ? <CheckIcon /> : <span className="text-xl font-bold">{index + 1}</span>}
                </button>
                <span className={`mt-2 text-sm font-semibold transition-colors ${isCurrent ? 'text-cyan-400' : 'text-slate-400'}`}>
                    {step.label}
                </span>
              </div>
              
              {index < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-2 rounded
                    ${isCompleted || isCurrent ? 'bg-cyan-500' : 'bg-slate-700'}
                `}></div>
              )}
            </React.Fragment>
          );
        })}
      </nav>
    </header>
  );
};

export default Header;