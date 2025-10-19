import React, { useState, useRef, useEffect } from 'react';
import { Step } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface HeaderProps {
  currentStep: Step;
  setCurrentStep: (step: Step) => void;
  isBusinessComplete: boolean;
  isCareerComplete: boolean;
  className?: string;
}

const stepKeys = [
  { id: Step.Language, key: 'header_language', icon: '🌐' },
  { id: Step.Intro, key: 'header_intro', icon: '👋' },
  { id: Step.Business, key: 'header_business', icon: '🏢' },
  { id: Step.Career, key: 'header_career', icon: '🚀' },
  { id: Step.Summary, key: 'header_summary', icon: '📊' },
];

const CheckIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    className="h-5 w-5" 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor" 
    strokeWidth={3}
    aria-hidden="true"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M5 13l4 4L19 7" 
    />
  </svg>
);

const Header: React.FC<HeaderProps> = ({ 
  currentStep, 
  setCurrentStep, 
  isBusinessComplete, 
  isCareerComplete,
  className = ''
}) => {
  const { t } = useLanguage();
  const [focusedStep, setFocusedStep] = useState<Step | null>(null);
  const stepRefs = useRef<(HTMLButtonElement | null)[]>([]);
  
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
  const progressPercentage = ((currentStepIndex + 1) / steps.length) * 100;

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent, stepId: Step, index: number) => {
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        const prevIndex = Math.max(0, index - 1);
        stepRefs.current[prevIndex]?.focus();
        break;
      case 'ArrowRight':
        event.preventDefault();
        const nextIndex = Math.min(steps.length - 1, index + 1);
        stepRefs.current[nextIndex]?.focus();
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!isStepLocked(stepId)) {
          setCurrentStep(stepId);
        }
        break;
    }
  };

  // Announce progress changes to screen readers
  useEffect(() => {
    const announcement = `Step ${currentStepIndex + 1} of ${steps.length}: ${steps[currentStepIndex]?.label}`;
    const liveRegion = document.getElementById('step-progress-announcement');
    if (liveRegion) {
      liveRegion.textContent = announcement;
    }
  }, [currentStepIndex, steps]);

  return (
    <>
      {/* Screen reader announcements */}
      <div 
        id="step-progress-announcement" 
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
      />
      
      <header className={`w-full px-4 ${className}`} role="banner">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold text-gray-900">
              Assessment Progress
            </h2>
            <span className="text-sm text-gray-600" aria-live="polite">
              {Math.round(progressPercentage)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-500 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
              role="progressbar"
              aria-valuenow={Math.round(progressPercentage)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Assessment progress: ${Math.round(progressPercentage)}% complete`}
            />
          </div>
        </div>

        {/* Step Navigation */}
        <nav 
          className="flex items-center justify-between"
          role="navigation"
          aria-label="Assessment steps"
        >
          {steps.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isLocked = isStepLocked(step.id);
            const canNavigate = !isLocked && (isCompleted || isCurrent);

            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  <button
                    ref={(el) => (stepRefs.current[index] = el)}
                    onClick={() => canNavigate && setCurrentStep(step.id)}
                    onKeyDown={(e) => handleKeyDown(e, step.id, index)}
                    onFocus={() => setFocusedStep(step.id)}
                    onBlur={() => setFocusedStep(null)}
                    disabled={isLocked}
                    className={`
                      flex items-center justify-center w-12 h-12 rounded-full border-2 
                      transition-all duration-300 ease-in-out touch-target focus-ring
                      ${isCurrent 
                        ? 'bg-primary-500 border-primary-400 scale-110 shadow-lg' 
                        : ''
                      }
                      ${isCompleted 
                        ? 'bg-primary-600 border-primary-500 text-white' 
                        : ''
                      }
                      ${!isCompleted && !isCurrent 
                        ? 'bg-gray-100 border-gray-300 text-gray-600 hover:border-primary-400 hover:bg-primary-50' 
                        : ''
                      }
                      ${isLocked 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'cursor-pointer hover:scale-105'
                      }
                      ${focusedStep === step.id ? 'ring-2 ring-primary-300 ring-offset-2' : ''}
                    `}
                    aria-label={
                      isLocked 
                        ? `${step.label} - ${t('header_tooltip_locked')}` 
                        : `${step.label} - ${t('header_tooltip_nav', { step: step.label })}`
                    }
                    aria-current={isCurrent ? 'step' : undefined}
                    aria-disabled={isLocked}
                    title={
                      isLocked 
                        ? t('header_tooltip_locked') 
                        : t('header_tooltip_nav', { step: step.label })
                    }
                  >
                    {isCompleted ? (
                      <CheckIcon />
                    ) : (
                      <span className="text-lg font-bold" aria-hidden="true">
                        {step.icon}
                      </span>
                    )}
                  </button>
                  
                  <span className={`
                    mt-2 text-sm font-semibold transition-colors text-center max-w-20
                    ${isCurrent ? 'text-primary-600' : 'text-gray-600'}
                    ${isLocked ? 'opacity-50' : ''}
                  `}>
                    {step.label}
                  </span>
                  
                  {/* Step number for screen readers */}
                  <span className="sr-only">
                    Step {index + 1} of {steps.length}
                    {isCompleted && ' - Completed'}
                    {isCurrent && ' - Current step'}
                    {isLocked && ' - Locked'}
                  </span>
                </div>
                
                {/* Connection line */}
                {index < steps.length - 1 && (
                  <div className={`
                    flex-1 h-1 mx-2 rounded transition-colors duration-300
                    ${isCompleted || isCurrent ? 'bg-primary-500' : 'bg-gray-300'}
                  `} />
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </header>
    </>
  );
};

export default Header;
