// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();
  private observers: PerformanceObserver[] = [];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Measure component render time
  measureRender(componentName: string, renderFn: () => void): void {
    const start = performance.now();
    renderFn();
    const end = performance.now();
    
    this.metrics.set(`${componentName}_render`, end - start);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} render time: ${(end - start).toFixed(2)}ms`);
    }
  }

  // Measure API call performance
  async measureApiCall<T>(
    apiName: string, 
    apiCall: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    
    try {
      const result = await apiCall();
      const end = performance.now();
      
      this.metrics.set(`${apiName}_api`, end - start);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`${apiName} API call time: ${(end - start).toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const end = performance.now();
      this.metrics.set(`${apiName}_api_error`, end - start);
      throw error;
    }
  }

  // Get performance metrics
  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  // Clear metrics
  clearMetrics(): void {
    this.metrics.clear();
  }

  // Monitor Core Web Vitals
  startWebVitalsMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.metrics.set('lcp', lastEntry.startTime);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('LCP:', lastEntry.startTime);
      }
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    this.observers.push(lcpObserver);

    // First Input Delay (FID)
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        this.metrics.set('fid', entry.processingStart - entry.startTime);
        
        if (process.env.NODE_ENV === 'development') {
          console.log('FID:', entry.processingStart - entry.startTime);
        }
      });
    });
    fidObserver.observe({ entryTypes: ['first-input'] });
    this.observers.push(fidObserver);

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      this.metrics.set('cls', clsValue);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('CLS:', clsValue);
      }
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });
    this.observers.push(clsObserver);
  }

  // Cleanup observers
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// React hook for performance monitoring
export const usePerformanceMonitor = (componentName: string) => {
  const monitor = PerformanceMonitor.getInstance();
  
  const measureRender = (renderFn: () => void) => {
    monitor.measureRender(componentName, renderFn);
  };

  const measureApiCall = async <T>(apiName: string, apiCall: () => Promise<T>): Promise<T> => {
    return monitor.measureApiCall(apiName, apiCall);
  };

  return { measureRender, measureApiCall };
};

// Performance budget checker
export class PerformanceBudget {
  private static budgets = {
    render: 16, // 60fps
    api: 1000, // 1 second
    lcp: 2500, // 2.5 seconds
    fid: 100, // 100ms
    cls: 0.1 // 0.1
  };

  static checkBudget(metric: string, value: number): boolean {
    const budget = this.budgets[metric as keyof typeof this.budgets];
    if (!budget) return true;
    
    const passed = value <= budget;
    
    if (!passed && process.env.NODE_ENV === 'development') {
      console.warn(`Performance budget exceeded for ${metric}: ${value}ms > ${budget}ms`);
    }
    
    return passed;
  }

  static getAllBudgets(): typeof PerformanceBudget.budgets {
    return { ...this.budgets };
  }
}

export default PerformanceMonitor;
