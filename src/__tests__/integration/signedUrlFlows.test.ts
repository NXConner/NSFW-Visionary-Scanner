import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const invoke = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: {
      invoke: (...args: unknown[]) => invoke(...args),
    },
  },
}));

describe("Signed URL flows", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-02T00:00:00Z"));
    invoke.mockReset();
    vi.resetModules();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("caches signed URLs until refresh threshold", async () => {
    invoke.mockResolvedValue({ data: { signedUrl: "https://signed.example/one" }, error: null });

    const { signAssetPath } = await import("@/lib/nsfwAssets");

    const first = await signAssetPath({
      assetPath: "dlc-videos/path/video.mp4",
      deviceId: "device-1",
      devicePlatform: "web",
      expiresInSeconds: 300,
    });

    const second = await signAssetPath({
      assetPath: "dlc-videos/path/video.mp4",
      deviceId: "device-1",
      devicePlatform: "web",
      expiresInSeconds: 300,
    });

    expect(first).toBe("https://signed.example/one");
    expect(second).toBe(first);
    expect(invoke).toHaveBeenCalledTimes(1);
  });

  it("forces refresh when forceRefresh is set", async () => {
    invoke
      .mockResolvedValueOnce({ data: { signedUrl: "https://signed.example/one" }, error: null })
      .mockResolvedValueOnce({ data: { signedUrl: "https://signed.example/two" }, error: null });

    const { signAssetPath } = await import("@/lib/nsfwAssets");

    const first = await signAssetPath({
      assetPath: "dlc-videos/path/video.mp4",
      deviceId: "device-1",
      devicePlatform: "web",
      expiresInSeconds: 300,
    });

    const second = await signAssetPath({
      assetPath: "dlc-videos/path/video.mp4",
      deviceId: "device-1",
      devicePlatform: "web",
      expiresInSeconds: 300,
      forceRefresh: true,
    });

    expect(first).toBe("https://signed.example/one");
    expect(second).toBe("https://signed.example/two");
    expect(invoke).toHaveBeenCalledTimes(2);
  });

  it("signs multiple asset paths and skips http urls", async () => {
    invoke.mockImplementation(async (_fn, payload) => {
      const assetPath = String((payload as any)?.body?.assetPath || "unknown");
      return { data: { signedUrl: `https://signed.example/${assetPath}` }, error: null };
    });

    const { signAssetPaths } = await import("@/lib/nsfwAssets");

    const results = await signAssetPaths({
      assetPaths: [
        "dlc-videos/a.mp4",
        "dlc-videos/a.mp4",
        "https://cdn.example/skip.mp4",
        "dlc-videos/b.mp4",
      ],
      deviceId: "device-2",
      devicePlatform: "web",
      expiresInSeconds: 60,
    });

    expect(results["dlc-videos/a.mp4"]).toBe("https://signed.example/dlc-videos/a.mp4");
    expect(results["dlc-videos/b.mp4"]).toBe("https://signed.example/dlc-videos/b.mp4");
    expect(Object.keys(results)).toHaveLength(2);
    expect(invoke).toHaveBeenCalledTimes(2);
  });

  it("throws on missing asset path", async () => {
    const { signAssetPath } = await import("@/lib/nsfwAssets");
    await expect(
      signAssetPath({
        assetPath: "",
        deviceId: "device-1",
        devicePlatform: "web",
      }),
    ).rejects.toThrow("Missing asset path");
  });
});
