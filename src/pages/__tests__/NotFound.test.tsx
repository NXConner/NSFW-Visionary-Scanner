import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NotFound from "../NotFound";

describe("NotFound", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("renders 404 message", () => {
    render(
      <MemoryRouter initialEntries={["/unknown-page"]}>
        <NotFound />
      </MemoryRouter>,
    );

    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText("Oops! Page not found")).toBeInTheDocument();
  });

  it("has a link to home page", () => {
    render(
      <MemoryRouter initialEntries={["/unknown-page"]}>
        <NotFound />
      </MemoryRouter>,
    );

    const homeLink = screen.getByText("Return to Home");
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute("href", "/");
  });

  it("logs 404 warning with pathname", () => {
    render(
      <MemoryRouter initialEntries={["/some-missing-route"]}>
        <NotFound />
      </MemoryRouter>,
    );

    expect(console.warn).toHaveBeenCalledWith("404 Not Found:", "/some-missing-route");
  });
});
