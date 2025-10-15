import React from 'react';
import { useLanguage } from '../context/LanguageContext';

interface StepIntroProps {
  onNext: () => void;
}

const StepIntro: React.FC<StepIntroProps> = ({ onNext }) => {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col justify-center items-center h-full text-center">
      <h2 className="text-3xl font-bold text-slate-100">{t('intro_title')}</h2>
      <p className="mt-4 max-w-2xl text-slate-400">
        {t('intro_subtitle1')}
      </p>
      <p className="mt-2 max-w-2xl text-slate-400">
        {t('intro_subtitle2')}
      </p>
      <button
        onClick={onNext}
        className="mt-8 px-8 py-3 bg-cyan-500 text-white font-semibold rounded-full hover:bg-cyan-600 transition-colors shadow-lg shadow-cyan-500/20"
      >
        {t('intro_start_button')}
      </button>
    </div>
  );
};

export default StepIntro;
