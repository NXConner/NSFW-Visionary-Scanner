/**
 * DLC Unlock Component (Legacy route wrapper)
 * The app now uses the unified DLC system under `src/dlc/*`.
 */

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LicenseActivation } from "@/dlc/components/LicenseActivation";

export const DLCUnlock = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Redeem DLC Code</CardTitle>
        <CardDescription>
          Enter your license/gift code to activate and install premium add-ons.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LicenseActivation />
      </CardContent>
    </Card>
  );
};
