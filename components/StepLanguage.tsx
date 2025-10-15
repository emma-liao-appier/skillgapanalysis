import React from 'react';
import { LanguageCode } from '../types';
import { languages } from '../lib/translations';
import { useLanguage } from '../context/LanguageContext';

interface StepLanguageProps {
  selectedLanguage: LanguageCode;
  onLanguageChange: (language: LanguageCode) => void;
  onNext: () => void;
}

const StepLanguage: React.FC<StepLanguageProps> = ({ selectedLanguage, onLanguageChange, onNext }) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col justify-center items-center h-full text-center">
      <h2 className="text-3xl font-bold text-slate-100">{t('language_title')}</h2>
      <p className="mt-4 max-w-2xl text-slate-400">
        {t('language_subtitle')}
      </p>
      <div className="mt-8 w-full max-w-xs">
        <select
          value={selectedLanguage}
          onChange={(e) => onLanguageChange(e.target.value as LanguageCode)}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          aria-label={t('language_aria_label')}
        >
          {languages.map(lang => (
            <option key={lang.code} value={lang.code}>{lang.name}</option>
          ))}
        </select>
      </div>
      <button
        onClick={onNext}
        className="mt-8 px-8 py-3 bg-cyan-500 text-white font-semibold rounded-full hover:bg-cyan-600 transition-colors shadow-lg shadow-cyan-500/20"
      >
        {t('common_continue')}
      </button>
    </div>
  );
};

export default StepLanguage;
