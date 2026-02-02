import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { getAppVersion } from "@/lib/featureFlags";
import { useDLC } from "@/dlc/context/DLCContext";

type Props = {
  className?: string;
};

const isAdultRated = (rating: unknown): boolean => rating === "18+" || rating === "adult";

/**
 * Centered neon sign indicating whether adult content is present.
 *
 * Rules:
 * - Show NSFW sign if the build is nsfw OR any adult-rated package is owned/installed.
 * - Otherwise show SFW sign.
 */
export function ContentRatingNeonSign({ className }: Props) {
  const { ownedPackages, installedPackages } = useDLC();

  const { showNSFW } = useMemo(() => {
    const version = getAppVersion();
    const isNsfwBuild = version === "nsfw";

    const packages = [...ownedPackages, ...installedPackages];
    const hasAdultPackages = packages.some(p =>
      isAdultRated((p as unknown as { contentRating?: unknown }).contentRating),
    );

    return {
      showNSFW: Boolean(isNsfwBuild || hasAdultPackages),
    };
  }, [ownedPackages, installedPackages]);

  if (showNSFW) {
    return (
      <div
        className={cn(
          "neon-sign-frame neon-sign-red animate-neon-glow",
          "px-4 py-1.5 rounded-xl select-none text-center text-sm sm:text-base font-extrabold tracking-[0.18em] uppercase",
          className,
        )}
        role="status"
        aria-live="polite"
      >
        NSFW — ADULTS ONLY — 18+
      </div>
    );
  }

  return (
    <div
      className={cn(
        "neon-sign-frame neon-sign-blue animate-neon-glow",
        "px-4 py-1.5 rounded-xl select-none text-center text-sm sm:text-base font-extrabold tracking-[0.18em] uppercase",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      SFW — SAFE
    </div>
  );
}
