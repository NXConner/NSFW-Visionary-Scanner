import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LicensorManager } from "./LicensorManager";
import { LicenseManager } from "./LicenseManager";
import type { ContentLicensor, LicenseCoverageSummary, LicenseWithLicensor } from "@/lib/nsfwLicensing/types";
import { getLicenseCoverageSummary, listLicensors, listLicenses } from "@/lib/nsfwLicensing/api";

export function NsfwLicensingAdminPanel(): JSX.Element {
  const [loading, setLoading] = useState(false);
  const [licensors, setLicensors] = useState<ContentLicensor[]>([]);
  const [licenses, setLicenses] = useState<LicenseWithLicensor[]>([]);
  const [summary, setSummary] = useState<LicenseCoverageSummary>({
    totalVideos: 0,
    missingLicense: 0,
    unverifiedLicense: 0,
  });

  const load = useCallback(async () => {
    setLoading(true);
    const [licensorRows, licenseRows, coverage] = await Promise.all([
      listLicensors(),
      listLicenses(),
      getLicenseCoverageSummary(),
    ]);
    setLicensors(licensorRows);
    setLicenses(licenseRows);
    setSummary(coverage);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle>License Coverage</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-border/50 p-3">
            <div className="text-xs text-muted-foreground">Total Videos</div>
            <div className="text-2xl font-semibold">{summary.totalVideos}</div>
          </div>
          <div className="rounded-xl border border-border/50 p-3">
            <div className="text-xs text-muted-foreground">Missing License</div>
            <div className="text-2xl font-semibold">{summary.missingLicense}</div>
          </div>
          <div className="rounded-xl border border-border/50 p-3">
            <div className="text-xs text-muted-foreground">Unverified License</div>
            <div className="text-2xl font-semibold">{summary.unverifiedLicense}</div>
            {summary.unverifiedLicense > 0 ? (
              <Badge variant="destructive" className="mt-2">
                Action required
              </Badge>
            ) : (
              <Badge variant="secondary" className="mt-2">
                All verified
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <LicensorManager rows={licensors} loading={loading} onRefresh={load} />
      <LicenseManager rows={licenses} licensors={licensors} loading={loading} onRefresh={load} />
    </div>
  );
}
