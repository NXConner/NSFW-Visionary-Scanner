import React from "react";
import { Check, Crown, Star, Zap } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { FEATURE_COMPARISON_ROWS, type FeatureIconKey, type PlanTierKey } from "../data";

const ICONS: Record<
  FeatureIconKey,
  { Icon: React.ComponentType<{ className?: string }>; className: string }
> = {
  zap: { Icon: Zap, className: "text-blue-500" },
  star: { Icon: Star, className: "text-yellow-500" },
  crown: { Icon: Crown, className: "text-purple-500" },
};

function AvailabilityCell({ enabled }: { enabled: boolean }) {
  return enabled ? (
    <Check className="h-5 w-5 text-green-500 mx-auto" />
  ) : (
    <span className="text-muted-foreground">—</span>
  );
}

function FeatureLabel({ label, icon }: { label: string; icon?: FeatureIconKey }) {
  if (!icon) return <span>{label}</span>;
  const { Icon, className } = ICONS[icon];
  return (
    <span className="flex items-center gap-2">
      <Icon className={`h-4 w-4 ${className}`} />
      {label}
    </span>
  );
}

export function FeatureComparisonSection() {
  const planOrder: PlanTierKey[] = ["free", "pro", "premium"];

  return (
    <Card className="max-w-6xl mx-auto mb-16">
      <CardHeader>
        <CardTitle className="text-center">Compare All Features</CardTitle>
        <CardDescription className="text-center">
          Everything you need for comprehensive men's health tracking
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-4 px-6 font-semibold">Features</th>
                <th className="text-center py-4 px-6 font-semibold">Free</th>
                <th className="text-center py-4 px-6 font-semibold">Pro</th>
                <th className="text-center py-4 px-6 font-semibold">Premium</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {FEATURE_COMPARISON_ROWS.map((row, idx) => {
                const zebra = idx % 2 === 1;
                return (
                  <tr key={row.label} className={zebra ? "bg-gray-50 dark:bg-gray-800" : undefined}>
                    <td className="py-4 px-6 font-medium">
                      <FeatureLabel label={row.label} icon={row.icon} />
                    </td>
                    {planOrder.map(plan => (
                      <td key={plan} className="text-center py-4">
                        <AvailabilityCell enabled={Boolean(row.tiers[plan])} />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
