import React from "react";
import { Globe, Store } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function PricingHeader({
  channel,
  priceType,
  onPriceTypeChange,
  billingInterval,
  onBillingIntervalChange,
}: {
  channel: string;
  priceType: "subscription" | "one-time";
  onPriceTypeChange: (v: "subscription" | "one-time") => void;
  billingInterval: "month" | "year";
  onBillingIntervalChange: (v: "month" | "year") => void;
}) {
  return (
    <div className="text-center mb-12">
      <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
      <p className="text-xl text-muted-foreground mb-8">
        Unlock advanced AI features and comprehensive health tracking
      </p>

      {/* Distribution Channel Badge */}
      <div className="flex items-center justify-center gap-2 mb-4">
        {channel === "store" ? (
          <Badge variant="outline" className="gap-2">
            <Store className="w-4 h-4" />
            Store Version
          </Badge>
        ) : (
          <Badge variant="outline" className="gap-2">
            <Globe className="w-4 h-4" />
            Direct Download
          </Badge>
        )}
      </div>

      {/* Price Type Tabs */}
      <Tabs value={priceType} onValueChange={v => onPriceTypeChange(v as any)} className="mb-8">
        <TabsList className="inline-flex">
          <TabsTrigger value="subscription">Subscriptions</TabsTrigger>
          <TabsTrigger value="one-time">One-Time Purchases</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Billing Toggle (only for subscriptions) */}
      {priceType === "subscription" ? (
        <div className="inline-flex items-center bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm mb-8">
          <button
            type="button"
            onClick={() => onBillingIntervalChange("month")}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              billingInterval === "month"
                ? "bg-blue-500 text-white"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => onBillingIntervalChange("year")}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors relative ${
              billingInterval === "year"
                ? "bg-blue-500 text-white"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
            }`}
          >
            Yearly
            <Badge className="absolute -top-2 -right-2 bg-green-500 text-xs">Save 20%</Badge>
          </button>
        </div>
      ) : null}
    </div>
  );
}
