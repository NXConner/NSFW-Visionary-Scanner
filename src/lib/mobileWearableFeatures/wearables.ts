import { toast } from "sonner";
import { logger } from "@/lib/logger";
import type { WearableDevice, JsonObject } from "./types";

const WEARABLES_KEY = "wearable_devices";

function getStoredDevices(): WearableDevice[] {
  try {
    const stored = localStorage.getItem(WEARABLES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveDevices(devices: WearableDevice[]): void {
  try {
    localStorage.setItem(WEARABLES_KEY, JSON.stringify(devices));
  } catch {
    // ignore
  }
}

export async function connectWearableDevice(
  deviceType: WearableDevice["device_type"],
  deviceName: string,
  deviceIdentifier: string,
  deviceModel?: string | null,
  capabilities?: JsonObject | null,
): Promise<WearableDevice | null> {
  try {
    const devices = getStoredDevices();
    const existingIndex = devices.findIndex(d => d.device_identifier === deviceIdentifier);

    const device: WearableDevice = {
      id: existingIndex >= 0 ? devices[existingIndex].id : crypto.randomUUID(),
      user_id: "local",
      device_type: deviceType,
      device_name: deviceName,
      device_model: deviceModel ?? null,
      device_identifier: deviceIdentifier,
      is_connected: true,
      connection_status: "connected",
      last_connected_at: new Date().toISOString(),
      last_sync_at: null,
      capabilities: capabilities ?? null,
      auto_sync_enabled: true,
      sync_frequency_minutes: 5,
      created_at: existingIndex >= 0 ? devices[existingIndex].created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      devices[existingIndex] = device;
    } else {
      devices.push(device);
    }
    saveDevices(devices);

    toast.success(`Connected to ${deviceName}!`);
    return device;
  } catch (error) {
    logger.error("Failed to connect wearable", { error });
    toast.error("Failed to connect device");
    return null;
  }
}

export async function getWearableDevices(): Promise<WearableDevice[]> {
  try {
    return getStoredDevices();
  } catch (error) {
    logger.error("Failed to load wearables", { error });
    return [];
  }
}

export async function disconnectWearableDevice(deviceId: string): Promise<boolean> {
  try {
    const devices = getStoredDevices();
    const device = devices.find(d => d.id === deviceId);
    if (device) {
      device.is_connected = false;
      device.connection_status = "disconnected";
      device.updated_at = new Date().toISOString();
      saveDevices(devices);
    }
    toast.success("Device disconnected");
    return true;
  } catch (error) {
    logger.error("Failed to disconnect wearable", { error });
    toast.error("Failed to disconnect device");
    return false;
  }
}
