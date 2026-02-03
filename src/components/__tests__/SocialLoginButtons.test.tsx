import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SocialLoginButtons } from "../SocialLoginButtons";

const signInWithGoogle = vi.fn().mockResolvedValue({ error: null });
const signInWithApple = vi.fn().mockResolvedValue({ error: null });
const linkSocialAccount = vi.fn().mockResolvedValue({ error: null });

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    signInWithGoogle,
    signInWithApple,
    linkSocialAccount,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe("SocialLoginButtons", () => {
  beforeEach(() => {
    signInWithGoogle.mockClear();
    signInWithApple.mockClear();
    linkSocialAccount.mockClear();
  });

  it("renders Google and Apple buttons", () => {
    render(<SocialLoginButtons />);
    expect(screen.getByRole("button", { name: /continue with google/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue with apple/i })).toBeInTheDocument();
  });

  it("triggers Google sign-in when clicked", async () => {
    render(<SocialLoginButtons />);
    fireEvent.click(screen.getByRole("button", { name: /continue with google/i }));
    await waitFor(() => expect(signInWithGoogle).toHaveBeenCalled());
  });
});
