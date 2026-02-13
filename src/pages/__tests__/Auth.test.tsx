import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Auth from "../Auth";
import { AuthProvider } from "@/contexts/AuthContext";
import "@testing-library/jest-dom/vitest";
import { toast } from "sonner";

// Mock the auth context
const mockSignIn = vi.fn();
const mockSignUp = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    signIn: mockSignIn,
    signUp: mockSignUp,
    signOut: vi.fn(),
    loading: false,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-provider">{children}</div>
  ),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
    },
  },
}));

const renderAuth = () => {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Auth />
      </AuthProvider>
    </MemoryRouter>,
  );
};

describe("Auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders login form by default", () => {
    renderAuth();

    expect(screen.getByText(/welcome back/i)).toBeTruthy();
    expect(screen.getByLabelText(/email/i)).toBeTruthy();
    expect(screen.getByLabelText(/password/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeTruthy();
  });

  it("switches to signup mode", async () => {
    renderAuth();

    const signupLink = screen.getByRole("button", { name: /^sign up$/i });
    fireEvent.click(signupLink);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /create account/i })).toBeTruthy();
      expect(screen.getByRole("button", { name: /^create account$/i })).toBeTruthy();
    });
  });

  it("validates email format", async () => {
    renderAuth();

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    // Must pass native <input type="email"> validation to trigger our Zod validation/toast.
    fireEvent.change(emailInput, { target: { value: "invalid@invalid" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Please enter a valid email");
      expect(toast.error).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/valid email/i));
    });
  });

  it("validates password length", async () => {
    renderAuth();

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: "test@example.invalid" } });
    fireEvent.change(passwordInput, { target: { value: "123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Password must be at least 6 characters");
      expect(toast.error).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/at least 6 characters/i));
    });
  });

  it("calls signIn with correct credentials", async () => {
    renderAuth();

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: "test@example.invalid" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("test@example.invalid", "password123", false);
    });
  });

  it("toggles remember me checkbox", () => {
    renderAuth();

    const rememberMeCheckbox = screen.getByRole("checkbox", { name: /remember me/i });
    expect(rememberMeCheckbox).toHaveAttribute("aria-checked", "false");

    fireEvent.click(rememberMeCheckbox);
    expect(rememberMeCheckbox).toHaveAttribute("aria-checked", "true");
  });

  it("switches to forgot password mode", async () => {
    renderAuth();

    const forgotLink = screen.getByText(/forgot password/i);
    fireEvent.click(forgotLink);

    await waitFor(() => {
      expect(screen.getByText(/reset password/i)).toBeTruthy();
      expect(screen.queryByLabelText(/password/i)).toBeNull();
    });
  });

  it("loads remembered email on mount", () => {
    localStorage.setItem("remembered_email", "remembered@example.invalid");
    renderAuth();

    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    expect(emailInput.value).toBe("remembered@example.invalid");
  });

  it("shows loading state during authentication", async () => {
    // Mock a delayed response
    mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    renderAuth();

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: "test@example.invalid" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    expect((submitButton as HTMLButtonElement).disabled).toBe(true);
    expect(submitButton.textContent?.toLowerCase()).toContain("please wait");
  });
});
