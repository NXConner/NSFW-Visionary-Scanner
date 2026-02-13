import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Loader2, XCircle } from "lucide-react";
import type { ElementType } from "react";

type StatusVariant = "default" | "secondary" | "destructive" | "outline";

const STATUS_MAP: Record<
  string,
  { variant: StatusVariant; icon: ElementType | null; label?: string }
> = {
  pending: { variant: "default", icon: Clock },
  queued: { variant: "default", icon: Clock },
  processing: { variant: "default", icon: Loader2, label: "PROCESSING" },
  running: { variant: "default", icon: Loader2, label: "RUNNING" },
  completed: { variant: "outline", icon: CheckCircle },
  success: { variant: "outline", icon: CheckCircle },
  failed: { variant: "destructive", icon: XCircle },
  error: { variant: "destructive", icon: XCircle },
};

export function StatusBadge({ status }: { status: string | null | undefined }): JSX.Element {
  const raw =
    String(status || "")
      .trim()
      .toLowerCase() || "pending";
  const cfg = STATUS_MAP[raw] ?? {
    variant: "secondary" as const,
    icon: null,
    label: raw.toUpperCase(),
  };
  const Icon = cfg.icon;
  const label = cfg.label ?? raw.toUpperCase();

  return (
    <Badge variant={cfg.variant}>
      {Icon && (
        <Icon
          className={`w-3 h-3 mr-1 ${raw === "processing" || raw === "running" ? "animate-spin" : ""}`}
        />
      )}
      {label}
    </Badge>
  );
}
