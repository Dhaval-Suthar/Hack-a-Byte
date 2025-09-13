"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AppContainer, AppHeader } from "./AppContainer";
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  appId?: string;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class AppErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('App Error Boundary caught an error', { error: error.message, errorInfo }, error);

    // You could also log to an error reporting service here
    // logErrorToService(error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  private handleReport = () => {
    // Could open a feedback modal or send error report
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <AppContainer backgroundColor="bg-red-900">
          <AppHeader title="App Error" />
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center text-white max-w-md">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold mb-3">Something went wrong</h2>
              <p className="text-red-200 mb-6 text-sm">
                The {this.props.appId || "app"} encountered an error and couldn&apos;t load properly.
              </p>

              <div className="space-y-3">
                <button
                  onClick={this.handleRetry}
                  className="w-full bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Try Again
                </button>

                <button
                  onClick={this.handleReport}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                >
                  Report Issue
                </button>
              </div>

              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-red-300 text-sm mb-2">
                    Error Details (Development)
                  </summary>
                  <pre className="bg-black/50 p-3 rounded text-xs text-red-200 overflow-auto max-h-32">
                    {this.state.error.message}
                    {"\n"}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </AppContainer>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export const useErrorHandler = () => {
  return (error: Error, errorInfo?: ErrorInfo) => {
    logger.error('Error caught by hook', { error: error.message, errorInfo }, error);
    // Could dispatch to error reporting service
  };
};
