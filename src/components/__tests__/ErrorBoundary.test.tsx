import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ErrorBoundary, { withErrorBoundary } from "../ErrorBoundary";

// Component that throws an error
const ThrowingComponent = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error("Test error message");
  }
  return <div>No error</div>;
};

// Suppress console.error during error boundary tests
const originalError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalError;
});

describe("ErrorBoundary", () => {
  it("renders children when there is no error", () => {
    render(
      <ErrorBoundary>
        <div>Child content</div>
      </ErrorBoundary>,
    );

    expect(screen.getByText("Child content")).toBeInTheDocument();
  });

  it("renders error UI when a child throws", () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText(/Test error message/)).toBeInTheDocument();
  });

  it("renders custom section name in error message", () => {
    render(
      <ErrorBoundary section="Scanner">
        <ThrowingComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Error in Scanner")).toBeInTheDocument();
  });

  it("renders custom fallback when provided", () => {
    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowingComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Custom fallback")).toBeInTheDocument();
  });

  it("renders null when fallback is explicitly null", () => {
    const { container } = render(
      <ErrorBoundary fallback={null}>
        <ThrowingComponent />
      </ErrorBoundary>,
    );

    expect(container.innerHTML).toBe("");
  });

  it("calls onReset when Try Again button is clicked", () => {
    const onReset = vi.fn();

    render(
      <ErrorBoundary onReset={onReset}>
        <ThrowingComponent />
      </ErrorBoundary>,
    );

    const tryAgainButton = screen.getByText("Try Again");
    fireEvent.click(tryAgainButton);

    expect(onReset).toHaveBeenCalledOnce();
  });

  it("has Go Home button", () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
    );

    const goHomeButton = screen.getByText("Go Home");
    expect(goHomeButton).toBeInTheDocument();
  });
});

describe("withErrorBoundary HOC", () => {
  it("wraps component with error boundary", () => {
    const WrappedComponent = withErrorBoundary(ThrowingComponent, "TestSection");

    render(<WrappedComponent />);

    expect(screen.getByText("Error in TestSection")).toBeInTheDocument();
  });

  it("renders wrapped component when no error", () => {
    const SafeComponent = () => <div>Safe content</div>;
    const WrappedComponent = withErrorBoundary(SafeComponent);

    render(<WrappedComponent />);

    expect(screen.getByText("Safe content")).toBeInTheDocument();
  });
});
