import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const RatingExplanation: React.FC = () => {
  const { t } = useLanguage();
  const levels = [1, 2, 3, 4, 5];

  return (
    <div className="bg-slate-700/50 p-3 rounded-lg">
      <div className="flex justify-center gap-x-4 text-xs text-slate-400">
        {levels.map((level, index) => (
          <React.Fragment key={level}>
            <div className="text-center min-w-0 flex-shrink-0 max-w-[120px]">
              <div className="font-bold text-slate-300">{t(`rating_level_${level}`).split(':')[0]}</div>
              <div className="text-slate-400 leading-tight break-words">{t(`rating_level_${level}`).split(':')[1]}</div>
            </div>
            {index < levels.length - 1 && (
              <div className="w-px h-16 bg-slate-500/30 self-center"></div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default RatingExplanation;
