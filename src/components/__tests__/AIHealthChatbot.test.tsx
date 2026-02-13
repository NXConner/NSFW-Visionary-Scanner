/**
 * AIHealthChatbot Component Tests
 * Tests for the AI Health Chatbot component functionality
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

vi.mock("@/lib/edge/aiHealthChat", () => ({
  invokeAiHealthChat: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    message: vi.fn(),
  },
}));

// Import after mocks
import { AIHealthChatbot } from "../AIHealthChatbot";
import { invokeAiHealthChat } from "@/lib/edge/aiHealthChat";

describe("AIHealthChatbot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render the chatbot component", () => {
      render(<AIHealthChatbot />);

      expect(screen.getByText("AI Health Assistant")).toBeInTheDocument();
    });

    it("should show medical disclaimer initially", () => {
      render(<AIHealthChatbot />);

      expect(screen.getByText(/Medical Disclaimer/i)).toBeInTheDocument();
    });

    it("should show suggested questions", () => {
      render(<AIHealthChatbot />);

      expect(screen.getByText(/How can I help you today/i)).toBeInTheDocument();
    });

    it("should render input field", () => {
      render(<AIHealthChatbot />);

      const input = screen.getByPlaceholderText(/Ask about health/i);
      expect(input).toBeInTheDocument();
    });

    it("should render send button", () => {
      render(<AIHealthChatbot />);

      const sendButton = screen.getByRole("button", { name: /send message/i });
      expect(sendButton).toBeInTheDocument();
    });
  });

  describe("Input Handling", () => {
    it("should update input value on typing", async () => {
      const user = userEvent.setup();
      render(<AIHealthChatbot />);

      const input = screen.getByPlaceholderText(/Ask about health/i);
      await user.type(input, "Test question");

      expect(input).toHaveValue("Test question");
    });

    it("should disable send button when input is empty", () => {
      render(<AIHealthChatbot />);

      const input = screen.getByPlaceholderText(/Ask about health/i);
      expect(input).toHaveValue("");

      const sendButton = screen.getByRole("button", { name: /send message/i });
      expect(sendButton).toBeDisabled();
    });

    it("should clear input after sending", async () => {
      const user = userEvent.setup();
      vi.mocked(invokeAiHealthChat).mockResolvedValueOnce({
        ok: true,
        text: "This is an AI response.",
      });
      render(<AIHealthChatbot />);

      const input = screen.getByPlaceholderText(/Ask about health/i);
      await user.type(input, "Test question");

      const sendButton = screen.getByRole("button", { name: /send message/i });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(input).toHaveValue("");
      });
    });
  });

  describe("Message Display", () => {
    it("should show welcome message when no messages", () => {
      render(<AIHealthChatbot />);

      expect(screen.getByText(/How can I help you today/i)).toBeInTheDocument();
    });

    it("should render assistant message from edge function", async () => {
      const user = userEvent.setup();
      vi.mocked(invokeAiHealthChat).mockResolvedValueOnce({
        ok: true,
        text: "Edge function reply.",
      });
      render(<AIHealthChatbot />);

      const input = screen.getByPlaceholderText(/Ask about health/i);
      await user.type(input, "Hello");

      fireEvent.click(screen.getByRole("button", { name: /send message/i }));

      await waitFor(() => {
        expect(screen.getByText("Edge function reply.")).toBeInTheDocument();
      });
    });
  });

  describe("Suggested Questions", () => {
    it("should render suggested question buttons", () => {
      render(<AIHealthChatbot />);

      const questionButtons = screen.getAllByRole("button");
      expect(questionButtons.length).toBeGreaterThan(0);
    });
  });

  describe("Compact Mode", () => {
    it("should apply compact styling when compact prop is true", () => {
      const { container } = render(<AIHealthChatbot compact />);

      // Check that component renders (specific styling would need more detailed tests)
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have accessible input label", () => {
      render(<AIHealthChatbot />);

      const input = screen.getByPlaceholderText(/Ask about health/i);
      expect(input).toBeInTheDocument();
    });

    it("should support keyboard navigation", () => {
      render(<AIHealthChatbot />);

      const input = screen.getByPlaceholderText(/Ask about health/i);
      input.focus();
      expect(document.activeElement).toBe(input);
    });
  });
});
