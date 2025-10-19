import React from 'react';
import { Skill, SkillCategory } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface SkillRatingProps {
  skill: Skill;
  onRate: (skillId: string, rating: number) => void;
  onDelete: (skillId: string) => void;
}

const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
)

const SkillRating: React.FC<SkillRatingProps> = ({ skill, onRate, onDelete }) => {
  const { t } = useLanguage();
  const isFunctional = skill.category === SkillCategory.Functional;
  const categoryKey = `skill_category_${skill.category}`;

  return (
    <li className="bg-slate-700/50 p-4 rounded-lg transition-shadow hover:shadow-xl">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            {t(categoryKey as any, skill.category)}
          </p>
          <h4 className={`font-semibold mt-1 text-lg ${
              isFunctional ? 'text-amber-400' : 'text-cyan-400'
            }`}
          >
            {skill.name}
          </h4>
        </div>
        <button 
            onClick={() => onDelete(skill.id)} 
            className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded-full -mr-1 -mt-1"
            aria-label={`Delete skill ${skill.name}`}
        >
            <DeleteIcon />
        </button>
      </div>
      <p className="text-slate-300 text-sm mt-2 pr-4">{skill.description}</p>
      <div className="flex items-center justify-start gap-2 mt-4">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            onClick={() => onRate(skill.id, value)}
            className={`w-9 h-9 text-sm font-bold rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
              skill.rating >= value
                ? 'bg-cyan-500 border-cyan-400 text-white'
                : 'bg-slate-600/50 border-slate-500 text-slate-400 hover:border-cyan-400'
            }`}
            aria-label={`Rate ${value} out of 5`}
          >
            {value}
          </button>
        ))}
      </div>
    </li>
  );
};

export default SkillRating;