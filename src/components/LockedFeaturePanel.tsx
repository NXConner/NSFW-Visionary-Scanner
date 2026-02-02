import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Lock } from "lucide-react";

export function LockedFeaturePanel({
  feature,
  tier,
  description,
}: {
  feature: string;
  tier: string;
  description?: string;
}): JSX.Element {
  return (
    <Card className="glass-card border-border/50">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="p-4 rounded-full bg-muted/30 mb-4">
          <Lock className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">{feature}</h3>
        <p className="text-muted-foreground max-w-md mb-4">
          {description ?? `This feature requires a ${tier} subscription. Upgrade to unlock.`}
        </p>
        <Badge variant="secondary">Requires {tier}</Badge>
      </CardContent>
    </Card>
  );
}
