export type AdminDlcPackageRow = {
  packageId: string;
  displayName: string;
  packageType?: string;
  priceUsd: number;
  priceType: string;
  isActive: boolean;
  isFeatured?: boolean;
  displayOrder?: number;
  contentRating?: string;
  stripePriceId: string | null;
  stripeProductId: string | null;
};

export type AdminDlcPromoDiscountType = "percentage" | "fixed_amount" | "free_trial";

export type AdminDlcPromoDto = {
  id: string;
  code: string;
  description: string | null;
  discountType: AdminDlcPromoDiscountType;
  discountValue: number;
  appliesToAll: boolean;
  appliesTo: string[]; // packageIds (e.g. dlc-positions) or ["ALL"]
  minPurchaseAmountUsd: number | null;
  maxRedemptions: number | null;
  currentRedemptions: number;
  maxPerUser: number | null;
  validFromIso: string | null;
  validUntilIso: string | null;
  isActive: boolean;
  campaignName: string | null;
  createdAtIso: string | null;
  updatedAtIso: string | null;
};

export type AdminDlcPromoUpsertInput = {
  code: string;
  description?: string | null;
  discountType: AdminDlcPromoDiscountType;
  discountValue: number;
  appliesToAll?: boolean;
  appliesTo?: string[];
  minPurchaseAmountUsd?: number | null;
  maxRedemptions?: number | null;
  maxPerUser?: number | null;
  validFromIso?: string | null;
  validUntilIso?: string | null;
  isActive?: boolean;
  campaignName?: string | null;
};

export type AdminDlcKeyringEntry = {
  id: string;
  keyVersion: number;
  isActive: boolean;
  createdAtIso: string | null;
  rotatedAtIso: string | null;
};
