export type DLCBundleManifest = {
  id: string;
  name: string;
  packageId: string;
  description?: string;
  includedPackages: string[];
  displayOrder?: number;
  isFeatured?: boolean;
  contentRating?: string;
};
