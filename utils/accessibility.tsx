// Accessibility utilities and helpers
import React from 'react';
export class AccessibilityHelper {
  // Generate unique IDs for form elements
  static generateId(prefix: string): string {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Announce messages to screen readers
  static announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  // Focus management
  static focusElement(element: HTMLElement | null): void {
    if (element) {
      element.focus();
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // Trap focus within a container
  static trapFocus(container: HTMLElement): () => void {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    
    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }

  // Check if element is visible to screen readers
  static isVisibleToScreenReader(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      element.getAttribute('aria-hidden') !== 'true' &&
      element.offsetWidth > 0 &&
      element.offsetHeight > 0
    );
  }

  // Validate color contrast ratio
  static getContrastRatio(color1: string, color2: string): number {
    const getLuminance = (color: string): number => {
      const rgb = color.match(/\d+/g);
      if (!rgb) return 0;
      
      const [r, g, b] = rgb.map(c => {
        const val = parseInt(c) / 255;
        return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
      });
      
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);
    
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  }

  // Check if color combination meets WCAG AA standards
  static meetsWCAGAA(foreground: string, background: string): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    return ratio >= 4.5; // WCAG AA standard for normal text
  }

  // Generate accessible color palette
  static generateAccessiblePalette(baseColor: string): Record<string, string> {
    // This is a simplified version - in production, use a proper color library
    return {
      '50': '#f8fafc',
      '100': '#f1f5f9',
      '200': '#e2e8f0',
      '300': '#cbd5e1',
      '400': '#94a3b8',
      '500': baseColor,
      '600': '#475569',
      '700': '#334155',
      '800': '#1e293b',
      '900': '#0f172a'
    };
  }
}

// React hook for accessibility
export const useAccessibility = () => {
  const announce = (message: string, priority?: 'polite' | 'assertive') => {
    AccessibilityHelper.announce(message, priority);
  };

  const focusElement = (element: HTMLElement | null) => {
    AccessibilityHelper.focusElement(element);
  };

  const generateId = (prefix: string) => {
    return AccessibilityHelper.generateId(prefix);
  };

  return { announce, focusElement, generateId };
};

// ARIA live region component
export const LiveRegion: React.FC<{
  message: string;
  priority?: 'polite' | 'assertive';
  className?: string;
}> = ({ message, priority = 'polite', className = '' }) => {
  return (
    <div
      className={`sr-only ${className}`}
      aria-live={priority}
      aria-atomic="true"
      role="status"
    >
      {message}
    </div>
  );
};

// Skip link component
export const SkipLink: React.FC<{
  href: string;
  children: React.ReactNode;
  className?: string;
}> = ({ href, children, className = '' }) => {
  return (
    <a
      href={href}
      className={`skip-link ${className}`}
      onFocus={(e) => {
        e.currentTarget.style.top = '6px';
      }}
      onBlur={(e) => {
        e.currentTarget.style.top = '-40px';
      }}
    >
      {children}
    </a>
  );
};

// Focus trap component
export const FocusTrap: React.FC<{
  children: React.ReactNode;
  active: boolean;
  className?: string;
}> = ({ children, active, className = '' }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (active && containerRef.current) {
      const cleanup = AccessibilityHelper.trapFocus(containerRef.current);
      return cleanup;
    }
  }, [active]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
};

export default AccessibilityHelper;
