import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, Shield } from "lucide-react";
import { toast } from "sonner";
import { useNsfwConsent } from "@/hooks/useNsfwConsent";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";

type NsfwConsentGateProps = {
  featureIds: string[];
  title?: string;
  description?: string;
  children: React.ReactNode;
};

export function NsfwConsentGate({
  featureIds,
  title = "Consent Required",
  description = "Please review and accept the consent statements below to continue.",
  children,
}: NsfwConsentGateProps): JSX.Element {
  const {
    isSuperAdmin,
    hasFullAccess,
    allFeaturesUnlocked,
    loading: authLoading,
    rolesLoading,
  } = useAuth();
  const { isAdmin, isSuperAdmin: isSuperAdminRole, isLoading: rolesHookLoading } = useUserRoles();
  const isPrivileged =
    isSuperAdmin || hasFullAccess || allFeaturesUnlocked || isAdmin || isSuperAdminRole;
  // Guard against accidental empty featureIds lists (would otherwise skip policy selection and
  // incorrectly show "policies unavailable").
  const effectiveFeatureIds = featureIds.length > 0 ? featureIds : ["nsfw"];
  const { loading, load, requiredPolicies, missingPolicies, hasConsent, acceptAll } =
    useNsfwConsent(effectiveFeatureIds);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setChecked(new Set());
  }, [missingPolicies.length]);

  const allChecked = useMemo(() => {
    if (missingPolicies.length === 0) return true;
    return missingPolicies.every(p => checked.has(p.policy_key));
  }, [checked, missingPolicies]);

  if (authLoading || rolesLoading || rolesHookLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="glass-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="w-10 h-10 text-muted-foreground animate-spin mb-4" />
            <p className="text-muted-foreground">Loading consent requirements…</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isPrivileged) return <>{children}</>;

  if (hasConsent) return <>{children}</>;

  if (requiredPolicies.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Consent Required
            </CardTitle>
            <CardDescription>
              Consent policies are unavailable for this environment. Please try again later.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button variant="outline" onClick={() => void load()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-4">
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>

      <div className="space-y-3">
        {missingPolicies.map(policy => (
          <Card key={policy.policy_key} className="border border-border/50">
            <CardHeader className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base">{policy.title}</CardTitle>
                <Badge variant="secondary">v{policy.version}</Badge>
              </div>
              {policy.summary ? (
                <CardDescription className="text-sm">{policy.summary}</CardDescription>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground whitespace-pre-line">{policy.body}</p>
              <div className="flex items-center gap-2 text-sm">
                {(() => {
                  const consentId = `consent-${policy.policy_key}`;
                  return (
                    <>
                      <Checkbox
                        id={consentId}
                        checked={checked.has(policy.policy_key)}
                        onCheckedChange={value => {
                          setChecked(prev => {
                            const next = new Set(prev);
                            if (value) next.add(policy.policy_key);
                            else next.delete(policy.policy_key);
                            return next;
                          });
                        }}
                      />
                      <Label htmlFor={consentId} className="text-sm">
                        I agree to this consent statement.
                      </Label>
                    </>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border border-border/50">
        <CardContent className="py-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            You must accept all required consent statements to continue.
          </div>
          <Button
            onClick={async () => {
              if (!allChecked) {
                toast.error("Please accept all consent statements to continue");
                return;
              }
              const ok = await acceptAll();
              if (ok) toast.success("Consent saved");
              else toast.error("Unable to save consent");
            }}
            disabled={!allChecked}
          >
            Accept & Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
