import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Capacitor } from "@capacitor/core";
import { getDeviceId, getDevicePlatform } from "../device";

vi.mock("@capacitor/core", () => ({
  Capacitor: {
    getPlatform: vi.fn(),
  },
}));

const DEVICE_ID_KEY = "dlc_device_id_v1";

describe("dlc/core/device", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("returns existing device id from storage", () => {
    localStorage.setItem(DEVICE_ID_KEY, "stored-device-id");
    expect(getDeviceId()).toBe("stored-device-id");
  });

  it("generates and stores device id when missing", () => {
    const originalCrypto = globalThis.crypto;
    const randomUUID = vi.fn(() => "uuid-1234");
    Object.defineProperty(globalThis, "crypto", {
      value: { randomUUID },
      configurable: true,
    });

    try {
      const id = getDeviceId();
      expect(id).toBe("uuid-1234");
      expect(localStorage.getItem(DEVICE_ID_KEY)).toBe("uuid-1234");
      expect(randomUUID).toHaveBeenCalledTimes(1);
    } finally {
      Object.defineProperty(globalThis, "crypto", {
        value: originalCrypto,
        configurable: true,
      });
    }
  });

  it("maps platform to ios/android/web with fallback", () => {
    const mockedGetPlatform = vi.mocked(Capacitor.getPlatform);

    mockedGetPlatform.mockReturnValue("ios" as ReturnType<typeof Capacitor.getPlatform>);
    expect(getDevicePlatform()).toBe("ios");

    mockedGetPlatform.mockReturnValue("android" as ReturnType<typeof Capacitor.getPlatform>);
    expect(getDevicePlatform()).toBe("android");

    mockedGetPlatform.mockReturnValue("web" as ReturnType<typeof Capacitor.getPlatform>);
    expect(getDevicePlatform()).toBe("web");

    mockedGetPlatform.mockImplementation(() => {
      throw new Error("fail");
    });
    expect(getDevicePlatform()).toBe("web");
  });
});
