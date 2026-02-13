import type { DevicePlatform, LicenseDevice } from "../types";
import { MAX_DEVICES_DEFAULT } from "./constants";
import { generateDeviceFingerprint } from "./fingerprint";

export class DeviceManager {
  private storageKey = "dlc_devices";
  private currentDeviceId: string;
  private currentFingerprint: string | null = null;

  constructor() {
    this.currentDeviceId = this.getOrCreateDeviceId();
  }

  private getOrCreateDeviceId(): string {
    try {
      const stored = localStorage.getItem("dlc_device_id");
      if (stored) return stored;
    } catch { /* ignore */ }
    const platform = this.detectPlatform();
    const deviceId = `${platform}-${crypto.randomUUID()}`;
    try { localStorage.setItem("dlc_device_id", deviceId); } catch { /* ignore */ }
    return deviceId;
  }

  private detectPlatform(): DevicePlatform {
    if (typeof window === "undefined") return "web";
    const userAgent = navigator.userAgent.toLowerCase();
    if (/android/i.test(userAgent)) return "android";
    if (/iphone|ipad|ipod/i.test(userAgent)) return "ios";
    return "web";
  }

  getDeviceId(): string { return this.currentDeviceId; }
  getPlatform(): DevicePlatform { return this.detectPlatform(); }

  async getFingerprint(): Promise<string> {
    if (!this.currentFingerprint) this.currentFingerprint = await generateDeviceFingerprint();
    return this.currentFingerprint;
  }

  getDeviceName(): string {
    if (typeof window === "undefined") return "Unknown Device";
    const platform = this.detectPlatform();
    const userAgent = navigator.userAgent;
    if (platform === "ios") {
      if (/iPad/i.test(userAgent)) return "iPad";
      if (/iPhone/i.test(userAgent)) return "iPhone";
      return "iOS Device";
    }
    if (platform === "android") {
      const match = userAgent.match(/Android.*?;\s*([^;)]+)/);
      if (match) return match[1].trim();
      return "Android Device";
    }
    if (/Chrome/i.test(userAgent)) return "Chrome Browser";
    if (/Firefox/i.test(userAgent)) return "Firefox Browser";
    if (/Safari/i.test(userAgent)) return "Safari Browser";
    if (/Edge/i.test(userAgent)) return "Edge Browser";
    return "Web Browser";
  }

  async createDeviceRecord(licenseId: string): Promise<LicenseDevice> {
    return {
      id: crypto.randomUUID(),
      licenseId,
      deviceId: this.currentDeviceId,
      deviceFingerprint: await this.getFingerprint(),
      deviceName: this.getDeviceName(),
      devicePlatform: this.detectPlatform(),
      isPrimary: false,
      isActive: true,
      registeredAt: new Date(),
      lastUsedAt: new Date(),
      lastValidationAt: new Date(),
    };
  }

  getRegisteredDevices(licenseId: string): LicenseDevice[] {
    try {
      const stored = localStorage.getItem(`${this.storageKey}_${licenseId}`);
      if (stored) return JSON.parse(stored) as LicenseDevice[];
    } catch { /* ignore */ }
    return [];
  }

  saveDevices(licenseId: string, devices: LicenseDevice[]): void {
    try { localStorage.setItem(`${this.storageKey}_${licenseId}`, JSON.stringify(devices)); } catch { /* ignore */ }
  }

  isDeviceRegistered(licenseId: string): boolean {
    return this.getRegisteredDevices(licenseId).some(d => d.deviceId === this.currentDeviceId && d.isActive);
  }

  canRegisterNewDevice(licenseId: string, maxDevices: number = MAX_DEVICES_DEFAULT): boolean {
    return this.getRegisteredDevices(licenseId).filter(d => d.isActive).length < maxDevices;
  }

  async registerDevice(licenseId: string, maxDevices: number = MAX_DEVICES_DEFAULT): Promise<{ success: boolean; error?: string }> {
    const devices = this.getRegisteredDevices(licenseId);
    const existing = devices.find(d => d.deviceId === this.currentDeviceId);
    if (existing) {
      existing.isActive = true;
      existing.lastUsedAt = new Date();
      this.saveDevices(licenseId, devices);
      return { success: true };
    }
    if (devices.filter(d => d.isActive).length >= maxDevices) return { success: false, error: "Maximum devices reached" };
    const newDevice = await this.createDeviceRecord(licenseId);
    newDevice.isPrimary = devices.length === 0;
    devices.push(newDevice);
    this.saveDevices(licenseId, devices);
    return { success: true };
  }

  deregisterDevice(licenseId: string, deviceId?: string): void {
    const devices = this.getRegisteredDevices(licenseId);
    const device = devices.find(d => d.deviceId === (deviceId || this.currentDeviceId));
    if (device) { device.isActive = false; this.saveDevices(licenseId, devices); }
  }
}
