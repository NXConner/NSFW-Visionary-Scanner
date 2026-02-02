import React from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import { SettingsProvider, useSettings } from "@/contexts/SettingsContext";

const mocks = vi.hoisted(() => ({
  applyThemeToDocument: vi.fn(),
  getCustomWallpaperBlob: vi.fn(),
  setCustomWallpaperBlob: vi.fn(),
  clearCustomWallpaperBlob: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock("@/design-system", async importOriginal => {
  const actual = await importOriginal<typeof import("@/design-system")>();
  return {
    ...actual,
    applyThemeToDocument: mocks.applyThemeToDocument,
  };
});

vi.mock("@/lib/wallpaperStorage", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/wallpaperStorage")>();
  return {
    ...actual,
    getCustomWallpaperBlob: mocks.getCustomWallpaperBlob,
    setCustomWallpaperBlob: mocks.setCustomWallpaperBlob,
    clearCustomWallpaperBlob: mocks.clearCustomWallpaperBlob,
  };
});

function Consumer() {
  const s = useSettings();
  return (
    <div>
      <div data-testid="theme">{s.theme}</div>
      <div data-testid="preset">{s.themePreset}</div>
      <div data-testid="wallpaper">{s.customWallpaper ?? ""}</div>
      <button onClick={() => s.setTheme("light")}>setLight</button>
      <button
        onClick={() =>
          s.setCustomWallpaperFromFile(new File(["hello"], "wallpaper.png", { type: "image/png" }))
        }
      >
        setWallpaperFile
      </button>
      <button onClick={() => s.setCustomWallpaper(null)}>clearWallpaper</button>
    </div>
  );
}

describe("SettingsContext", () => {
  const createObjectURLSpy = vi.fn(() => "blob:mock");
  const revokeObjectURLSpy = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    mocks.applyThemeToDocument.mockClear();
    mocks.getCustomWallpaperBlob.mockReset();
    mocks.setCustomWallpaperBlob.mockReset();
    mocks.clearCustomWallpaperBlob.mockReset();
    mocks.setCustomWallpaperBlob.mockResolvedValue(undefined);
    mocks.clearCustomWallpaperBlob.mockResolvedValue(undefined);

    // jsdom has URL but createObjectURL may be missing depending on env.
    (global.URL.createObjectURL as unknown) = createObjectURLSpy;
    (global.URL.revokeObjectURL as unknown) = revokeObjectURLSpy;
  });

  afterEach(() => {
    createObjectURLSpy.mockClear();
    revokeObjectURLSpy.mockClear();
  });

  it("applies theme changes (light) and updates document class", async () => {
    render(
      <SettingsProvider>
        <Consumer />
      </SettingsProvider>,
    );

    expect(screen.getByTestId("theme").textContent).toBe("dark");
    fireEvent.click(screen.getByText("setLight"));

    await waitFor(() => {
      expect(screen.getByTestId("theme").textContent).toBe("light");
      expect(document.documentElement.classList.contains("light")).toBe(true);
    });

    expect(mocks.applyThemeToDocument).toHaveBeenCalled();
  });

  it("stores wallpaper as IndexedDB blob sentinel when setting wallpaper from file", async () => {
    render(
      <SettingsProvider>
        <Consumer />
      </SettingsProvider>,
    );

    fireEvent.click(screen.getByText("setWallpaperFile"));

    await waitFor(() => {
      expect(mocks.setCustomWallpaperBlob).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId("wallpaper").textContent).toContain("blob:mock#wallpaper.png");
    });

    const raw = localStorage.getItem("morphoscan_settings");
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw as string) as { customWallpaper?: string };
    expect(parsed.customWallpaper).toBe("__idb_blob_wallpaper__");
  });

  it("restores wallpaper from IndexedDB when sentinel is present in localStorage", async () => {
    localStorage.setItem(
      "morphoscan_settings",
      JSON.stringify({
        theme: "dark",
        themePreset: "obsidian",
        customWallpaper: "__idb_blob_wallpaper__",
        wallpaperBlur: 200,
        wallpaperOpacity: 0.55,
        fontSize: "medium",
        fontFamily: "system",
        customAccentColor: null,
        colorBlindMode: "none",
        hapticEnabled: true,
        notificationsEnabled: false,
        reminderTime: "09:00",
        reminderDays: [1, 3, 5],
      }),
    );

    mocks.getCustomWallpaperBlob.mockResolvedValue(new Blob(["x"], { type: "image/png" }));
    createObjectURLSpy.mockReturnValue("blob:restored");

    render(
      <SettingsProvider>
        <Consumer />
      </SettingsProvider>,
    );

    await waitFor(() => {
      expect(mocks.getCustomWallpaperBlob).toHaveBeenCalled();
      expect(screen.getByTestId("wallpaper").textContent).toContain("blob:restored#wallpaper.png");
    });
  });

  it("clears wallpaper and clears persisted blob", async () => {
    render(
      <SettingsProvider>
        <Consumer />
      </SettingsProvider>,
    );

    fireEvent.click(screen.getByText("setWallpaperFile"));
    await waitFor(() => expect(mocks.setCustomWallpaperBlob).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByText("clearWallpaper"));

    await waitFor(() => {
      expect(mocks.clearCustomWallpaperBlob).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId("wallpaper").textContent).toBe("");
    });
  });
});
