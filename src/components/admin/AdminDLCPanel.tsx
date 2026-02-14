/**
 * Admin DLC Panel
 *
 * Real admin tooling backed by Supabase Edge Functions:
 * - admin-dlc-catalog: list/update packages + Stripe mappings
 * - admin-dlc-promos: manage promo codes used by DLC checkout
 * - admin-import-dlc-content: bulk import positions/videos/topics assets + rows
 * - admin-dlc-toggles: enable/disable NSFW add-ons (build-dependent)
 *
 * This intentionally ships with NO mock/sample datasets.
 */

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserRoles } from "@/hooks/useUserRoles";
import { DLCContentImport } from "@/components/dlc/admin/DLCContentImport";
import { BUILD_ALLOW_ADULT_BUNDLE } from "@/lib/buildFlags";
import { AdminDlcPackagesCard } from "@/components/admin/dlc/AdminDlcPackagesCard";
import { AdminDlcPromoCodesCard } from "@/components/admin/dlc/AdminDlcPromoCodesCard";

const LazyAdminAdultToggles = React.lazy(() =>
  import("@/components/dlc/admin/AdminNsfwDlcToggles").then(m => ({
    default: m.AdminNsfwDlcToggles,
  })),
);

export function AdminDLCPanel(): JSX.Element {
  const { isAdmin, isLoading } = useUserRoles();

  if (isLoading) {
    return (
      <Card className="glass-card border-border/50">
        <CardContent className="py-10 text-center text-muted-foreground">Loading…</CardContent>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle>Admin DLC</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">Admin access required.</CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="packages">
      <TabsList className="flex flex-wrap">
        <TabsTrigger value="packages">Packages</TabsTrigger>
        <TabsTrigger value="promos">Promo Codes</TabsTrigger>
        <TabsTrigger value="import">Content Import</TabsTrigger>
        {BUILD_ALLOW_ADULT_BUNDLE ? <TabsTrigger value="nsfw">NSFW Toggles</TabsTrigger> : null}
      </TabsList>

      <TabsContent value="packages" className="mt-6">
        <AdminDlcPackagesCard />
      </TabsContent>

      <TabsContent value="promos" className="mt-6">
        <AdminDlcPromoCodesCard />
      </TabsContent>

      <TabsContent value="import" className="mt-6">
        <DLCContentImport />
      </TabsContent>

      {BUILD_ALLOW_ADULT_BUNDLE ? (
        <TabsContent value="nsfw" className="mt-6">
          <React.Suspense fallback={null}>
            <LazyAdminAdultToggles />
          </React.Suspense>
        </TabsContent>
      ) : null}
    </Tabs>
  );
}
