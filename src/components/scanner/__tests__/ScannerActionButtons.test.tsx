import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { ScannerActionButtons } from "@/components/scanner/ScannerActionButtons";

vi.mock("@/components/ImageUploadScan", () => ({
  ImageUploadScan: () => <div />,
}));

describe("ScannerActionButtons", () => {
  it("disables Save Results when saveDisabled is true", () => {
    render(
      <ScannerActionButtons
        scanMode="complete"
        error={null}
        timerDelay={0}
        isCalibrated={true}
        saveDisabled={true}
        saveDisabledReason="Blocked"
        onStartCamera={() => {}}
        onReset={() => {}}
        onCapture={() => {}}
        onSave={() => {}}
        onShowTutorial={() => {}}
        onShowCalibration={() => {}}
        isActive={false}
        isStarting={false}
      />,
    );

    expect(screen.getByRole("button", { name: /save results/i })).toBeDisabled();
    expect(screen.getByText(/saving blocked by policy/i)).toBeInTheDocument();
  });
});
