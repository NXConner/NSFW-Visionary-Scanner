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

import React, { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserRoles } from "@/hooks/useUserRoles";
import { DLCContentImport } from "@/components/dlc/admin/DLCContentImport";
import { BUILD_ALLOW_ADULT_BUNDLE } from "@/lib/buildFlags";
import { AdminDlcPackagesCard } from "@/components/admin/dlc/AdminDlcPackagesCard";
import { AdminDlcPromoCodesCard } from "@/components/admin/dlc/AdminDlcPromoCodesCard";
import { AdminDlcKeyringCard } from "@/components/admin/dlc/AdminDlcKeyringCard";

const LazyAdminAdultToggles = React.lazy(() =>
  import("@/components/dlc/admin/AdminNsfwDlcToggles").then(m => ({
    default: m.AdminNsfwDlcToggles,
  })),
);

type AdminDlcTab = "packages" | "promos" | "import" | "keys" | "nsfw";

export function AdminDLCPanel(props?: { initialTab?: AdminDlcTab }): JSX.Element {
  const { isAdmin, isLoading } = useUserRoles();
  const allowedTabs: AdminDlcTab[] = BUILD_ALLOW_ADULT_BUNDLE
    ? ["packages", "promos", "import", "keys", "nsfw"]
    : ["packages", "promos", "import", "keys"];
  const desired = props?.initialTab ?? "packages";
  const resolvedInitial: AdminDlcTab = allowedTabs.includes(desired) ? desired : "packages";

  const [tab, setTab] = useState<AdminDlcTab>(resolvedInitial);

  useEffect(() => {
    setTab(resolvedInitial);
  }, [resolvedInitial]);

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
    <Tabs
      value={tab}
      onValueChange={v => {
        if (allowedTabs.includes(v as AdminDlcTab)) setTab(v as AdminDlcTab);
      }}
    >
      <TabsList className="flex flex-wrap">
        <TabsTrigger value="packages">Packages</TabsTrigger>
        <TabsTrigger value="promos">Promo Codes</TabsTrigger>
        <TabsTrigger value="import">Content Import</TabsTrigger>
        <TabsTrigger value="keys">Keys</TabsTrigger>
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

      <TabsContent value="keys" className="mt-6">
        <AdminDlcKeyringCard />
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
