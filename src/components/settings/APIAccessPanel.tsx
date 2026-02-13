/**
 * API Access (Settings panel)
 *
 * Legacy note:
 * - The original implementation used localStorage + simulated deliveries.
 * - The app now uses the Supabase-backed API/Webhooks system (api_keys + webhooks + deliveries).
 *
 * This component remains as a stable settings-panel entrypoint and renders the
 * real API/Webhooks UI.
 */

import * as React from "react";
import { APIWebhooks } from "@/components/APIWebhooks";
import { cn } from "@/lib/utils";

export function APIAccessPanel({ className }: { className?: string }): JSX.Element {
  return (
    <div className={cn("space-y-4", className)}>
      <APIWebhooks />
    </div>
  );
}
