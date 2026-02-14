import React from "react";

import { Button } from "@/components/ui/button";

export function IncognitoChartFrame({
  incognito,
  revealed,
  onReveal,
  children,
}: {
  incognito: boolean;
  revealed: boolean;
  onReveal: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <div className={incognito && !revealed ? "blur-md pointer-events-none select-none" : ""}>
        {children}
      </div>
      {incognito && !revealed ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <Button type="button" variant="secondary" onClick={onReveal}>
            Tap to reveal
          </Button>
        </div>
      ) : null}
    </div>
  );
}
