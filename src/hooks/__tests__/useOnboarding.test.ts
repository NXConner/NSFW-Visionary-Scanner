import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useOnboarding } from "../useOnboarding";

const ONBOARDING_KEY = "morphoscan_onboarding_complete";

describe("useOnboarding", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("shows onboarding for new users", async () => {
    localStorage.removeItem(ONBOARDING_KEY);
    
    const { result } = renderHook(() => useOnboarding());
    
    await waitFor(() => {
      expect(result.current.showOnboarding).toBe(true);
    });
  });

  it("hides onboarding for returning users", async () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    
    const { result } = renderHook(() => useOnboarding());
    
    // Initial state is false, and since onboarding is complete, it stays false
    await waitFor(() => {
      expect(result.current.showOnboarding).toBe(false);
    });
  });

  it("can set onboarding state", async () => {
    localStorage.removeItem(ONBOARDING_KEY);
    
    const { result } = renderHook(() => useOnboarding());
    
    await waitFor(() => {
      expect(result.current.showOnboarding).toBe(true);
    });
    
    act(() => {
      result.current.setShowOnboarding(false);
    });

    expect(result.current.showOnboarding).toBe(false);
  });

  it("can reset onboarding", async () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    
    const { result } = renderHook(() => useOnboarding());
    
    await waitFor(() => {
      expect(result.current.showOnboarding).toBe(false);
    });
    
    act(() => {
      result.current.resetOnboarding();
    });

    expect(result.current.showOnboarding).toBe(true);
    expect(localStorage.getItem(ONBOARDING_KEY)).toBeNull();
  });
});
