import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const RatingExplanation: React.FC = () => {
  const { t } = useLanguage();
  const levels = [1, 2, 3, 4, 5];

  return (
    <div className="bg-slate-700/50 p-4 rounded-lg">
      <h5 className="text-md font-semibold text-slate-200 text-center mb-3">{t('rating_explanation_title')}</h5>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-x-4 gap-y-2 text-xs text-slate-400">
        {levels.map(level => (
          <div key={level} className="text-center md:text-left">
            <p className="font-bold text-slate-300">{t(`rating_level_${level}`).split(':')[0]}:</p>
            <p>{t(`rating_level_${level}`).split(':')[1]}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RatingExplanation;
