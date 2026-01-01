'use client';

import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  widgetName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary component to catch and handle errors in widget components.
 *
 * Prevents individual widget crashes from breaking the entire application.
 * Displays a fallback UI when an error occurs and provides a retry mechanism.
 *
 * @example
 * ```tsx
 * <ErrorBoundary widgetName="Weather">
 *   <Weather />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const widgetName = this.props.widgetName || 'Widget';
    console.error(`${widgetName} Error:`, error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      const widgetName = this.props.widgetName || 'Widget';
      return (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-vw-md flex flex-col items-center justify-center h-full">
          <div className="text-center">
            <div className="text-red-500 text-vw-lg mb-vw-sm">⚠️ Error</div>
            <div className="text-gray-400 text-vw-sm mb-vw-md">
              {widgetName} encountered an error
            </div>
            <button
              onClick={this.handleReset}
              className="px-vw-md py-vw-sm bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors text-vw-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
