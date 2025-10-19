import React from 'react';
import { Step, AssessmentData } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface FooterProps {
  currentStep: Step;
  setCurrentStep: (step: Step) => void;
  assessmentData: AssessmentData;
}

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const SaveIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
);

const NextIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
);


const Footer: React.FC<FooterProps> = ({ currentStep, setCurrentStep, assessmentData }) => {
    const { t } = useLanguage();
    
    const isNextDisabled = () => {
        if (currentStep === Step.Business && assessmentData.businessSkills.some(s => s.rating === 0)) {
            return true;
        }
        if (currentStep === Step.Career && assessmentData.careerSkills.some(s => s.rating === 0)) {
            return true;
        }
        return false;
    };
    
    const handleNext = () => {
        switch (currentStep) {
            case Step.Intro:
                setCurrentStep(Step.Business);
                break;
            case Step.Business:
                setCurrentStep(Step.Career);
                break;
            case Step.Career:
                setCurrentStep(Step.Summary);
                break;
            case Step.Summary:
                // Final submission logic would go here
                alert("Assessment Submitted!");
                break;
        }
    }

  return (
    <footer className="flex items-center gap-4">
      <button className="p-3 bg-slate-700 rounded-full hover:bg-slate-600 transition-colors">
        <UserIcon />
      </button>
      <div className="flex-grow h-12 bg-slate-800 border border-slate-700 rounded-xl"></div>
      <div className="flex items-center gap-4">
        <button className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
            <SaveIcon />
            <span className="text-sm font-semibold">{t('footer_save')}</span>
        </button>
        {currentStep !== Step.Summary && (
             <button 
                onClick={handleNext} 
                disabled={isNextDisabled()}
                className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors disabled:text-slate-500 disabled:cursor-not-allowed"
             >
                <span className="text-sm font-semibold">{t('footer_next')}</span>
                <NextIcon />
            </button>
        )}
      </div>
    </footer>
  );
};

export default Footer;
