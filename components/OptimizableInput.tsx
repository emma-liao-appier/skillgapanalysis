import React from 'react';
import OptimizeButton from './OptimizeButton';

interface OptimizableInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
  rows?: number;
  onOptimize?: () => void;
  isOptimizing?: boolean;
  className?: string;
  labelClassName?: string;
}

const OptimizableInput: React.FC<OptimizableInputProps> = ({
  id,
  value,
  onChange,
  placeholder,
  label,
  rows = 4,
  onOptimize,
  isOptimizing = false,
  className = '',
  labelClassName = ''
}) => {
  const hasContent = value.trim().length > 0;
  const showOptimizeButton = onOptimize && hasContent;

  return (
    <div className={`w-full max-w-lg ${className}`}>
      <label htmlFor={id} className={`text-slate-300 mb-2 block ${labelClassName}`}>
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
      />
      {showOptimizeButton && (
        <div className="mt-3 flex justify-center">
          <OptimizeButton
            onClick={onOptimize!}
            disabled={false}
            isLoading={isOptimizing}
            className="text-sm px-6 py-2"
          />
        </div>
      )}
    </div>
  );
};

export default OptimizableInput;
