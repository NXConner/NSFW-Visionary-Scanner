import React from "react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

let authState: any;
let rolesState: any;

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => authState,
}));

vi.mock("@/hooks/useUserRoles", () => ({
  useUserRoles: () => rolesState,
}));

describe("RequireAdmin", () => {
  beforeEach(() => {
    authState = {
      user: null,
      loading: false,
      isSuperAdmin: false,
      hasFullAccess: false,
      allFeaturesUnlocked: false,
      rolesLoading: false,
    };

    rolesState = {
      isAdmin: false,
      isSuperAdmin: false,
      isLoading: false,
      error: null,
    };

    vi.clearAllMocks();
  });

  it("shows sign-in gating when signed out", async () => {
    const { RequireAdmin } = await import("@/components/auth");

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <RequireAdmin>
          <div>secret admin</div>
        </RequireAdmin>
      </MemoryRouter>,
    );

    expect(screen.getByText(/admin access required/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    expect(screen.queryByText("secret admin")).not.toBeInTheDocument();
  });

  it("shows access denied when signed in but not admin", async () => {
    const { RequireAdmin } = await import("@/components/auth");

    authState.user = { id: "u1", email: "user@example.invalid" };

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <RequireAdmin>
          <div>secret admin</div>
        </RequireAdmin>
      </MemoryRouter>,
    );

    expect(screen.getByText(/admin access required/i)).toBeInTheDocument();
    expect(screen.getByText(/does not have admin privileges/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /sign in/i })).toBeNull();
    expect(screen.queryByText("secret admin")).not.toBeInTheDocument();
  });

  it("renders children for admin users", async () => {
    const { RequireAdmin } = await import("@/components/auth");

    authState.user = { id: "u1", email: "admin@example.invalid" };
    rolesState.isAdmin = true;

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <RequireAdmin>
          <div>secret admin</div>
        </RequireAdmin>
      </MemoryRouter>,
    );

    expect(screen.getByText("secret admin")).toBeInTheDocument();
  });

  it("renders children for super admins (AuthContext)", async () => {
    const { RequireAdmin } = await import("@/components/auth");

    authState.user = { id: "u1", email: "super@example.invalid" };
    authState.isSuperAdmin = true;

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <RequireAdmin>
          <div>secret admin</div>
        </RequireAdmin>
      </MemoryRouter>,
    );

    expect(screen.getByText("secret admin")).toBeInTheDocument();
  });
});
