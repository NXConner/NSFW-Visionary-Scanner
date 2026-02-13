export type DLCUpdateType = "major" | "minor" | "patch" | "content";

export type DLCUpdatePolicy = "notify" | "auto" | "required";

export type DLCUpdate = {
  packageId: string;
  currentVersion: string;
  latestVersion: string;
  updateType: DLCUpdateType;
  updatePolicy: DLCUpdatePolicy;
  changelog: string[];
  downloadSizeBytes: number;
  isRequired: boolean;
  releaseDate?: Date;
};

