import React from 'react';

interface OptimizeButtonProps {
  onClick: () => void;
  disabled: boolean;
  isLoading: boolean;
  className?: string;
  hasContent?: boolean;
}

const OptimizeButton: React.FC<OptimizeButtonProps> = ({ 
  onClick, 
  disabled, 
  isLoading, 
  className = '',
  hasContent = true
}) => {
  const isDisabled = disabled || isLoading || !hasContent;

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`
        px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
        ${isLoading 
          ? 'bg-slate-700 text-slate-400 cursor-wait' 
          : isDisabled 
            ? 'bg-slate-600 text-slate-500 cursor-not-allowed' 
            : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 shadow-lg hover:shadow-xl'
        }
        ${className}
      `}
    >
      <div className="flex items-center gap-2">
        {isLoading ? (
          <>
            <span className="text-lg animate-robot-think">🤖</span>
            <span>Optimizing...</span>
          </>
        ) : (
          <>
            <span className="text-lg">✨</span>
            <span>Optimize with AItlas</span>
          </>
        )}
      </div>
    </button>
  );
};

export default OptimizeButton;
