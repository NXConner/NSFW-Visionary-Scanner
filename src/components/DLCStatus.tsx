/**
 * DLC Status Component
 * Displays current DLC license status in settings or profile
 */

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock, Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { useDLC } from "@/dlc/context/DLCContext";
import { DLCDeviceManager } from "@/components/dlc/user/DLCDeviceManager";

export const DLCStatus = () => {
  const { isLoading, ownedPackages, checkForUpdates, availableUpdates, refresh } = useDLC();
  const [devicesOpen, setDevicesOpen] = useState(false);

  const hasAnyLicense = ownedPackages.length > 0;

  const activeLicenseSummaries = useMemo(() => {
    return ownedPackages
      .map(p => ({
        packageId: p.packageId,
        packageName: p.packageName,
        version: p.version,
        contentVersion: p.contentVersion,
      }))
      .sort((a, b) => a.packageName.localeCompare(b.packageName));
  }, [ownedPackages]);

  const hasUpdates = availableUpdates.length > 0;

  const handleCheckUpdates = async () => {
    try {
      await checkForUpdates();
      toast.success("Checked for DLC updates");
    } catch (err) {
      logger.error("Failed to check DLC updates", { error: err });
      toast.error("Failed to check for updates");
    }
  };

  const handleRestorePurchases = async () => {
    try {
      await refresh();
      toast.success("Purchases restored (refreshed from server)");
    } catch (err) {
      logger.error("Failed to restore purchases", { error: err });
      toast.error("Failed to restore purchases");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasAnyLicense) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>NSFW Content</CardTitle>
          <CardDescription>DLC license status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Not unlocked</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Purchase the NSFW DLC upgrade to unlock adult content and features
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
            <Button variant="outline" onClick={handleRestorePurchases}>
              Restore Purchases
            </Button>
            <Button variant="outline" onClick={() => setDevicesOpen(true)}>
              Manage Devices
            </Button>
          </div>

          <DLCDeviceManager open={devicesOpen} onOpenChange={setDevicesOpen} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>NSFW Content</span>
          <Badge variant="default">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Active
          </Badge>
        </CardTitle>
        <CardDescription>DLC license status</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {activeLicenseSummaries.map(pkg => (
            <div key={pkg.packageId} className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{pkg.packageName}</span>
              <span className="font-medium">{pkg.contentVersion ?? pkg.version ?? "1.0.0"}</span>
            </div>
          ))}
        </div>

        {hasUpdates && (
          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-blue-900 dark:text-blue-100">Update available</span>
            </div>
            <Badge variant="secondary">{availableUpdates.length}</Badge>
          </div>
        )}

        <Button variant="outline" onClick={handleCheckUpdates} className="w-full">
          <RefreshCw className="w-4 h-4 mr-2" />
          Check for Updates
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <Button variant="outline" onClick={handleRestorePurchases}>
            Restore Purchases
          </Button>
          <Button variant="outline" onClick={() => setDevicesOpen(true)}>
            Manage Devices
          </Button>
        </div>

        <DLCDeviceManager open={devicesOpen} onOpenChange={setDevicesOpen} />
      </CardContent>
    </Card>
  );
};
