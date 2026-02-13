import React, { Suspense } from "react";
import { useUserRoles } from "@/hooks/useUserRoles";
import { RouteTopNav } from "@/components/navigation/RouteTopNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DLCContentImport } from "@/components/dlc/admin/DLCContentImport";
import { ContentModerationPanel } from "@/components/admin/ContentModerationPanel";
import { NsfwVideoContentAdminPanel } from "@/components/admin/nsfw/NsfwVideoContentAdminPanel";
import { NsfwTopicLibraryAdminPanel } from "@/components/admin/nsfw/NsfwTopicLibraryAdminPanel";
import { NsfwConsentPolicyAdminPanel } from "@/components/admin/nsfw/NsfwConsentPolicyAdminPanel";

export default function AdminNsfwContent(): React.ReactElement {
  const { isAdmin, isLoading } = useUserRoles();

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <RouteTopNav title="Admin — NSFW" badge="Admin" />
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
        <RouteTopNav title="Admin — NSFW" />
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle>Admin NSFW</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">Admin access required.</CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <RouteTopNav title="Admin — NSFW" badge="Admin" />
      <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        <Tabs defaultValue="videos" className="space-y-4">
          <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full">
            <TabsTrigger value="videos">Video Library</TabsTrigger>
            <TabsTrigger value="topics">Topics Library</TabsTrigger>
            <TabsTrigger value="consent">Consent Policies</TabsTrigger>
            <TabsTrigger value="moderation">Moderation</TabsTrigger>
            <TabsTrigger value="import">Content Import</TabsTrigger>
          </TabsList>

          <TabsContent value="videos">
            <NsfwVideoContentAdminPanel />
          </TabsContent>
          <TabsContent value="topics">
            <NsfwTopicLibraryAdminPanel />
          </TabsContent>
          <TabsContent value="consent">
            <NsfwConsentPolicyAdminPanel />
          </TabsContent>
          <TabsContent value="moderation">
            <ContentModerationPanel />
          </TabsContent>
          <TabsContent value="import">
            <Suspense
              fallback={
                <Card className="glass-card border-border/50">
                  <CardContent className="py-10 text-center text-muted-foreground">
                    Loading import tools…
                  </CardContent>
                </Card>
              }
            >
              <DLCContentImport />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
