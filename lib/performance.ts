// Performance monitoring utility
export const reportWebVitals = () => {
  // In production, send to analytics service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to Vercel Analytics or custom service
    // analytics.track('web_vitals', {
    //   name: metric.name,
    //   value: metric.value,
    //   id: metric.id,
    // });
  }
};

// Component performance hook
export const usePerformanceMonitor = () => {
  const startTime = performance.now();
  
  const endTime = () => {
    const duration = performance.now() - startTime;
    return duration;
  };
  
  return { endTime };
};

// API response time middleware
export const withTiming = <T extends (...args: unknown[]) => Promise<unknown>>(handler: T) => {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      const result = await handler(...args);
      return result as ReturnType<T>;
    } catch (error) {
      throw error;
    }
  };
};

// Memory usage monitor
export const getMemoryUsage = () => {
  if (typeof performance !== 'undefined' && 'memory' in performance) {
    const mem = (performance as { memory: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
    return {
      used: Math.round(mem.usedJSHeapSize / 1048576), // MB
      total: Math.round(mem.totalJSHeapSize / 1048576), // MB
      limit: Math.round(mem.jsHeapSizeLimit / 1048576), // MB
    };
  }
  return null;
};

// Lazy loading helper
export const lazyWithRetry = <T>(importFunc: () => Promise<T>, retries = 3): Promise<T> => {
  return new Promise((resolve, reject) => {
    importFunc()
      .then(resolve)
      .catch((error) => {
        if (retries > 0) {
          setTimeout(() => {
            lazyWithRetry(importFunc, retries - 1).then(resolve).catch(reject);
          }, 1000);
        } else {
          reject(error);
        }
      });
  });
};
