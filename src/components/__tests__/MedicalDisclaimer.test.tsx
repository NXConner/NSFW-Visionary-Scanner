import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MedicalDisclaimer } from "@/components/MedicalDisclaimer";

describe("MedicalDisclaimer", () => {
  it("renders condensed disclaimer text", () => {
    render(<MedicalDisclaimer mode="condensed" />);
    expect(screen.getByText(/Medical Disclaimer:/i)).toBeInTheDocument();
    expect(screen.getByText(/educational purposes/i)).toBeInTheDocument();
  });

  it("renders contextual reminder", () => {
    render(<MedicalDisclaimer mode="contextual" />);
    expect(screen.getByText(/Reminder:/i)).toBeInTheDocument();
    expect(screen.getByText(/Always consult a healthcare provider/i)).toBeInTheDocument();
  });

  it("opens modal on first launch when not accepted", async () => {
    localStorage.removeItem("morphoscan_disclaimer_accepted");
    localStorage.removeItem("morphoscan_disclaimer_date");

    render(<MedicalDisclaimer mode="modal" />);

    await waitFor(() => {
      expect(screen.getByText("Medical Disclaimer")).toBeInTheDocument();
    });
  });
});
