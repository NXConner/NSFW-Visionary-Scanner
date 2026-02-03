import { describe, it, expect, vi, afterEach } from "vitest";

type BuildEnv = {
  version: "sfw" | "nsfw" | "hybrid";
  channel: "store" | "direct";
};

const loadModules = async (env: BuildEnv) => {
  vi.resetModules();
  vi.stubEnv("VITE_APP_VERSION", env.version);
  vi.stubEnv("VITE_DISTRIBUTION_CHANNEL", env.channel);
  const flags = await import("@/lib/buildFlags");
  const nav = await import("@/lib/navigation/navCatalog");
  return { flags, nav };
};

const hasNsfwNav = (nav: Awaited<ReturnType<typeof loadModules>>["nav"]) => {
  return nav.NAV_CATEGORIES.some(category => {
    if (category.label === "NSFW Content") return true;
    return category.items.some(item => Boolean(item.nsfwOnly) || String(item.id).startsWith("nsfw-"));
  });
};

const hasAdminNsfw = (nav: Awaited<ReturnType<typeof loadModules>>["nav"]) => {
  return nav.ADMIN_NAV_CATEGORY.items.some(item => item.id === "admin-nsfw");
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("SFW bundle gating", () => {
  it("disables adult bundle for store builds", async () => {
    const { flags, nav } = await loadModules({ version: "sfw", channel: "store" });
    expect(flags.BUILD_ALLOW_ADULT_BUNDLE).toBe(false);
    expect(hasNsfwNav(nav)).toBe(false);
    expect(hasAdminNsfw(nav)).toBe(false);
  });

  it("disables adult bundle for direct SFW builds", async () => {
    const { flags, nav } = await loadModules({ version: "sfw", channel: "direct" });
    expect(flags.BUILD_ALLOW_ADULT_BUNDLE).toBe(false);
    expect(hasNsfwNav(nav)).toBe(false);
    expect(hasAdminNsfw(nav)).toBe(false);
  });

  it("disables adult bundle for hybrid store builds", async () => {
    const { flags, nav } = await loadModules({ version: "hybrid", channel: "store" });
    expect(flags.BUILD_ALLOW_ADULT_BUNDLE).toBe(false);
    expect(hasNsfwNav(nav)).toBe(false);
    expect(hasAdminNsfw(nav)).toBe(false);
  });

  it("enables adult bundle for direct NSFW builds", async () => {
    const { flags, nav } = await loadModules({ version: "nsfw", channel: "direct" });
    expect(flags.BUILD_ALLOW_ADULT_BUNDLE).toBe(true);
    expect(hasNsfwNav(nav)).toBe(true);
    expect(hasAdminNsfw(nav)).toBe(true);
  });
});
