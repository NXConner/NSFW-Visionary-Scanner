import * as React from "react";
import { Suspense } from "react";

import { PageSkeleton } from "@/components/ui/skeleton-loader";
import { LockedFeaturePanel } from "@/components/LockedFeaturePanel";

export type FeatureAccessFn = (feature: string) => boolean;

export function SectionWrap({
  children,
  maxWidth = "max-w-6xl",
  className,
}: {
  children: React.ReactNode;
  maxWidth?: string;
  className?: string;
}): JSX.Element {
  return (
    <section className={["min-h-screen px-4 py-20", className].filter(Boolean).join(" ")}>
      <div className={`container mx-auto ${maxWidth}`}>{children}</div>
    </section>
  );
}

export function Suspended({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}): JSX.Element {
  return <Suspense fallback={fallback ?? <PageSkeleton />}>{children}</Suspense>;
}

export function LockedFeature({ feature, tier }: { feature: string; tier: string }): JSX.Element {
  return (
    <SectionWrap maxWidth="max-w-4xl">
      <LockedFeaturePanel feature={feature} tier={tier} />
    </SectionWrap>
  );
}
