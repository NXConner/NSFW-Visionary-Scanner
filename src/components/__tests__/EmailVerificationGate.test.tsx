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

const mockUseUserRoles = vi.fn();
vi.mock("@/hooks/useUserRoles", () => ({
  useUserRoles: () => mockUseUserRoles(),
}));

describe("EmailVerificationGate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUserRoles.mockReturnValue({
      user: null,
      roles: [],
      isAdmin: false,
      isSuperAdmin: false,
      isPro: false,
      isPremium: false,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  it("blocks access when email is unverified", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "user-1", email: "test@example.com", email_confirmed_at: null },
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

  it("bypasses email verification for admin role", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "user-1", email: "admin@example.com", email_confirmed_at: null },
      loading: false,
      rolesLoading: false,
      isSuperAdmin: false,
      hasFullAccess: false,
      allFeaturesUnlocked: false,
    });

    mockUseUserRoles.mockReturnValue({
      user: { id: "user-1" },
      roles: ["admin"],
      isAdmin: true,
      isSuperAdmin: false,
      isPro: false,
      isPremium: true,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    // Even if Supabase reports unverified, the gate must not block privileged roles.
    mockGetUser.mockResolvedValue({ data: { user: { email_confirmed_at: null } } });

    render(
      <EmailVerificationGate requireVerification>
        <div>Protected</div>
      </EmailVerificationGate>,
    );

    await waitFor(() => {
      expect(screen.getByText("Protected")).toBeInTheDocument();
      expect(screen.queryByText(/email verification required/i)).not.toBeInTheDocument();
    });
  });

  it("renders children when email is verified", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "user-1", email: "test@example.com", email_confirmed_at: "2024-01-01" },
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
