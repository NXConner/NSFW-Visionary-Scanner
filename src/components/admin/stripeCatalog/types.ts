export type StripeCatalogItem = {
  id: string;
  displayName: string;
  priceValue: number;
  currency: string;
  priceType: string;
  isActive: boolean;
  isApproved?: boolean;
  stripePriceId: string | null;
  stripeProductId: string | null;
  // Optional informational fields (table-specific)
  contentType?: string;
  itemType?: string;
  category?: string;
};
