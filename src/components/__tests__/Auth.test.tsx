import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Auth from "@/pages/Auth";
import { MemoryRouter } from "react-router-dom";
import { toast } from "sonner";

const mockUseAuth = vi.fn();
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe("Auth", () => {
  const baseAuth = {
    user: null,
    session: null,
    loading: false,
    rolesLoading: false,
    isSuperAdmin: false,
    hasFullAccess: false,
    allFeaturesUnlocked: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signInWithGoogle: vi.fn(),
    signInWithApple: vi.fn(),
    linkSocialAccount: vi.fn(),
    signOut: vi.fn(),
  };

  it("renders login form by default", () => {
    mockUseAuth.mockReturnValue(baseAuth);
    render(
      <MemoryRouter>
        <Auth />
      </MemoryRouter>,
    );
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("toggles between login and signup", () => {
    mockUseAuth.mockReturnValue(baseAuth);
    render(
      <MemoryRouter>
        <Auth />
      </MemoryRouter>,
    );

    const toggleButton = screen.getByRole("button", { name: /sign up/i });
    fireEvent.click(toggleButton);

    expect(screen.getAllByText(/create account/i).length).toBeGreaterThan(0);
  });

  it("handles form submission", async () => {
    const mockSignIn = vi.fn().mockResolvedValue({ error: null });
    mockUseAuth.mockReturnValue({ ...baseAuth, signIn: mockSignIn });

    render(
      <MemoryRouter>
        <Auth />
      </MemoryRouter>,
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: "test@unit.test" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("test@unit.test", "password123", false);
    });
  });

  it("displays error messages", async () => {
    const mockSignIn = vi.fn().mockResolvedValue({
      error: { message: "Invalid credentials" },
    });
    mockUseAuth.mockReturnValue({ ...baseAuth, signIn: mockSignIn });

    render(
      <MemoryRouter>
        <Auth />
      </MemoryRouter>,
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    fireEvent.change(emailInput, { target: { value: "test@unit.test" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    const submitButton = screen.getByRole("button", { name: /sign in/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Invalid credentials");
    });
  });
});
