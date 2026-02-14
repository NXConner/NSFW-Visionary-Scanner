export type AdminLicenseStatus = "active" | "expired" | "revoked";

export type AdminLicenseDto = {
  id: string;
  key: string;
  userId: string;
  userEmail: string | null;
  packageId: string | null;
  packageName: string | null;
  licenseType: string | null;
  status: AdminLicenseStatus;
  devices: number;
  maxDevices: number;
  createdAtIso: string | null;
  expiresAtIso: string | null;
};

export type AdminGenerateLicenseInput = {
  userEmail: string;
  packageId: string;
  licenseType: "one_time" | "subscription" | "gift" | "promo";
  maxDevices: number;
  expiresAtIso: string | null;
  note?: string | null;
};
