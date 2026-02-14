/**
 * License Activation Component
 * Allows users to activate DLC with a license key
 */

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Key, Check, AlertCircle, Loader2, Gift, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLicenseActivation } from "../hooks/useDLCContent";
import { useDLC } from "../context/DLCContext";
import { toast } from "sonner";

function normalizeLicenseLikeKey(input: string): string {
  const upper = input.toUpperCase();
  // Allow users to paste without dashes/spaces and normalize to AAAA-BBBB-CCCC-DDDD when possible.
  const alnum = upper.replace(/[^A-Z0-9]/g, "");
  if (alnum.length === 16) {
    return `${alnum.slice(0, 4)}-${alnum.slice(4, 8)}-${alnum.slice(8, 12)}-${alnum.slice(12, 16)}`;
  }
  return upper.replace(/[^A-Z0-9-]/g, "");
}

export function LicenseActivation(): React.ReactElement {
  const { activate, isActivating, error, activatedPackageId } = useLicenseActivation();
  const { packages, installPackage } = useDLC();
  const [licenseKey, setLicenseKey] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [giftCode, setGiftCode] = useState("");
  const [activeTab, setActiveTab] = useState("license");

  const activatedPackage = packages.find(p => p.packageId === activatedPackageId);

  const handleActivate = async () => {
    if (!licenseKey.trim()) return;

    const result = await activate(licenseKey.trim().toUpperCase());

    if (result.success && result.packageId) {
      // Auto-install after activation
      await installPackage(result.packageId);
      setLicenseKey("");
    }
  };

  const handlePromoCode = async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) return;

    // This UI is a shortcut: promo codes are applied during checkout.
    // Persist it and send the user to the store where it will be validated and passed to Stripe.
    try {
      window.localStorage.setItem("morphoscan_dlc_pending_promo_code", code);
    } catch {
      // ignore
    }
    toast.info("Promo code saved. Apply it in the store checkout.");
    window.location.href = `/store?promo=${encodeURIComponent(code)}`;
  };

  const handleGiftCode = async () => {
    // Gift code logic - similar to license activation
    if (!giftCode.trim()) return;

    const result = await activate(giftCode.trim().toUpperCase());

    if (result.success && result.packageId) {
      await installPackage(result.packageId);
      setGiftCode("");
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Redeem Code
        </CardTitle>
        <CardDescription>
          Enter your license key, promo code, or gift code to unlock premium features
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="license">
              <Key className="h-4 w-4 mr-1" />
              License
            </TabsTrigger>
            <TabsTrigger value="promo">
              <Tag className="h-4 w-4 mr-1" />
              Promo
            </TabsTrigger>
            <TabsTrigger value="gift">
              <Gift className="h-4 w-4 mr-1" />
              Gift
            </TabsTrigger>
          </TabsList>

          {/* License Key Tab */}
          <TabsContent value="license" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="licenseKey">License Key</Label>
              <Input
                id="licenseKey"
                placeholder="Enter your license key"
                value={licenseKey}
                onChange={e => setLicenseKey(normalizeLicenseLikeKey(e.target.value))}
                disabled={isActivating}
                className="font-mono"
                autoComplete="off"
                spellCheck={false}
                maxLength={19}
              />
              <p className="text-xs text-muted-foreground">
                Format: 4 groups of 4 characters (letters/numbers) separated by dashes.
              </p>
            </div>

            <Button
              onClick={handleActivate}
              disabled={!licenseKey.trim() || isActivating}
              className="w-full"
            >
              {isActivating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Activating...
                </>
              ) : (
                <>
                  <Key className="h-4 w-4 mr-2" />
                  Activate License
                </>
              )}
            </Button>
          </TabsContent>

          {/* Promo Code Tab */}
          <TabsContent value="promo" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="promoCode">Promo Code</Label>
              <Input
                id="promoCode"
                placeholder="Enter promo code"
                value={promoCode}
                onChange={e => setPromoCode(e.target.value.toUpperCase())}
                className="font-mono"
                autoComplete="off"
                spellCheck={false}
              />
              <p className="text-xs text-muted-foreground">
                Enter a promotional code for a discount on your purchase
              </p>
            </div>

            <Button onClick={handlePromoCode} disabled={!promoCode.trim()} className="w-full">
              <Tag className="h-4 w-4 mr-2" />
              Apply Promo Code
            </Button>
          </TabsContent>

          {/* Gift Code Tab */}
          <TabsContent value="gift" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="giftCode">Gift Code</Label>
              <Input
                id="giftCode"
                placeholder="Enter gift code"
                value={giftCode}
                onChange={e => setGiftCode(normalizeLicenseLikeKey(e.target.value))}
                disabled={isActivating}
                className="font-mono"
                autoComplete="off"
                spellCheck={false}
                maxLength={19}
              />
              <p className="text-xs text-muted-foreground">
                Gift codes use the same format as license keys.
              </p>
            </div>

            <Button
              onClick={handleGiftCode}
              disabled={!giftCode.trim() || isActivating}
              className="w-full"
            >
              {isActivating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Redeeming...
                </>
              ) : (
                <>
                  <Gift className="h-4 w-4 mr-2" />
                  Redeem Gift
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>

        {/* Error Alert */}
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Success Alert */}
        {activatedPackage && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Alert className="mt-4 border-green-500 bg-green-500/10">
              <Check className="h-4 w-4 text-green-500" />
              <AlertTitle className="text-green-500">Success!</AlertTitle>
              <AlertDescription>
                <strong>{activatedPackage.packageName}</strong> has been activated and installed.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </CardContent>

      <CardFooter className="flex-col text-center text-sm text-muted-foreground">
        <p>
          Don't have a license key?{" "}
          <a href="/store" className="text-primary hover:underline">
            Visit the store
          </a>
        </p>
      </CardFooter>
    </Card>
  );
}
