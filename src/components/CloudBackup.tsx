import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useData } from "@/contexts/DataContext";
import { decryptDataWithPassphrase, encryptDataWithPassphrase } from "@/lib/encryption";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Cloud,
  CloudOff,
  Upload,
  Download,
  Shield,
  Key,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface CloudBackupSettings {
  enabled: boolean;
  autoBackup: boolean;
  lastBackup: string | null;
  encryptionKey: string;
}

const STORAGE_KEY = "morphoscan_cloud_settings";
const BACKUP_BUCKET = "user-uploads";
const BACKUP_FOLDER = "cloud-backups";

function safeIsoForPath(iso: string): string {
  return String(iso || "").replace(/[:.]/g, "-");
}

function buildBackupPath(userId: string, iso: string): string {
  const fileName = `app-backup-${safeIsoForPath(iso)}.json`;
  return `${userId}/${BACKUP_FOLDER}/${fileName}`;
}

export const CloudBackup = () => {
  const { user } = useAuth();
  const { scans, diaryEntries, exportData, importData } = useData();
  const [settings, setSettings] = useState<CloudBackupSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved
      ? JSON.parse(saved)
      : {
          enabled: false,
          autoBackup: false,
          lastBackup: null,
          encryptionKey: "",
        };
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [customKey, setCustomKey] = useState("");
  const [remoteLastBackupAt, setRemoteLastBackupAt] = useState<string | null>(null);
  const [remoteBackupCount, setRemoteBackupCount] = useState<number | null>(null);

  const saveSettings = (newSettings: CloudBackupSettings) => {
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
  };

  const refreshRemoteBackupMeta = useCallback(async () => {
    if (!user?.id) {
      setRemoteLastBackupAt(null);
      setRemoteBackupCount(null);
      return;
    }

    const prefix = `${user.id}/${BACKUP_FOLDER}`;
    const { data, error } = await supabase.storage.from(BACKUP_BUCKET).list(prefix, {
      limit: 50,
      offset: 0,
      sortBy: { column: "name", order: "desc" },
    });

    if (error) {
      // Silent: storage policies may not be configured yet in a given environment.
      setRemoteLastBackupAt(null);
      setRemoteBackupCount(null);
      return;
    }

    const files = Array.isArray(data) ? data : [];
    setRemoteBackupCount(files.length);
    const newest = files
      .filter(f => (f as any)?.name)
      .map(f => ({
        name: String((f as any).name),
        created_at: String((f as any).created_at || ""),
      }))
      .sort((a, b) => {
        // Prefer server-side created_at if present, else fall back to filename ordering.
        if (a.created_at && b.created_at) return b.created_at.localeCompare(a.created_at);
        return b.name.localeCompare(a.name);
      })[0];
    setRemoteLastBackupAt(newest?.created_at || null);
  }, [user?.id]);

  useEffect(() => {
    void refreshRemoteBackupMeta();
  }, [refreshRemoteBackupMeta]);

  const effectiveLastBackup = useMemo(() => {
    return remoteLastBackupAt || settings.lastBackup;
  }, [remoteLastBackupAt, settings.lastBackup]);

  const handleEnableCloud = () => {
    if (!user) {
      toast.error("Sign in required to use cloud backup");
      return;
    }

    const nextKey = (customKey || settings.encryptionKey).trim();
    if (!settings.enabled && !nextKey) {
      toast.error("Please enter an encryption key first");
      return;
    }
    saveSettings({
      ...settings,
      enabled: !settings.enabled,
      encryptionKey: nextKey,
    });
    toast.success(settings.enabled ? "Cloud backup disabled" : "Cloud backup enabled");
  };

  const handleBackupToCloud = async () => {
    if (!settings.enabled) {
      toast.error("Enable cloud backup first");
      return;
    }
    if (!user) {
      toast.error("Sign in required to back up");
      return;
    }
    if (!settings.encryptionKey.trim()) {
      toast.error("Missing encryption key");
      return;
    }

    setIsUploading(true);
    try {
      const data = exportData();
      const encryptedPayload = await encryptDataWithPassphrase(
        JSON.stringify(data),
        settings.encryptionKey.trim(),
      );

      const nowIso = new Date().toISOString();
      const path = buildBackupPath(user.id, nowIso);
      const blob = new Blob([encryptedPayload], { type: "application/json" });

      const { error } = await supabase.storage.from(BACKUP_BUCKET).upload(path, blob, {
        cacheControl: "3600",
        upsert: false,
        contentType: "application/json",
      });

      if (error) {
        throw new Error(error.message);
      }

      saveSettings({
        ...settings,
        lastBackup: nowIso,
      });

      void refreshRemoteBackupMeta();
      toast.success("Backup uploaded successfully", {
        description: `${scans.length} scans and ${diaryEntries.length} diary entries backed up`,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Backup failed";
      toast.error("Backup failed", { description: msg });
    }
    setIsUploading(false);
  };

  const handleRestoreFromCloud = async () => {
    setIsDownloading(true);
    try {
      if (!user) {
        toast.error("Sign in required to restore");
        return;
      }
      const key = settings.encryptionKey.trim();
      if (!key) {
        toast.error("Enter your encryption key to restore");
        return;
      }

      const prefix = `${user.id}/${BACKUP_FOLDER}`;
      const { data: files, error: listError } = await supabase.storage
        .from(BACKUP_BUCKET)
        .list(prefix, {
          limit: 50,
          offset: 0,
          sortBy: { column: "name", order: "desc" },
        });
      if (listError) throw new Error(listError.message);

      const best = (Array.isArray(files) ? files : [])
        .filter(f => (f as any)?.name)
        .map(f => ({
          name: String((f as any).name),
          created_at: String((f as any).created_at || ""),
        }))
        .sort((a, b) => {
          if (a.created_at && b.created_at) return b.created_at.localeCompare(a.created_at);
          return b.name.localeCompare(a.name);
        })[0];

      if (!best?.name) {
        toast.error("No cloud backup found");
        setIsDownloading(false);
        return;
      }

      const fullPath = `${prefix}/${best.name}`;
      const { data: fileBlob, error: downloadError } = await supabase.storage
        .from(BACKUP_BUCKET)
        .download(fullPath);
      if (downloadError) throw new Error(downloadError.message);
      const encryptedPayload = await fileBlob.text();

      const decrypted = await decryptDataWithPassphrase(encryptedPayload, key);
      const parsedData = JSON.parse(decrypted) as { scans?: any[]; diaryEntries?: any[] };
      const toImport = {
        scans: Array.isArray(parsedData.scans) ? parsedData.scans : [],
        diaryEntries: Array.isArray(parsedData.diaryEntries) ? parsedData.diaryEntries : [],
      };

      await importData(toImport);
      toast.success("Data restored successfully", {
        description: `${toImport.scans.length} scans and ${toImport.diaryEntries.length} entries restored`,
      });
      void refreshRemoteBackupMeta();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Restore failed";
      toast.error("Restore failed", { description: msg });
    }
    setIsDownloading(false);
  };

  const generateEncryptionKey = () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const key = btoa(String.fromCharCode(...array)).slice(0, 32);
    setCustomKey(key);
    toast.success("Key generated! Save this key securely.");
  };

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="w-5 h-5 text-primary" />
          Cloud Backup (Optional)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Info Banner */}
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">End-to-End Encryption</p>
              <p className="text-xs text-muted-foreground mt-1">
                Your data is encrypted before leaving your device. Only you can decrypt it with your
                key.
              </p>
            </div>
          </div>
        </div>

        {/* Encryption Key */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Key className="w-4 h-4" />
            Encryption Key
          </Label>
          <div className="flex gap-2">
            <Input
              type="password"
              placeholder="Enter or generate encryption key"
              value={customKey}
              onChange={e => setCustomKey(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline" size="sm" onClick={generateEncryptionKey}>
              Generate
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Save this key securely. You'll need it to restore your data.
          </p>
        </div>

        {/* Enable Toggle */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
          <div className="flex items-center gap-3">
            {settings.enabled ? (
              <Cloud className="w-5 h-5 text-success" />
            ) : (
              <CloudOff className="w-5 h-5 text-muted-foreground" />
            )}
            <div>
              <p className="font-medium">Cloud Backup</p>
              <p className="text-xs text-muted-foreground">
                {settings.enabled ? "Enabled" : "Disabled"}
              </p>
            </div>
          </div>
          <Switch checked={settings.enabled} onCheckedChange={handleEnableCloud} />
        </div>

        {/* Auto Backup */}
        {settings.enabled && (
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Auto Backup</p>
                <p className="text-xs text-muted-foreground">Backup when data changes</p>
              </div>
            </div>
            <Switch
              checked={settings.autoBackup}
              onCheckedChange={checked => saveSettings({ ...settings, autoBackup: checked })}
            />
          </div>
        )}

        {/* Last Backup Status */}
        {effectiveLastBackup && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/20">
            <CheckCircle2 className="w-4 h-4 text-success" />
            <span className="text-sm text-success">
              Last backup: {new Date(effectiveLastBackup).toLocaleString()}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={handleBackupToCloud}
            disabled={!settings.enabled || isUploading}
            className="gap-2"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            Backup Now
          </Button>
          <Button
            variant="outline"
            onClick={handleRestoreFromCloud}
            disabled={isDownloading}
            className="gap-2"
          >
            {isDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Restore
          </Button>
        </div>

        {/* Warning */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
          <AlertCircle className="w-4 h-4 text-warning mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Backups are stored in Supabase Storage (bucket: <code>{BACKUP_BUCKET}</code>) under your
            user folder. Keep your encryption key safe: without it, restores are not possible.
            {typeof remoteBackupCount === "number" ? (
              <>
                {" "}
                Detected <strong>{remoteBackupCount}</strong> backup file(s) in storage.
              </>
            ) : null}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
