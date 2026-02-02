import { Badge } from "@/components/ui/badge";
import type { LucideIcon } from "lucide-react";
import { AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";

export function StatusBadge({ status }: { status: string }) {
  const variants: Record<
    string,
    { variant: "default" | "secondary" | "destructive" | "outline"; icon?: LucideIcon }
  > = {
    open: { variant: "default", icon: AlertCircle },
    in_progress: { variant: "default", icon: Clock },
    pending: { variant: "default", icon: Clock },
    resolved: { variant: "outline", icon: CheckCircle },
    confirmed: { variant: "outline", icon: CheckCircle },
    completed: { variant: "outline", icon: CheckCircle },
    closed: { variant: "secondary", icon: XCircle },
    cancelled: { variant: "destructive", icon: XCircle },
  };

  const config = variants[status] || { variant: "default" as const };
  const Icon = config.icon;

  return (
    <Badge variant={config.variant}>
      {Icon ? <Icon className="w-3 h-3 mr-1" /> : null}
      {status.replace(/_/g, " ").toUpperCase()}
    </Badge>
  );
}
