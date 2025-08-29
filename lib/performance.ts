// Performance monitoring utility
import { logger } from '@/lib/logger';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  context?: Record<string, unknown>;
}

interface PerformanceThreshold {
  name: string;
  threshold: number;
  unit: 'ms' | 'bytes' | 'count';
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private thresholds: PerformanceThreshold[] = [];
  private maxMetrics: number = 1000;

  constructor() {
    // Set up default thresholds
    this.setThreshold('api_response_time', 1000, 'ms');
    this.setThreshold('database_query_time', 100, 'ms');
    this.setThreshold('memory_usage', 100 * 1024 * 1024, 'bytes'); // 100MB
    this.setThreshold('cpu_usage', 80, 'count'); // 80%
  }

  // Set performance threshold
  setThreshold(name: string, threshold: number, unit: 'ms' | 'bytes' | 'count') {
    const existingIndex = this.thresholds.findIndex(t => t.name === name);
    if (existingIndex >= 0) {
      this.thresholds[existingIndex] = { name, threshold, unit };
    } else {
      this.thresholds.push({ name, threshold, unit });
    }
  }

  // Record a performance metric
  recordMetric(name: string, value: number, context?: Record<string, unknown>) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      context,
    };

    this.metrics.push(metric);

    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Check against thresholds
    this.checkThresholds(metric);
  }

  // Measure execution time of a function
  async measureExecutionTime<T>(
    name: string,
    fn: () => Promise<T>,
    context?: Record<string, unknown>
  ): Promise<T> {
    const startTime = performance.now();
    try {
      const result = await fn();
      const executionTime = performance.now() - startTime;
      this.recordMetric(name, executionTime, { ...context, success: true });
      return result;
    } catch (error) {
      const executionTime = performance.now() - startTime;
      this.recordMetric(name, executionTime, { ...context, success: false, error: (error as Error).message });
      throw error;
    }
  }

  // Get performance summary
  getPerformanceSummary(timeRange: number = 3600000): Record<string, unknown> { // Default 1 hour
    const summary: Record<string, unknown> = {};
    const uniqueNames = [...new Set(this.metrics.map(m => m.name))];

    for (const name of uniqueNames) {
      const metrics = this.metrics.filter(m => m.name === name && m.timestamp >= (Date.now() - timeRange));
      if (metrics.length > 0) {
        const values = metrics.map(m => m.value);
        summary[name] = {
          count: metrics.length,
          average: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          latest: values[values.length - 1],
        };
      }
    }

    return summary;
  }

  private checkThresholds(metric: PerformanceMetric) {
    const threshold = this.thresholds.find(t => t.name === metric.name);
    if (!threshold) return;

    if (metric.value > threshold.threshold) {
      logger.warn(`Performance threshold exceeded: ${metric.name}`, {
        value: metric.value,
        threshold: threshold.threshold,
        unit: threshold.unit,
        context: metric.context,
      });
    }
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();
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
