import React from "react";
import { Link, useInRouterContext } from "react-router-dom";
import { ChevronRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

export function UnlockPremiumCta({
  to = "/store",
  label = "Unlock Premium",
}: {
  to?: string;
  label?: string;
}): JSX.Element {
  const inRouter = useInRouterContext();

  if (!inRouter) {
    return (
      <Button
        size="lg"
        className="gap-2"
        onClick={() => {
          try {
            if (typeof window !== "undefined") window.location.assign(to);
          } catch {
            // ignore
          }
        }}
      >
        <Sparkles className="w-5 h-5" />
        {label}
        <ChevronRight className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <Button size="lg" className="gap-2" asChild>
      <Link to={to} aria-label={label}>
        <Sparkles className="w-5 h-5" />
        {label}
        <ChevronRight className="w-4 h-4" />
      </Link>
    </Button>
  );
}
