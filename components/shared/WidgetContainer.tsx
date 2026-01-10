import { ReactNode } from 'react';

interface WidgetContainerProps {
  title: string;
  loading?: boolean;
  loadingMessage?: string;
  error?: boolean;
  errorMessage?: string;
  empty?: boolean;
  emptyMessage?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Unified container component for all dashboard widgets.
 *
 * Provides consistent styling and state handling (loading, error, empty) across
 * Weather, Calendar, RSS, and other widgets.
 *
 * @param props - Component props
 * @returns Widget container with appropriate state rendering
 *
 * @example
 * ```typescript
 * <WidgetContainer
 *   title="Weather"
 *   loading={loading}
 *   loadingMessage="Loading weather..."
 *   error={error}
 *   errorMessage="Unable to fetch weather"
 *   empty={!weather}
 * >
 *   <div>Weather content here</div>
 * </WidgetContainer>
 * ```
 */
export function WidgetContainer({
  title,
  loading = false,
  loadingMessage = 'Loading...',
  error = false,
  errorMessage = 'Unable to fetch data',
  empty = false,
  emptyMessage = 'No data available',
  children,
  className = '',
}: WidgetContainerProps) {
  const containerClasses = `bg-gray-900 rounded-lg p-vw-sm border border-gray-800 h-full flex flex-col ${className}`;

  if (loading) {
    return (
      <div className={containerClasses}>
        <h2 className="text-vw-xl font-semibold mb-vw-sm">{title}</h2>
        <div className="text-gray-400 text-vw-sm">{loadingMessage}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={containerClasses}>
        <h2 className="text-vw-xl font-semibold mb-vw-sm">{title}</h2>
        <div className="text-gray-400 text-vw-sm">{errorMessage}</div>
      </div>
    );
  }

  if (empty) {
    return (
      <div className={containerClasses}>
        <h2 className="text-vw-xl font-semibold mb-vw-sm">{title}</h2>
        <div className="text-gray-400 text-vw-sm">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <h2 className="text-vw-xl font-semibold mb-vw-sm">{title}</h2>
      {children}
    </div>
  );
}
