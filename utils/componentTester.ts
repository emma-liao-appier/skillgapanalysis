// Comprehensive testing utilities
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

export class ComponentTester {
  // Test component rendering
  static testRendering(component: React.ReactElement): void {
    render(component);
    expect(screen.getByRole('main')).toBeInTheDocument();
  }

  // Test user interactions
  static async testUserInteractions(
    component: React.ReactElement,
    interactions: Array<{
      action: 'click' | 'type' | 'keyboard';
      target: string;
      value?: string;
      key?: string;
    }>
  ): Promise<void> {
    const user = userEvent.setup();
    render(component);

    for (const interaction of interactions) {
      const element = screen.getByRole(interaction.target);
      
      switch (interaction.action) {
        case 'click':
          await user.click(element);
          break;
        case 'type':
          await user.type(element, interaction.value || '');
          break;
        case 'keyboard':
          await user.keyboard(interaction.key || '');
          break;
      }
    }
  }

  // Test accessibility
  static async testAccessibility(component: React.ReactElement): Promise<void> {
    const { container } = render(component);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  }

  // Test keyboard navigation
  static testKeyboardNavigation(
    component: React.ReactElement,
    expectedTabOrder: string[]
  ): void {
    render(component);
    
    const focusableElements = screen.getAllByRole('button', { hidden: true })
      .concat(screen.getAllByRole('textbox', { hidden: true }))
      .concat(screen.getAllByRole('link', { hidden: true }));

    expect(focusableElements.length).toBe(expectedTabOrder.length);

    focusableElements.forEach((element, index) => {
      expect(element).toHaveAttribute('tabindex');
      expect(element.getAttribute('aria-label') || element.textContent).toBe(
        expectedTabOrder[index]
      );
    });
  }

  // Test responsive design
  static testResponsiveDesign(
    component: React.ReactElement,
    breakpoints: Array<{ width: number; height: number }>
  ): void {
    breakpoints.forEach(({ width, height }) => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: width,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: height,
      });

      render(component);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  }

  // Test error handling
  static testErrorHandling(
    component: React.ReactElement,
    errorScenario: () => void
  ): void {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(component);
    errorScenario();
    
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  }
}

// Visual regression testing utilities
export class VisualRegressionTester {
  // Take screenshot for comparison
  static async takeScreenshot(element: HTMLElement): Promise<string> {
    // This would integrate with a visual testing service like Percy or Chromatic
    return 'screenshot-data';
  }

  // Compare screenshots
  static async compareScreenshots(
    baseline: string,
    current: string
  ): Promise<boolean> {
    // This would integrate with a visual testing service
    return baseline === current;
  }
}

// Performance testing utilities
export class PerformanceTester {
  // Test component render time
  static testRenderTime(
    component: React.ReactElement,
    maxRenderTime: number = 16
  ): void {
    const start = performance.now();
    render(component);
    const end = performance.now();
    
    const renderTime = end - start;
    expect(renderTime).toBeLessThan(maxRenderTime);
  }

  // Test memory usage
  static testMemoryUsage(
    component: React.ReactElement,
    maxMemoryUsage: number = 50
  ): void {
    const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    render(component);
    
    const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
    const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB
    
    expect(memoryIncrease).toBeLessThan(maxMemoryUsage);
  }
}

// Integration testing utilities
export class IntegrationTester {
  // Test API integration
  static async testAPIIntegration(
    component: React.ReactElement,
    apiMock: jest.Mock
  ): Promise<void> {
    render(component);
    
    await waitFor(() => {
      expect(apiMock).toHaveBeenCalled();
    });
  }

  // Test state management
  static testStateManagement(
    component: React.ReactElement,
    stateChanges: Array<{
      action: () => void;
      expectedState: any;
    }>
  ): void {
    render(component);
    
    stateChanges.forEach(({ action, expectedState }) => {
      action();
      expect(screen.getByText(expectedState)).toBeInTheDocument();
    });
  }
}

// Test data generators
export class TestDataGenerator {
  // Generate mock user data
  static generateMockUser(): any {
    return {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'Software Engineer',
      department: 'Engineering',
      division: 'Product',
      location: 'San Francisco',
      jobLevel: 'Senior',
      careerLadder: 'Individual Contributor',
      lineManager: 'John Doe',
      functionalLead: 'Jane Smith'
    };
  }

  // Generate mock assessment data
  static generateMockAssessmentData(): any {
    return {
      period: '2025Q4',
      status: 'draft',
      language: 'English',
      role: 'Senior Software Engineer',
      businessGoal: 'Test business goal',
      keyResults: 'Test key results',
      businessSkills: [
        {
          skillId: '1',
          name: 'JavaScript Programming',
          description: 'Advanced JavaScript development',
          rating: 3,
          category: 'functional',
          tag: 'biz'
        }
      ],
      businessFeedbackSupport: 'Test support feedback',
      businessFeedbackObstacles: 'Test obstacles feedback',
      careerGoal: 'Test career goal',
      careerSkills: [
        {
          skillId: '2',
          name: 'Technical Leadership',
          description: 'Leading technical teams',
          rating: 2,
          category: 'leadership',
          tag: 'career'
        }
      ],
      nextSteps: [],
      nextStepsOther: '',
      finalThoughts: '',
      readinessBusiness: 0.75,
      readinessCareer: 0.68,
      alignmentScore: 0.8,
      talentType: 'Emerging Talent',
      focusAreas: ['leadership', 'communication'],
      categoryAverages: {
        leadership: { avg: 2.5, gap: 'high' },
        communication: { avg: 4.0, gap: 'low' }
      }
    };
  }

  // Generate mock skills data
  static generateMockSkills(): any[] {
    return [
      {
        skillId: '1',
        name: 'JavaScript Programming',
        description: 'Advanced JavaScript development',
        rating: 3,
        category: 'functional',
        tag: 'biz'
      },
      {
        skillId: '2',
        name: 'Project Management',
        description: 'Leading technical projects',
        rating: 2,
        category: 'leadership',
        tag: 'biz'
      },
      {
        skillId: '3',
        name: 'Code Review',
        description: 'Reviewing and improving code quality',
        rating: 4,
        category: 'communication',
        tag: 'biz'
      }
    ];
  }
}

export default ComponentTester;
