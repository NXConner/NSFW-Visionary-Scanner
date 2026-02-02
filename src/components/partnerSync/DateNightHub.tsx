import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/contexts/AuthContext";
import { usePartnerConnection } from "@/lib/partnerSync/usePartnerConnection";
import { usePartnerConsent } from "@/lib/partnerSync/usePartnerConsent";
import { useDateNights } from "@/lib/partnerSync/useDateNights";
import { DateNightForm } from "./dateNights/DateNightForm";
import { DateNightList } from "./dateNights/DateNightList";
import {
  CalendarHeart,
  Calendar,
  ListChecks,
  History,
  Plus,
  Sparkles,
  Clock,
  MapPin,
  Users,
} from "lucide-react";

type DateNightHubProps = {
  initialTab?: "planner" | "templates" | "history";
};

export function DateNightHub({ initialTab = "planner" }: DateNightHubProps) {
  const { t } = useI18n();
  const { user } = useAuth();
  const { activeConnection, currentUserId, loading: connectionLoading } = usePartnerConnection();
  const connectionId = activeConnection?.id ?? null;
  const partnerId = activeConnection
    ? activeConnection.user_id === currentUserId
      ? activeConnection.partner_id
      : activeConnection.user_id
    : null;
  
  const { needsConsent, partnerNeedsConsent, loading: consentLoading } = usePartnerConsent(connectionId);
  const consentReady = !needsConsent && !partnerNeedsConsent;
  
  const [activeTab, setActiveTab] = useState(initialTab);

  const {
    proposals,
    details,
    templates,
    loading,
    createPlan,
    saveTemplate,
    respond,
    respondWithModification,
    addReflection,
    clonePlan,
    loadMore,
  } = useDateNights(partnerId);

  const isLoading = connectionLoading || consentLoading;

  // Stats for dashboard
  const pendingCount = proposals.filter(p => p.proposal_status === "pending").length;
  const acceptedCount = proposals.filter(p => p.proposal_status === "accepted").length;
  const upcomingDates = proposals.filter(p => {
    const dateTime = new Date(`${p.proposed_date}T${p.proposed_time}`);
    return p.proposal_status === "accepted" && dateTime > new Date();
  });

  if (!user) {
    return (
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            {t("partnerSync.dates.signInRequired")}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!partnerId && !isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarHeart className="h-5 w-5 text-primary" />
            {t("partnerSync.dates.title")}
          </CardTitle>
          <CardDescription>{t("partnerSync.dates.connectHint")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full">
            <Users className="h-4 w-4 mr-2" />
            {t("partnerSync.link.connectPartner")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!consentReady && !isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarHeart className="h-5 w-5 text-primary" />
            {t("partnerSync.dates.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            {t("partnerSync.settings.consentNeeded")}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats Dashboard */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass-card border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">{t("partnerSync.dates.pending")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/50">
                <CalendarHeart className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{acceptedCount}</p>
                <p className="text-xs text-muted-foreground">{t("partnerSync.dates.accepted")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/50">
                <ListChecks className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{templates.length}</p>
                <p className="text-xs text-muted-foreground">{t("partnerSync.dates.templates")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <MapPin className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{upcomingDates.length}</p>
                <p className="text-xs text-muted-foreground">{t("partnerSync.dates.upcoming")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="planner" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{t("partnerSync.dates.newPlan")}</span>
            <span className="sm:hidden">New</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            <span className="hidden sm:inline">{t("partnerSync.dates.templates")}</span>
            <span className="sm:hidden">Templates</span>
            {templates.length > 0 && (
              <Badge variant="secondary" className="ml-1 hidden sm:inline-flex">
                {templates.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">{t("partnerSync.dates.history")}</span>
            <span className="sm:hidden">History</span>
            {proposals.length > 0 && (
              <Badge variant="secondary" className="ml-1 hidden sm:inline-flex">
                {proposals.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="planner" className="space-y-4">
          <DateNightForm
            partnerId={partnerId}
            templates={templates}
            loading={loading}
            onSubmit={createPlan}
            onSaveTemplate={saveTemplate}
          />
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {t("partnerSync.dates.savedTemplates")}
              </CardTitle>
              <CardDescription>{t("partnerSync.dates.templatesDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              {templates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ListChecks className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>{t("partnerSync.dates.noTemplates")}</p>
                  <p className="text-sm mt-1">{t("partnerSync.dates.createTemplateHint")}</p>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {templates.map((template) => (
                    <Card key={template.id} className="border border-border/60">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{template.template_name}</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              {template.default_duration_minutes
                                ? `${template.default_duration_minutes} min`
                                : t("partnerSync.dates.noDuration")}
                              {template.default_location_type &&
                                ` • ${template.default_location_type}`}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setActiveTab("planner")}
                          >
                            {t("partnerSync.dates.useTemplate")}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <DateNightList
            proposals={proposals}
            details={details}
            currentUserId={user?.id ?? null}
            loading={loading}
            onRespond={respond}
            onModify={respondWithModification}
            onClone={clonePlan}
            onAddReflection={addReflection}
            onLoadMore={loadMore}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
