import React, { useState, useRef, useEffect } from 'react';
import { Skill, SkillCategory } from '../types.ts';
import { useLanguage } from '../context/LanguageContext';

interface SkillRatingProps {
  skill: Skill;
  onRate: (skillId: string, rating: number) => void;
  onDelete: (skillId: string) => void;
  isReadOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const DeleteIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    className="h-5 w-5" 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor" 
    strokeWidth={2}
    aria-hidden="true"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M6 18L18 6M6 6l12 12" 
    />
  </svg>
);

const StarIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg 
    className="h-5 w-5" 
    fill={filled ? "currentColor" : "none"} 
    viewBox="0 0 24 24" 
    stroke="currentColor" 
    strokeWidth={2}
    aria-hidden="true"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" 
    />
  </svg>
);

const SkillRating: React.FC<SkillRatingProps> = ({ 
  skill, 
  onRate, 
  onDelete, 
  isReadOnly = false,
  size = 'md',
  className = ''
}) => {
  const { t } = useLanguage();
  const [focusedRating, setFocusedRating] = useState<number | null>(null);
  const ratingRefs = useRef<(HTMLButtonElement | null)[]>([]);
  
  const isFunctional = skill.category === SkillCategory.Functional;
  const categoryKey = `skill_category_${skill.category}`;
  
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-11 h-11 text-base',
    lg: 'w-12 h-12 text-lg'
  };
  
  const containerClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-5'
  };

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent, rating: number) => {
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        if (rating > 1) {
          const prevRating = rating - 1;
          ratingRefs.current[prevRating - 1]?.focus();
          onRate(skill.skillId, prevRating);
        }
        break;
      case 'ArrowRight':
        event.preventDefault();
        if (rating < 5) {
          const nextRating = rating + 1;
          ratingRefs.current[nextRating - 1]?.focus();
          onRate(skill.skillId, nextRating);
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        onRate(skill.skillId, rating);
        break;
    }
  };

  const getRatingDescription = (rating: number): string => {
    const descriptions = [
      t('rating_level_1'),
      t('rating_level_2'),
      t('rating_level_3'),
      t('rating_level_4'),
      t('rating_level_5')
    ];
    return descriptions[rating - 1] || '';
  };

  return (
    <li 
      className={`bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 ${containerClasses[size]} ${className}`}
      role="listitem"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            {t(categoryKey as any, skill.category)}
          </p>
          <h4 className={`font-semibold text-lg leading-tight ${
            isFunctional ? 'text-amber-600' : 'text-primary-600'
          }`}>
            {skill.name}
          </h4>
        </div>
        {!isReadOnly && (
          <button 
            onClick={() => onDelete(skill.skillId)} 
            className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50 focus-ring touch-target"
            aria-label={`Delete skill ${skill.name}`}
            title={`Delete ${skill.name}`}
          >
            <DeleteIcon />
          </button>
        )}
      </div>
      
      <p className="text-gray-600 text-sm mb-4 leading-relaxed">
        {skill.description}
      </p>
      
      <div className="space-y-2">
        <div 
          className="flex items-center justify-start gap-2"
          role="radiogroup"
          aria-labelledby={`skill-${skill.skillId}-rating-label`}
        >
          <span 
            id={`skill-${skill.skillId}-rating-label`}
            className="sr-only"
          >
            Rate {skill.name} from 1 to 5 stars
          </span>
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              ref={(el) => (ratingRefs.current[value - 1] = el)}
              onClick={() => !isReadOnly && onRate(skill.skillId, value)}
              onKeyDown={(e) => !isReadOnly && handleKeyDown(e, value)}
              onFocus={() => setFocusedRating(value)}
              onBlur={() => setFocusedRating(null)}
              disabled={isReadOnly}
              className={`
                ${sizeClasses[size]} 
                font-bold rounded-full border-2 transition-all duration-200 
                flex items-center justify-center touch-target focus-ring
                ${skill.rating >= value
                  ? 'bg-primary-500 border-primary-400 text-white shadow-md'
                  : 'bg-gray-100 border-gray-300 text-gray-600 hover:border-primary-400 hover:bg-primary-50'
                }
                ${focusedRating === value ? 'ring-2 ring-primary-300 ring-offset-2' : ''}
                ${isReadOnly ? 'cursor-default' : 'cursor-pointer'}
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
              aria-label={`Rate ${value} out of 5 stars`}
              aria-describedby={`skill-${skill.skillId}-rating-${value}-desc`}
              aria-pressed={skill.rating >= value}
              role="radio"
              aria-checked={skill.rating >= value}
            >
              {value}
            </button>
          ))}
        </div>
        
        {/* Rating description for screen readers */}
        <div className="sr-only" aria-live="polite">
          {skill.rating > 0 && (
            <span>
              Current rating: {skill.rating} out of 5. {getRatingDescription(skill.rating)}
            </span>
          )}
        </div>
        
        {/* Visual rating description */}
        {skill.rating > 0 && (
          <p className="text-sm text-gray-600">
            <span className="font-medium">Current rating:</span> {getRatingDescription(skill.rating)}
          </p>
        )}
      </div>
    </li>
  );
};

export default SkillRating;
