import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { EmailVerificationGate } from "@/components/EmailVerificationGate";

const mockGetUser = vi.fn();
const mockOnAuthStateChange = vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: () => mockGetUser(),
      onAuthStateChange: () => mockOnAuthStateChange(),
    },
  },
}));

const mockUseAuth = vi.fn();
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

describe("EmailVerificationGate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks access when email is unverified", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "user-1", email: "test@example.invalid", email_confirmed_at: null },
      loading: false,
      rolesLoading: false,
      isSuperAdmin: false,
      hasFullAccess: false,
      allFeaturesUnlocked: false,
    });

    mockGetUser.mockResolvedValue({ data: { user: { email_confirmed_at: null } } });

    render(
      <EmailVerificationGate requireVerification>
        <div>Protected</div>
      </EmailVerificationGate>,
    );

    await waitFor(() => {
      expect(screen.getAllByText(/email verification required/i).length).toBeGreaterThan(0);
      expect(screen.queryByText("Protected")).not.toBeInTheDocument();
    });
  });

  it("renders children when email is verified", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "user-1", email: "test@example.invalid", email_confirmed_at: "2024-01-01" },
      loading: false,
      rolesLoading: false,
      isSuperAdmin: false,
      hasFullAccess: false,
      allFeaturesUnlocked: false,
    });

    mockGetUser.mockResolvedValue({ data: { user: { email_confirmed_at: "2024-01-01" } } });

    render(
      <EmailVerificationGate requireVerification>
        <div>Protected</div>
      </EmailVerificationGate>,
    );

    await waitFor(() => {
      expect(screen.getByText("Protected")).toBeInTheDocument();
    });
  });
});
