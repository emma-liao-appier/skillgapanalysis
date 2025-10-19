import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  message = 'Loading...',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div 
      className={`flex flex-col items-center justify-center p-6 ${className}`}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div 
        className={`animate-spin rounded-full border-2 border-gray-300 border-t-primary-500 ${sizeClasses[size]}`}
        aria-hidden="true"
      />
      <p className="mt-3 text-sm text-gray-600 font-medium">
        {message}
      </p>
      <span className="sr-only">
        {message}. Please wait while the content loads.
      </span>
    </div>
  );
};

export default LoadingSpinner;
