import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SkillRatingEnhanced from './components/SkillRatingEnhanced';
import HeaderEnhanced from './components/HeaderEnhanced';
import LoadingSpinnerEnhanced from './components/LoadingSpinnerEnhanced';
import FormField from './components/FormField';
import ErrorBoundary from './components/ErrorBoundary';
import { Step } from './types';

// Mock the language context
jest.mock('./context/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string, fallback?: string) => fallback || key
  })
}));

describe('Enhanced Components', () => {
  describe('SkillRatingEnhanced', () => {
    const mockSkill = {
      skillId: '1',
      name: 'JavaScript Programming',
      description: 'Advanced JavaScript development',
      rating: 3,
      category: 'functional' as any,
      tag: 'biz'
    };

    it('renders skill information correctly', () => {
      render(
        <SkillRatingEnhanced
          skill={mockSkill}
          onRate={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      expect(screen.getByText('JavaScript Programming')).toBeInTheDocument();
      expect(screen.getByText('Advanced JavaScript development')).toBeInTheDocument();
    });

    it('handles keyboard navigation', () => {
      const mockOnRate = jest.fn();
      render(
        <SkillRatingEnhanced
          skill={mockSkill}
          onRate={mockOnRate}
          onDelete={jest.fn()}
        />
      );

      const ratingButton = screen.getByLabelText('Rate 3 out of 5 stars');
      fireEvent.keyDown(ratingButton, { key: 'ArrowRight' });
      
      expect(mockOnRate).toHaveBeenCalledWith('1', 4);
    });

    it('has proper accessibility attributes', () => {
      render(
        <SkillRatingEnhanced
          skill={mockSkill}
          onRate={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      const ratingGroup = screen.getByRole('radiogroup');
      expect(ratingGroup).toHaveAttribute('aria-labelledby');
    });
  });

  describe('HeaderEnhanced', () => {
    it('shows progress percentage', () => {
      render(
        <HeaderEnhanced
          currentStep={Step.Business}
          setCurrentStep={jest.fn()}
          isBusinessComplete={false}
          isCareerComplete={false}
        />
      );

      expect(screen.getByText(/60% Complete/)).toBeInTheDocument();
    });

    it('disables locked steps', () => {
      render(
        <HeaderEnhanced
          currentStep={Step.Business}
          setCurrentStep={jest.fn()}
          isBusinessComplete={false}
          isCareerComplete={false}
        />
      );

      const careerStep = screen.getByLabelText(/Career.*locked/);
      expect(careerStep).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('LoadingSpinnerEnhanced', () => {
    it('shows loading message', () => {
      render(<LoadingSpinnerEnhanced message="Loading skills..." />);
      
      expect(screen.getByText('Loading skills...')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('has proper accessibility attributes', () => {
      render(<LoadingSpinnerEnhanced message="Loading..." />);
      
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('aria-live', 'polite');
      expect(spinner).toHaveAttribute('aria-label', 'Loading...');
    });
  });

  describe('FormField', () => {
    it('shows validation errors', async () => {
      render(
        <FormField
          id="test-field"
          label="Test Field"
          value=""
          onChange={jest.fn()}
          error="This field is required"
          required
        />
      );

      const input = screen.getByRole('textbox');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByText('This field is required')).toBeInTheDocument();
      });
    });

    it('shows character count when maxLength is provided', () => {
      render(
        <FormField
          id="test-field"
          label="Test Field"
          value="Hello"
          onChange={jest.fn()}
          maxLength={100}
        />
      );

      expect(screen.getByText('5/100')).toBeInTheDocument();
    });
  });

  describe('ErrorBoundary', () => {
    const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div>No error</div>;
    };

    it('catches errors and shows fallback UI', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('renders children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });
  });
});
