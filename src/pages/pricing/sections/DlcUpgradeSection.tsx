import React from "react";
import { Link } from "react-router-dom";
import { Check, Key } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice, type PricingTier } from "@/lib/pricing";

export function DlcUpgradeSection({ dlcOptions }: { dlcOptions: PricingTier[] }) {
  if (!dlcOptions.length) return null;

  return (
    <Card className="max-w-4xl mx-auto mb-16 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="w-5 h-5" />
          Adult Content Upgrade (DLC)
        </CardTitle>
        <CardDescription>
          Unlock adult content and features with a one-time DLC purchase
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          {dlcOptions.map(dlc => (
            <Card key={dlc.id} className="border-2">
              <CardHeader>
                <CardTitle className="text-xl">{dlc.name}</CardTitle>
                <div className="text-3xl font-bold gradient-text mt-2">
                  {formatPrice(dlc.price)}
                </div>
                <Badge variant="outline" className="mt-2">
                  {dlc.distributionChannel === "store" ? "Store User" : "Direct User"}
                </Badge>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-4">
                  {dlc.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button asChild className="w-full" variant="gradient">
                  <Link to="/dlc">Purchase DLC</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
