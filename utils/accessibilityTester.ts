// Accessibility testing utilities
import { axe, toHaveNoViolations } from 'jest-axe';
import { render } from '@testing-library/react';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

export class AccessibilityTester {
  // Test component for WCAG violations
  static async testComponent(component: React.ReactElement): Promise<void> {
    const { container } = render(component);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  }

  // Test keyboard navigation
  static testKeyboardNavigation(
    container: HTMLElement,
    expectedTabOrder: string[]
  ): void {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    expect(focusableElements.length).toBe(expectedTabOrder.length);

    focusableElements.forEach((element, index) => {
      expect(element).toHaveAttribute('tabindex');
      expect(element.getAttribute('aria-label') || element.textContent).toBe(
        expectedTabOrder[index]
      );
    });
  }

  // Test color contrast
  static testColorContrast(
    foregroundColor: string,
    backgroundColor: string,
    minRatio: number = 4.5
  ): void {
    const contrastRatio = this.calculateContrastRatio(
      foregroundColor,
      backgroundColor
    );
    expect(contrastRatio).toBeGreaterThanOrEqual(minRatio);
  }

  // Calculate contrast ratio
  private static calculateContrastRatio(
    color1: string,
    color2: string
  ): number {
    const getLuminance = (color: string): number => {
      const rgb = color.match(/\d+/g);
      if (!rgb) return 0;

      const [r, g, b] = rgb.map((c) => {
        const val = parseInt(c) / 255;
        return val <= 0.03928
          ? val / 12.92
          : Math.pow((val + 0.055) / 1.055, 2.4);
      });

      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);

    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);

    return (brightest + 0.05) / (darkest + 0.05);
  }

  // Test screen reader compatibility
  static testScreenReaderCompatibility(container: HTMLElement): void {
    // Check for proper heading hierarchy
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;

    headings.forEach((heading) => {
      const level = parseInt(heading.tagName.charAt(1));
      expect(level).toBeGreaterThanOrEqual(previousLevel);
      expect(level - previousLevel).toBeLessThanOrEqual(1);
      previousLevel = level;
    });

    // Check for proper form labels
    const inputs = container.querySelectorAll('input, select, textarea');
    inputs.forEach((input) => {
      const id = input.getAttribute('id');
      const ariaLabel = input.getAttribute('aria-label');
      const ariaLabelledBy = input.getAttribute('aria-labelledby');
      const label = container.querySelector(`label[for="${id}"]`);

      expect(
        ariaLabel || ariaLabelledBy || label
      ).toBeTruthy();
    });

    // Check for proper button labels
    const buttons = container.querySelectorAll('button');
    buttons.forEach((button) => {
      const ariaLabel = button.getAttribute('aria-label');
      const ariaLabelledBy = button.getAttribute('aria-labelledby');
      const textContent = button.textContent?.trim();

      expect(
        ariaLabel || ariaLabelledBy || textContent
      ).toBeTruthy();
    });
  }

  // Test focus management
  static testFocusManagement(container: HTMLElement): void {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    focusableElements.forEach((element) => {
      // Check if element can receive focus
      expect(element).not.toHaveAttribute('tabindex', '-1');
      
      // Check for focus indicators
      const style = window.getComputedStyle(element, ':focus');
      expect(style.outline).not.toBe('none');
    });
  }

  // Test ARIA attributes
  static testARIAAttributes(container: HTMLElement): void {
    // Check for proper ARIA roles
    const elementsWithRoles = container.querySelectorAll('[role]');
    elementsWithRoles.forEach((element) => {
      const role = element.getAttribute('role');
      expect(role).toBeTruthy();
      expect(role).toMatch(/^[a-z-]+$/);
    });

    // Check for proper ARIA states
    const elementsWithStates = container.querySelectorAll(
      '[aria-expanded], [aria-selected], [aria-checked], [aria-pressed]'
    );
    elementsWithStates.forEach((element) => {
      const state = element.getAttribute('aria-expanded') ||
                   element.getAttribute('aria-selected') ||
                   element.getAttribute('aria-checked') ||
                   element.getAttribute('aria-pressed');
      expect(state).toMatch(/^(true|false)$/);
    });

    // Check for proper ARIA properties
    const elementsWithProperties = container.querySelectorAll(
      '[aria-label], [aria-labelledby], [aria-describedby]'
    );
    elementsWithProperties.forEach((element) => {
      const label = element.getAttribute('aria-label');
      const labelledBy = element.getAttribute('aria-labelledby');
      const describedBy = element.getAttribute('aria-describedby');

      expect(
        label || labelledBy || describedBy
      ).toBeTruthy();
    });
  }
}

// WCAG 2.2 AA Compliance Checklist
export const WCAGComplianceChecklist = {
  // Perceivable
  perceivable: {
    colorContrast: 'Color contrast ratio ≥ 4.5:1 for normal text',
    colorContrastLarge: 'Color contrast ratio ≥ 3:1 for large text',
    alternativeText: 'Alternative text for all images',
    captions: 'Captions for multimedia content',
    adaptable: 'Content can be presented in different ways',
    distinguishable: 'Content is distinguishable from background'
  },

  // Operable
  operable: {
    keyboardAccessible: 'All functionality available via keyboard',
    noSeizure: 'No seizure-inducing content',
    navigable: 'Clear navigation and orientation',
    inputModalities: 'Multiple input modalities supported'
  },

  // Understandable
  understandable: {
    readable: 'Clear language and terminology',
    predictable: 'Consistent navigation patterns',
    inputAssistance: 'Error prevention and correction'
  },

  // Robust
  robust: {
    compatible: 'Compatible with assistive technologies',
    validMarkup: 'Valid HTML markup',
    futureProof: 'Future-proof code structure'
  }
};

export default AccessibilityTester;
