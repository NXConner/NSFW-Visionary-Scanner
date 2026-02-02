import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, MessageSquare, Headphones, X } from "lucide-react";

export function StatusBadge({ status }: { status: string }) {
  const variants: Record<
    string,
    { variant: "default" | "secondary" | "destructive" | "outline"; Icon: typeof MessageSquare }
  > = {
    active: { variant: "default", Icon: MessageSquare },
    waiting: { variant: "default", Icon: Clock },
    assigned: { variant: "outline", Icon: Headphones },
    resolved: { variant: "outline", Icon: CheckCircle },
    closed: { variant: "secondary", Icon: X },
  };

  const cfg = variants[status] || { variant: "default" as const, Icon: MessageSquare };
  const Icon = cfg.Icon;

  return (
    <Badge variant={cfg.variant}>
      <Icon className="w-3 h-3 mr-1" />
      {String(status).toUpperCase()}
    </Badge>
  );
}
