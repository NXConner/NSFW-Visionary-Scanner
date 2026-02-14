import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RouteTopNav } from "@/components/navigation/RouteTopNav";
import { useUserRoles } from "@/hooks/useUserRoles";
import { StripeCatalogMappingPanel } from "@/components/admin/stripeCatalog";

export default function AdminCommerce(): React.ReactElement {
  const { isAdmin, isLoading } = useUserRoles();

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <RouteTopNav title="Admin — Commerce" badge="Admin" />
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <Card className="glass-card border-border/50">
            <CardContent className="py-10 text-center text-muted-foreground">Loading…</CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen">
        <RouteTopNav title="Admin — Commerce" />
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle>Admin Commerce</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">Admin access required.</CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <RouteTopNav title="Admin — Commerce" badge="Admin" />
      <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        <Tabs defaultValue="premium" className="space-y-4">
          <TabsList className="grid grid-cols-1 md:grid-cols-3 w-full">
            <TabsTrigger value="premium">Premium Content</TabsTrigger>
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
            <TabsTrigger value="routines">Routine Marketplace</TabsTrigger>
          </TabsList>

          <TabsContent value="premium">
            <StripeCatalogMappingPanel
              title="Premium Content — Stripe Catalog Mapping"
              itemLabel="content items"
              functionName="admin-premium-content-catalog"
            />
          </TabsContent>

          <TabsContent value="marketplace">
            <StripeCatalogMappingPanel
              title="Marketplace — Stripe Catalog Mapping"
              itemLabel="marketplace items"
              functionName="admin-marketplace-items-catalog"
            />
          </TabsContent>

          <TabsContent value="routines">
            <StripeCatalogMappingPanel
              title="Routine Marketplace — Stripe Catalog Mapping"
              itemLabel="routine items"
              functionName="admin-routine-marketplace-catalog"
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
