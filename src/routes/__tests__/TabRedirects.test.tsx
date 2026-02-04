import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import "@testing-library/jest-dom/vitest";
import TabDeepLinkRedirect from "@/routes/TabDeepLinkRedirect";
import LegacyAdminRedirect from "@/routes/LegacyAdminRedirect";

const LocationDisplay = () => {
  const location = useLocation();
  return (
    <div data-testid="location">
      {location.pathname}
      {location.search}
      {location.hash}
    </div>
  );
};

describe("TabDeepLinkRedirect", () => {
  it("redirects known tab aliases into /app?tab=...", () => {
    render(
      <MemoryRouter initialEntries={["/peprogress?foo=1#hash"]}>
        <Routes>
          <Route path="/:tab/*" element={<TabDeepLinkRedirect />} />
          <Route path="/app" element={<LocationDisplay />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId("location")).toHaveTextContent("/app?foo=1&tab=pe-progress#hash");
  });

  it("renders NotFound for unknown tabs", () => {
    render(
      <MemoryRouter initialEntries={["/unknown-tab"]}>
        <Routes>
          <Route path="/:tab/*" element={<TabDeepLinkRedirect />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Oops! Page not found")).toBeInTheDocument();
  });
});

describe("LegacyAdminRedirect", () => {
  it("redirects legacy /afmin paths to /admin", () => {
    render(
      <MemoryRouter initialEntries={["/afmin/settings?foo=bar#hash"]}>
        <Routes>
          <Route path="/afmin/*" element={<LegacyAdminRedirect />} />
          <Route path="/admin/*" element={<LocationDisplay />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId("location")).toHaveTextContent("/admin/settings?foo=bar#hash");
  });
});
