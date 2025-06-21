// Frontend Performance Monitoring Utility
import React from 'react';

interface PerformanceMetric {
  name: string;
  startTime: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface APICallMetric {
  url: string;
  method: string;
  duration: number;
  status: number;
  size?: number;
  timestamp: number;
}

interface WebVitalsMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

class FrontendPerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private apiCalls: APICallMetric[] = [];
  private renderTimes: Map<string, number> = new Map();
  private userInteractions: Array<{ action: string; timestamp: number }> = [];
  private webVitals: WebVitalsMetric[] = [];
  private isMonitoring: boolean = false;
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeWebVitalsTracking();
  }

  // Initialize Web Vitals tracking
  private initializeWebVitalsTracking() {
    // Largest Contentful Paint (LCP)
    this.observePerformanceEntry('largest-contentful-paint', (entries) => {
      const lastEntry = entries[entries.length - 1];
      this.recordWebVital('LCP', lastEntry.startTime);
    });

    // First Input Delay (FID)
    this.observePerformanceEntry('first-input', (entries) => {
      const entry = entries[0] as any;
      const fid = entry.processingStart - entry.startTime;
      this.recordWebVital('FID', fid);
    });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    this.observePerformanceEntry('layout-shift', (entries) => {
      for (const entry of entries) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      this.recordWebVital('CLS', clsValue);
    });

    // First Contentful Paint (FCP)
    this.observePerformanceEntry('paint', (entries) => {
      const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        this.recordWebVital('FCP', fcpEntry.startTime);
      }
    });

    // Time to First Byte (TTFB)
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigationEntry) {
      const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
      this.recordWebVital('TTFB', ttfb);
    }
  }

  private observePerformanceEntry(entryType: string, callback: (entries: PerformanceEntry[]) => void) {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      observer.observe({ entryTypes: [entryType] });
      this.observers.push(observer);
    } catch (error) {
      console.warn(`Failed to observe ${entryType}:`, error);
    }
  }

  private recordWebVital(name: WebVitalsMetric['name'], value: number) {
    const rating = this.getWebVitalRating(name, value);
    const metric: WebVitalsMetric = {
      name,
      value,
      rating,
      timestamp: Date.now()
    };
    
    this.webVitals.push(metric);
    
    // Log poor performance
    if (rating === 'poor') {
      console.warn(`🚨 Poor ${name}: ${value.toFixed(2)}ms`);
    }
    
    // Keep only last 10 measurements per metric
    const filteredVitals = this.webVitals.filter(v => v.name === name).slice(-10);
    this.webVitals = this.webVitals.filter(v => v.name !== name).concat(filteredVitals);
  }

  private getWebVitalRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = {
      CLS: { good: 0.1, poor: 0.25 },
      FID: { good: 100, poor: 300 },
      FCP: { good: 1800, poor: 3000 },
      LCP: { good: 2500, poor: 4000 },
      TTFB: { good: 800, poor: 1800 }
    };

    const threshold = thresholds[name as keyof typeof thresholds];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  // Track API call performance with detailed metrics
  trackAPICall(url: string, method: string): {
    end: (response: Response) => void;
  } {
    const startTime = performance.now();
    
    return {
      end: (response: Response) => {
        const duration = performance.now() - startTime;
        
        const metric: APICallMetric = {
          url,
          method,
          duration,
          status: response.status,
          size: this.getResponseSize(response),
          timestamp: Date.now()
        };
        
        this.apiCalls.push(metric);

        // Log slow API calls with more detail
        if (duration > 2000) {
          console.warn(`🐌 Slow API call detected:`, {
            url: `${method} ${url}`,
            duration: `${Math.round(duration)}ms`,
            status: response.status,
            size: metric.size ? `${Math.round(metric.size / 1024)}KB` : 'unknown'
          });
        }

        // Keep only last 100 API calls
        if (this.apiCalls.length > 100) {
          this.apiCalls.shift();
        }
      }
    };
  }

  // Track component render performance with React integration
  trackComponentRender(componentName: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.renderTimes.set(componentName, duration);
      
      if (duration > 100) {
        console.warn(`🐌 Slow component render: ${componentName} took ${Math.round(duration)}ms`);
      }

      // Track render frequency
      this.trackUserInteraction(`render:${componentName}`);
    };
  }

  // Enhanced user interaction tracking
  trackUserInteraction(action: string, metadata?: Record<string, any>) {
    this.userInteractions.push({
      action,
      timestamp: Date.now()
    });

    // Keep only last 50 interactions
    if (this.userInteractions.length > 50) {
      this.userInteractions.shift();
    }

    // Detect interaction patterns
    this.analyzeInteractionPatterns();
  }

  private analyzeInteractionPatterns() {
    const recentInteractions = this.userInteractions.filter(
      interaction => Date.now() - interaction.timestamp < 10000 // Last 10 seconds
    );

    // Detect rapid clicking (potential performance issue)
    const clickActions = recentInteractions.filter(i => i.action.includes('click'));
    if (clickActions.length > 10) {
      console.warn('🚨 Rapid clicking detected - possible UI responsiveness issue');
    }

    // Detect render thrashing
    const renderActions = recentInteractions.filter(i => i.action.includes('render'));
    if (renderActions.length > 20) {
      console.warn('🚨 Excessive re-renders detected - check component optimization');
    }
  }

  // Track custom metrics with automatic categorization
  startMetric(name: string, metadata?: Record<string, any>): () => void {
    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata
    };

    return () => {
      metric.duration = performance.now() - metric.startTime;
      this.metrics.push(metric);

      // Auto-categorize and warn on slow operations
      if (metric.duration > 1000) {
        console.warn(`🐌 Slow operation: ${name} took ${Math.round(metric.duration)}ms`);
      }

      // Keep only last 200 metrics
      if (this.metrics.length > 200) {
        this.metrics.shift();
      }
    };
  }

  // Real-time performance monitoring
  startRealTimeMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    const monitoringInterval = setInterval(() => {
      const report = this.getPerformanceReport();
      
      // Check for performance issues
      if (report.recommendations.some(r => r.priority === 'high')) {
        console.warn('⚠️ High priority performance issues detected:', 
          report.recommendations.filter(r => r.priority === 'high')
        );
      }

      // Monitor memory usage
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
        
        if (usedMB > 100) {
          console.warn(`🧠 High memory usage: ${usedMB}MB`);
        }
      }
    }, 30000); // Every 30 seconds

    // Stop monitoring after 10 minutes to prevent memory leaks
    setTimeout(() => {
      clearInterval(monitoringInterval);
      this.isMonitoring = false;
    }, 600000);
  }

  // Enhanced performance report with actionable insights
  getPerformanceReport() {
    const slowAPIs = this.apiCalls.filter(call => call.duration > 1000);
    const slowComponents = Array.from(this.renderTimes.entries())
      .filter(([_, duration]) => duration > 50);

    const apiStats = this.calculateAPIStats();
    const webVitalsStats = this.calculateWebVitalsStats();

    return {
      timestamp: new Date().toISOString(),
      webVitals: webVitalsStats,
      apiCalls: {
        total: this.apiCalls.length,
        slow: slowAPIs.length,
        averageTime: apiStats.averageTime,
        errorRate: apiStats.errorRate,
        slowest: slowAPIs.sort((a, b) => b.duration - a.duration).slice(0, 5)
      },
      components: {
        total: this.renderTimes.size,
        slow: slowComponents.length,
        slowest: slowComponents.sort(([,a], [,b]) => b - a).slice(0, 5)
      },
      userInteractions: {
        total: this.userInteractions.length,
        recent: this.userInteractions.slice(-10),
        patterns: this.getInteractionPatterns()
      },
      recommendations: this.generateDetailedRecommendations(),
      score: this.calculatePerformanceScore()
    };
  }

  private calculateAPIStats() {
    if (this.apiCalls.length === 0) {
      return { averageTime: 0, errorRate: 0 };
    }

    const totalTime = this.apiCalls.reduce((sum, call) => sum + call.duration, 0);
    const errorCount = this.apiCalls.filter(call => call.status >= 400).length;

    return {
      averageTime: totalTime / this.apiCalls.length,
      errorRate: (errorCount / this.apiCalls.length) * 100
    };
  }

  private calculateWebVitalsStats() {
    const vitalsMap = new Map<string, WebVitalsMetric[]>();
    
    this.webVitals.forEach(vital => {
      if (!vitalsMap.has(vital.name)) {
        vitalsMap.set(vital.name, []);
      }
      vitalsMap.get(vital.name)!.push(vital);
    });

    const stats: Record<string, any> = {};
    vitalsMap.forEach((vitals, name) => {
      const latest = vitals[vitals.length - 1];
      stats[name] = {
        value: latest?.value || 0,
        rating: latest?.rating || 'good',
        trend: this.calculateTrend(vitals.map(v => v.value))
      };
    });

    return stats;
  }

  private calculateTrend(values: number[]): 'improving' | 'stable' | 'degrading' {
    if (values.length < 3) return 'stable';
    
    const recent = values.slice(-3);
    const older = values.slice(-6, -3);
    
    if (older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    const change = (recentAvg - olderAvg) / olderAvg;
    
    if (change < -0.1) return 'improving';
    if (change > 0.1) return 'degrading';
    return 'stable';
  }

  private getInteractionPatterns() {
    const actions = this.userInteractions.map(i => i.action);
    const actionCounts = actions.reduce((acc, action) => {
      acc[action] = (acc[action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(actionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
  }

  // Generate detailed, actionable recommendations
  private generateDetailedRecommendations() {
    const recommendations = [];

    // API performance recommendations
    const slowAPIs = this.apiCalls.filter(call => call.duration > 2000);
    if (slowAPIs.length > 0) {
      const uniqueEndpoints = [...new Set(slowAPIs.map(call => call.url))];
      recommendations.push({
        type: 'slow_api',
        message: `${uniqueEndpoints.length} API endpoint(s) are consistently slow`,
        priority: 'high',
        action: 'Consider implementing caching, pagination, or backend optimization',
        endpoints: uniqueEndpoints.slice(0, 3)
      });
    }

    // Component render recommendations
    const slowComponents = Array.from(this.renderTimes.entries())
      .filter(([_, duration]) => duration > 100);
    if (slowComponents.length > 0) {
      recommendations.push({
        type: 'slow_render',
        message: `${slowComponents.length} component(s) have slow render times`,
        priority: 'medium',
        action: 'Consider memoization, virtualization, or component splitting',
        components: slowComponents.slice(0, 3).map(([name]) => name)
      });
    }

    // Web Vitals recommendations
    const poorVitals = this.webVitals.filter(vital => vital.rating === 'poor');
    if (poorVitals.length > 0) {
      const vitalTypes = [...new Set(poorVitals.map(v => v.name))];
      recommendations.push({
        type: 'poor_web_vitals',
        message: `Poor Web Vitals detected: ${vitalTypes.join(', ')}`,
        priority: 'high',
        action: 'Optimize images, reduce layout shifts, minimize JavaScript execution time',
        vitals: vitalTypes
      });
    }

    // Memory usage recommendations
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
      
      if (usedMB > 50) {
        recommendations.push({
          type: 'high_memory',
          message: `High memory usage detected: ${usedMB}MB`,
          priority: usedMB > 100 ? 'high' : 'medium',
          action: 'Check for memory leaks, optimize data structures, implement cleanup'
        });
      }
    }

    // Interaction pattern recommendations
    const recentInteractions = this.userInteractions.filter(
      interaction => Date.now() - interaction.timestamp < 10000
    );
    if (recentInteractions.length > 30) {
      recommendations.push({
        type: 'high_interaction_frequency',
        message: 'High interaction frequency detected',
        priority: 'medium',
        action: 'Consider debouncing, throttling, or optimistic updates'
      });
    }

    return recommendations;
  }

  private calculatePerformanceScore(): number {
    let score = 100;

    // Deduct points for poor Web Vitals
    const poorVitals = this.webVitals.filter(vital => vital.rating === 'poor');
    score -= poorVitals.length * 15;

    // Deduct points for slow APIs
    const slowAPIs = this.apiCalls.filter(call => call.duration > 2000);
    score -= Math.min(slowAPIs.length * 5, 25);

    // Deduct points for slow components
    const slowComponents = Array.from(this.renderTimes.entries())
      .filter(([_, duration]) => duration > 100);
    score -= Math.min(slowComponents.length * 3, 15);

    // Deduct points for high error rate
    const errorRate = this.calculateAPIStats().errorRate;
    score -= Math.min(errorRate, 20);

    return Math.max(score, 0);
  }

  // Helper to estimate response size
  private getResponseSize(response: Response): number | undefined {
    const contentLength = response.headers.get('content-length');
    return contentLength ? parseInt(contentLength, 10) : undefined;
  }

  // Export for debugging and external monitoring
  exportMetrics() {
    return {
      metrics: this.metrics,
      apiCalls: this.apiCalls,
      renderTimes: Object.fromEntries(this.renderTimes),
      userInteractions: this.userInteractions,
      webVitals: this.webVitals
    };
  }

  // Cleanup method
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.isMonitoring = false;
  }
}

// Singleton instance
const performanceMonitor = new FrontendPerformanceMonitor();

// Enhanced fetch wrapper with comprehensive tracking
export const trackedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const tracker = performanceMonitor.trackAPICall(url, options.method || 'GET');
  
  try {
    const response = await fetch(url, options);
    tracker.end(response);
    return response;
  } catch (error) {
    // Track failed requests
    tracker.end(new Response(null, { status: 0 }));
    throw error;
  }
};

// React Hook for component performance tracking
export const usePerformanceTracking = (componentName: string) => {
  React.useEffect(() => {
    const endTracking = performanceMonitor.trackComponentRender(componentName);
    return endTracking;
  });

  return {
    trackInteraction: (action: string, metadata?: Record<string, any>) => {
      performanceMonitor.trackUserInteraction(`${componentName}:${action}`, metadata);
    },
    startMetric: (name: string, metadata?: Record<string, any>) => {
      return performanceMonitor.startMetric(`${componentName}:${name}`, metadata);
    }
  };
};

// Performance debugging utilities
export const debugPerformance = {
  // Log current performance state
  log: () => {
    console.group('🔍 Performance Debug Report');
    const report = performanceMonitor.getPerformanceReport();
    console.log('📊 Performance Score:', report.score);
    console.log('🌐 Web Vitals:', report.webVitals);
    console.log('📡 API Performance:', report.apiCalls);
    console.log('⚛️ Component Performance:', report.components);
    console.log('🎯 Recommendations:', report.recommendations);
    console.groupEnd();
  },

  // Start continuous monitoring
  startMonitoring: () => {
    performanceMonitor.startRealTimeMonitoring();
    console.log('🚀 Real-time performance monitoring started');
  },

  // Get detailed performance report
  getReport: () => {
    return performanceMonitor.getPerformanceReport();
  },

  // Export all metrics for external analysis
  exportData: () => {
    return performanceMonitor.exportMetrics();
  },

  // Clear all metrics
  reset: () => {
    performanceMonitor.cleanup();
    console.log('🧹 Performance metrics cleared');
  }
};

export default performanceMonitor; 