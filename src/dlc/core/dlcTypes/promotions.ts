export type PromoCode = {
  id: string;
  code: string;
  description?: string;
  discountType: "percentage" | "fixed" | "free";
  discountValue: number;
  appliesTo: string[]; // packageId[]
  isActive: boolean;
  validFrom?: Date;
  validUntil?: Date;
};

export type GiftCode = {
  id: string;
  code: string;
  packageId: string;
  isRedeemed?: boolean;
  redeemedBy?: string;
  redeemedAt?: Date;
  expiresAt?: Date;
  isActive: boolean;
};

