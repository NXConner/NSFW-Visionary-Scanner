import { Capacitor } from "@capacitor/core";

const DEVICE_ID_KEY = "dlc_device_id_v1";

const safeLocalStorage = () => (typeof window !== "undefined" ? window.localStorage : null);

export const getDeviceId = (): string => {
  try {
    const storage = safeLocalStorage();
    if (!storage) return "web-unknown";
    const existing = storage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;
    const id = typeof crypto?.randomUUID === "function" ? crypto.randomUUID() : `web-${Date.now()}`;
    storage.setItem(DEVICE_ID_KEY, id);
    return id;
  } catch {
    return "web-unknown";
  }
};

export const getDevicePlatform = (): "ios" | "android" | "web" => {
  try {
    const platform = Capacitor.getPlatform();
    if (platform === "ios" || platform === "android") return platform;
    return "web";
  } catch {
    return "web";
  }
};
