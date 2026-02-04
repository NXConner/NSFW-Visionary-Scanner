import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useAIScanAnalysis } from "../useAIScanAnalysis";
import { supabase } from "../../integrations/supabase/client";

// Mock Supabase
vi.mock("../../integrations/supabase/client", () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

const mockSupabase = vi.mocked(supabase);

describe("useAIScanAnalysis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should analyze scan data successfully", async () => {
    const mockAnalysisPayload = {
      conditions: [
        { name: "normal", confidence: 0.95, severity: "low", description: "No concerns detected" },
      ],
      recommendations: ["Maintain healthy habits"],
      overallHealth: "good",
      confidenceLevel: 92,
      curvatureAssessment: { detected: false },
      skinHealth: { status: "healthy", observations: [] },
      urgency: "routine",
      disclaimer: "Test disclaimer",
    };

    mockSupabase.functions.invoke.mockResolvedValue({
      data: mockAnalysisPayload,
      error: null,
    });

    const { result } = renderHook(() => useAIScanAnalysis({ saveToHistory: false }));

    const scanData = "data:image/jpeg;base64,base64-image-data";

    result.current.analyzeScan(scanData);

    await waitFor(() => {
      expect(result.current.isAnalyzing).toBe(false);
      expect(result.current.analysis?.overallHealth).toEqual("good");
      expect(result.current.analysis?.recommendations).toEqual(["Maintain healthy habits"]);
      expect(result.current.analysis?.conditions?.[0]?.name).toEqual("normal");
      expect(result.current.error).toBeNull();
    });

    expect(mockSupabase.functions.invoke).toHaveBeenCalledWith("ai-scan-analysis", {
      body: { imageBase64: scanData },
    });
  });

  it("should handle analysis errors", async () => {
    const mockError = { message: "Analysis failed" };

    mockSupabase.functions.invoke.mockResolvedValue({
      data: null,
      error: mockError,
    });

    const { result } = renderHook(() => useAIScanAnalysis({ saveToHistory: false }));
    const scanData = "data:image/jpeg;base64,base64-image-data";

    result.current.analyzeScan(scanData);

    await waitFor(() => {
      expect(result.current.isAnalyzing).toBe(false);
      expect(result.current.analysis).toBeNull();
      expect(result.current.error).toEqual(mockError.message);
    });
  });

  it("should handle network errors", async () => {
    mockSupabase.functions.invoke.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useAIScanAnalysis({ saveToHistory: false }));
    const scanData = "data:image/jpeg;base64,base64-image-data";

    result.current.analyzeScan(scanData);

    await waitFor(() => {
      expect(result.current.isAnalyzing).toBe(false);
      expect(result.current.analysis).toBeNull();
      expect(result.current.error).toContain("Network error");
    });
  });

  it("should clear previous results", () => {
    const { result } = renderHook(() => useAIScanAnalysis({ saveToHistory: false }));
    result.current.clearAnalysis();

    expect(result.current.analysis).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("should validate scan data", async () => {
    const { result } = renderHook(() => useAIScanAnalysis({ saveToHistory: false }));
    const invalidScanData = {
      length: -5,
      circumference: 10.0,
      curvature: 20,
    };

    result.current.analyzeScan(invalidScanData);

    await waitFor(() => {
      expect(result.current.isAnalyzing).toBe(false);
      expect(result.current.error).toContain("Invalid scan data");
    });

    // Should not call the API
    expect(mockSupabase.functions.invoke).not.toHaveBeenCalled();
  });
});
