"use client";

import { AppAnalytics } from "@/types/devices";

class AppAnalyticsService {
  private events: AppAnalytics[] = [];
  private readonly MAX_EVENTS = 1000; // Keep only last 1000 events

  trackEvent(event: Omit<AppAnalytics, 'timestamp'>) {
    const analyticsEvent: AppAnalytics = {
      ...event,
      timestamp: new Date(),
    };

    this.events.push(analyticsEvent);

    // Keep only recent events
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }

    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
    }

    // In production, you would send to analytics service
    // this.sendToAnalyticsService(analyticsEvent);
  }

  trackAppOpen(appId: string, userId?: string, metadata?: Record<string, unknown>) {
    this.trackEvent({
      appId,
      userId,
      action: 'open',
      metadata: {
        ...metadata,
        userAgent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
      },
    });
  }

  trackAppClose(appId: string, userId?: string, sessionDuration?: number) {
    this.trackEvent({
      appId,
      userId,
      action: 'close',
      metadata: {
        sessionDuration,
        timestamp: Date.now(),
      },
    });
  }

  trackAppError(appId: string, userId?: string, error?: Error) {
    this.trackEvent({
      appId,
      userId,
      action: 'error',
      metadata: {
        errorMessage: error?.message,
        errorStack: error?.stack,
        errorName: error?.name,
      },
    });
  }

  trackAppInteraction(appId: string, interactionType: string, userId?: string, metadata?: Record<string, unknown>) {
    this.trackEvent({
      appId,
      userId,
      action: 'interaction',
      metadata: {
        interactionType,
        ...metadata,
      },
    });
  }

  getEventsForApp(appId: string): AppAnalytics[] {
    return this.events.filter(event => event.appId === appId);
  }

  getEventsForUser(userId: string): AppAnalytics[] {
    return this.events.filter(event => event.userId === userId);
  }

  getAppUsageStats(appId: string) {
    const appEvents = this.getEventsForApp(appId);
    const opens = appEvents.filter(e => e.action === 'open').length;
    const closes = appEvents.filter(e => e.action === 'close').length;
    const errors = appEvents.filter(e => e.action === 'error').length;
    const interactions = appEvents.filter(e => e.action === 'interaction').length;

    return {
      totalOpens: opens,
      totalCloses: closes,
      totalErrors: errors,
      totalInteractions: interactions,
      averageSessionDuration: this.calculateAverageSessionDuration(appEvents),
      errorRate: opens > 0 ? (errors / opens) * 100 : 0,
    };
  }

  private calculateAverageSessionDuration(events: AppAnalytics[]): number {
    const sessions: number[] = [];
    let currentSession: { open?: number; close?: number } = {};

    events.forEach(event => {
      if (event.action === 'open' && event.metadata?.timestamp) {
        currentSession.open = event.metadata.timestamp as number;
      } else if (event.action === 'close' && event.metadata?.timestamp) {
        currentSession.close = event.metadata.timestamp as number;
        if (currentSession.open && currentSession.close) {
          sessions.push(currentSession.close - currentSession.open);
        }
        currentSession = {};
      }
    });

    if (sessions.length === 0) return 0;
    return sessions.reduce((sum, duration) => sum + duration, 0) / sessions.length;
  }

  exportData(): AppAnalytics[] {
    return [...this.events];
  }

  clearData() {
    this.events = [];
  }

  // In a real app, you'd implement this to send data to your analytics service
  private sendToAnalyticsService() {
    // Example: Send to Google Analytics, Mixpanel, etc.
    // gtag('event', 'app_interaction', {
    //   app_id: event.appId,
    //   action: event.action,
    //   user_id: event.userId,
    // });

    // Or send to custom endpoint
    // fetch('/api/analytics', {
    //   method: 'POST',
    //   body: JSON.stringify(event),
    // });
  }
}

// Create singleton instance
export const appAnalytics = new AppAnalyticsService();

// React hook for using analytics in components
export const useAppAnalytics = () => {
  return {
    trackAppOpen: (appId: string, userId?: string, metadata?: Record<string, unknown>) =>
      appAnalytics.trackAppOpen(appId, userId, metadata),

    trackAppClose: (appId: string, userId?: string, sessionDuration?: number) =>
      appAnalytics.trackAppClose(appId, userId, sessionDuration),

    trackAppError: (appId: string, userId?: string, error?: Error) =>
      appAnalytics.trackAppError(appId, userId, error),

    trackAppInteraction: (appId: string, interactionType: string, userId?: string, metadata?: Record<string, unknown>) =>
      appAnalytics.trackAppInteraction(appId, interactionType, userId, metadata),

    getAppUsageStats: (appId: string) => appAnalytics.getAppUsageStats(appId),
  };
};
