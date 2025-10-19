// Performance optimization utilities
export class PerformanceOptimizer {
  // Image optimization
  static optimizeImage(
    src: string,
    width?: number,
    height?: number,
    quality: number = 80
  ): string {
    // In production, use a proper image optimization service
    const params = new URLSearchParams();
    if (width) params.append('w', width.toString());
    if (height) params.append('h', height.toString());
    params.append('q', quality.toString());
    
    return `${src}?${params.toString()}`;
  }

  // Lazy loading utility
  static createLazyLoader(
    threshold: number = 0.1,
    rootMargin: string = '50px'
  ): IntersectionObserver {
    return new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const src = element.getAttribute('data-src');
            if (src) {
              element.setAttribute('src', src);
              element.removeAttribute('data-src');
            }
          }
        });
      },
      {
        threshold,
        rootMargin
      }
    );
  }

  // Debounce function
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  // Throttle function
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  // Preload critical resources
  static preloadResource(
    href: string,
    as: 'script' | 'style' | 'image' | 'font' | 'fetch',
    crossorigin?: boolean
  ): void {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    if (crossorigin) {
      link.crossOrigin = 'anonymous';
    }
    document.head.appendChild(link);
  }

  // Prefetch resources for next page
  static prefetchResource(href: string): void {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
  }

  // Bundle size analyzer
  static analyzeBundleSize(): void {
    if (process.env.NODE_ENV === 'development') {
      // This would integrate with webpack-bundle-analyzer in production
      console.log('Bundle size analysis would be available in production build');
    }
  }

  // Memory usage monitor
  static monitorMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      console.log('Memory usage:', {
        used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)} MB`,
        total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)} MB`,
        limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)} MB`
      });
    }
  }
}

// React performance hooks
export const usePerformanceOptimization = () => {
  const [isVisible, setIsVisible] = React.useState(false);
  const elementRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const observer = PerformanceOptimizer.createLazyLoader();
    if (elementRef.current) {
      observer.observe(elementRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const debouncedCallback = React.useCallback(
    PerformanceOptimizer.debounce((callback: () => void) => {
      callback();
    }, 300),
    []
  );

  const throttledCallback = React.useCallback(
    PerformanceOptimizer.throttle((callback: () => void) => {
      callback();
    }, 100),
    []
  );

  return {
    elementRef,
    isVisible,
    debouncedCallback,
    throttledCallback
  };
};

// Code splitting utilities
export const createAsyncComponent = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) => {
  return React.lazy(importFunc);
};

// Resource hints
export const ResourceHints: React.FC<{
  preload?: Array<{ href: string; as: string; crossorigin?: boolean }>;
  prefetch?: string[];
  preconnect?: string[];
}> = ({ preload = [], prefetch = [], preconnect = [] }) => {
  React.useEffect(() => {
    preload.forEach(({ href, as, crossorigin }) => {
      PerformanceOptimizer.preloadResource(href, as as any, crossorigin);
    });

    prefetch.forEach((href) => {
      PerformanceOptimizer.prefetchResource(href);
    });

    preconnect.forEach((href) => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = href;
      document.head.appendChild(link);
    });
  }, [preload, prefetch, preconnect]);

  return null;
};

// Performance budget checker
export class PerformanceBudget {
  private static budgets = {
    fcp: 1800, // First Contentful Paint
    lcp: 2500, // Largest Contentful Paint
    fid: 100,  // First Input Delay
    cls: 0.1,  // Cumulative Layout Shift
    ttfb: 600  // Time to First Byte
  };

  static checkBudget(metric: string, value: number): boolean {
    const budget = this.budgets[metric as keyof typeof this.budgets];
    if (!budget) return true;

    const passed = value <= budget;
    
    if (!passed && process.env.NODE_ENV === 'development') {
      console.warn(
        `Performance budget exceeded for ${metric}: ${value}ms > ${budget}ms`
      );
    }

    return passed;
  }

  static getAllBudgets(): typeof PerformanceBudget.budgets {
    return { ...this.budgets };
  }
}

export default PerformanceOptimizer;
