import React from "react";

import ErrorBoundary from "./ErrorBoundary";

/**
 * HOC helper to wrap any component with the shared ErrorBoundary.
 *
 * Kept separate from ErrorBoundary.tsx so React Fast Refresh rules can enforce
 * "component-only exports" on component modules.
 */
export const withErrorBoundary = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  section?: string,
): React.ComponentType<P> => {
  const WithErrorBoundaryWrapper = (props: P) =>
    React.createElement(
      ErrorBoundary,
      { section },
      React.createElement(WrappedComponent, { ...props }),
    );

  WithErrorBoundaryWrapper.displayName = `withErrorBoundary(${
    WrappedComponent.displayName || WrappedComponent.name || "Component"
  })`;

  return WithErrorBoundaryWrapper;
};
