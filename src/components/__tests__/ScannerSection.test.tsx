import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import { ScannerSection } from "@/components/ScannerSection";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

const stopCameraMock = vi.fn();
const startCameraMock = vi.fn(async () => ({ ok: true as const }));
const captureImageMock = vi.fn(() => "data:image/jpeg;base64,AAAA");
const setFocusModeMock = vi.fn(async () => true);
const setFocusDistanceMock = vi.fn(async () => true);
const tapToFocusMock = vi.fn(async () => true);
const setTorchMock = vi.fn(async () => true);
const setZoomFactorMock = vi.fn(async () => true);

vi.mock("@/hooks/useCamera", () => ({
  useCamera: () => ({
    videoRef: { current: null },
    canvasRef: { current: null },
    isActive: false,
    isStarting: false,
    error: null,
    startCamera: startCameraMock,
    stopCamera: stopCameraMock,
    captureImage: captureImageMock,
    getVideoTrack: () => null,
    focusState: "searching",
    tapFocusFeedback: null,
    setFocusMode: setFocusModeMock,
    setFocusDistance: setFocusDistanceMock,
    tapToFocus: tapToFocusMock,
    setTorch: setTorchMock,
    setZoomFactor: setZoomFactorMock,
    lockExposure: vi.fn(async () => true),
    lockWhiteBalance: vi.fn(async () => true),
  }),
}));

vi.mock("@/contexts/DataContext", () => ({
  useData: () => ({ saveScan: vi.fn(async () => {}) }),
}));

vi.mock("@/hooks/useAIScanAnalysis", () => ({
  useAIScanAnalysis: () => ({
    analyzeImage: vi.fn(),
    isAnalyzing: false,
    result: null,
    reset: vi.fn(),
  }),
}));

vi.mock("@/hooks/useVisualContent", () => ({
  useVisualContent: () => ({ content: [] }),
}));

vi.mock("@/hooks/useFeatureFlag", () => ({
  useFeatureFlag: () => false,
}));

// Stub heavy child components so we can test ScannerSection state transitions deterministically.
vi.mock("@/components/scanner/ScannerBackgroundEffects", () => ({
  ScannerBackgroundEffects: () => <div data-testid="bg-effects" />,
}));
vi.mock("@/components/scanner/ScannerHeaderBlock", () => ({
  ScannerHeaderBlock: ({ scanMode }: { scanMode: string }) => (
    <div data-testid="header">{scanMode}</div>
  ),
}));
vi.mock("@/components/scanner/ScannerSidePanel", () => ({
  ScannerSidePanel: ({ scanMode }: { scanMode: string }) => (
    <div data-testid="side-panel">{scanMode}</div>
  ),
}));
vi.mock("@/components/scanner/ScannerViewCard", () => ({
  ScannerViewCard: (props: any) => (
    <div>
      <div data-testid="scan-mode">{props.scanMode}</div>
      <div data-testid="captured">{props.capturedImage ? "yes" : "no"}</div>
      <button onClick={props.onStartCamera}>start</button>
      <button onClick={props.onReset}>reset</button>
    </div>
  ),
}));
vi.mock("@/components/ScannerTutorial", () => ({
  ScannerTutorial: () => null,
}));
vi.mock("@/components/CalibrationWizard", () => ({
  CalibrationWizard: () => null,
}));

describe("ScannerSection", () => {
  beforeEach(() => {
    stopCameraMock.mockClear();
    startCameraMock.mockClear();
    captureImageMock.mockClear();
  });

  it("renders and starts camera (scanMode idle -> camera)", async () => {
    render(<ScannerSection />);
    expect(screen.getByTestId("scan-mode").textContent).toBe("idle");

    fireEvent.click(screen.getByText("start"));
    await waitFor(() => {
      expect(startCameraMock).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId("scan-mode").textContent).toBe("camera");
    });
  });

  it("resets back to idle and stops camera", async () => {
    render(<ScannerSection />);

    fireEvent.click(screen.getByText("start"));
    await waitFor(() => expect(screen.getByTestId("scan-mode").textContent).toBe("camera"));

    fireEvent.click(screen.getByText("reset"));
    await waitFor(() => expect(screen.getByTestId("scan-mode").textContent).toBe("idle"));
    expect(stopCameraMock).toHaveBeenCalled();
  });

  it("stops camera on unmount (cleanup)", () => {
    const { unmount } = render(<ScannerSection />);
    unmount();
    expect(stopCameraMock).toHaveBeenCalled();
  });
});
