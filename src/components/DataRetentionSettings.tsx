import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Calendar, Trash2, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { useGenericStorage } from "@/hooks/useGenericStorage";

interface RetentionPreference {
  scan_history: number; // days
  health_diary: number; // days
  auto_cleanup_enabled: boolean;
  notify_before_deletion: boolean;
}

const DEFAULT_RETENTION: RetentionPreference = {
  scan_history: 365, // 1 year
  health_diary: 730, // 2 years
  auto_cleanup_enabled: true,
  notify_before_deletion: true,
};

export const DataRetentionSettings = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useGenericStorage<RetentionPreference>(
    "data_retention_preferences",
    DEFAULT_RETENTION,
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      // Save to Supabase for cloud sync
      const { error } = await supabase.from("user_preferences").upsert(
        {
          user_id: user.id,
          data_retention_preferences: preferences,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        },
      );

      if (error) throw error;

      toast.success("Data retention preferences saved");
      logger.userAction("data_retention_preferences_updated", user.id, { preferences });
    } catch (error) {
      logger.error("Failed to save retention preferences", { error, userId: user.id });
      toast.error("Failed to save preferences");
    } finally {
      setIsSaving(false);
    }
  };

  const retentionOptions = [
    { value: "90", label: "90 days (3 months)" },
    { value: "180", label: "180 days (6 months)" },
    { value: "365", label: "365 days (1 year)" },
    { value: "730", label: "730 days (2 years)" },
    { value: "1095", label: "1095 days (3 years)" },
    { value: "0", label: "Never (keep indefinitely)" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Data Retention Policy
        </CardTitle>
        <CardDescription>
          Configure how long your data is retained. GDPR-compliant automatic cleanup.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Your data will be automatically deleted after the retention period. You'll be notified
            before deletion.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="scan-retention">Scan History Retention</Label>
            <Select
              value={preferences.scan_history.toString()}
              onValueChange={value =>
                setPreferences({ ...preferences, scan_history: parseInt(value) })
              }
            >
              <SelectTrigger id="scan-retention">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {retentionOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Scans older than this period will be automatically deleted.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="diary-retention">Health Diary Retention</Label>
            <Select
              value={preferences.health_diary.toString()}
              onValueChange={value =>
                setPreferences({ ...preferences, health_diary: parseInt(value) })
              }
            >
              <SelectTrigger id="diary-retention">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {retentionOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Diary entries older than this period will be automatically deleted.
            </p>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
            <div className="space-y-1">
              <Label htmlFor="auto-cleanup">Automatic Cleanup</Label>
              <p className="text-xs text-muted-foreground">
                Automatically delete data after retention period
              </p>
            </div>
            <input
              type="checkbox"
              id="auto-cleanup"
              checked={preferences.auto_cleanup_enabled}
              onChange={e =>
                setPreferences({ ...preferences, auto_cleanup_enabled: e.target.checked })
              }
              className="w-4 h-4"
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
            <div className="space-y-1">
              <Label htmlFor="notify-before">Notify Before Deletion</Label>
              <p className="text-xs text-muted-foreground">
                Receive email notification before data is deleted
              </p>
            </div>
            <input
              type="checkbox"
              id="notify-before"
              checked={preferences.notify_before_deletion}
              onChange={e =>
                setPreferences({ ...preferences, notify_before_deletion: e.target.checked })
              }
              className="w-4 h-4"
            />
          </div>
        </div>

        <div className="p-4 rounded-lg bg-muted/30 space-y-2">
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium mb-1">GDPR Compliance</p>
              <p className="text-muted-foreground">
                Automatic data retention ensures compliance with GDPR requirements for data
                minimization. You can always export your data before it's deleted.
              </p>
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving ? "Saving..." : "Save Preferences"}
        </Button>
      </CardContent>
    </Card>
  );
};
