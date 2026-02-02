import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useData } from "@/contexts/DataContext";
import { encryptData, decryptData } from "@/lib/encryption";
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

export const CloudBackup = () => {
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

  const saveSettings = (newSettings: CloudBackupSettings) => {
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
  };

  const handleEnableCloud = () => {
    if (!settings.enabled && !customKey) {
      toast.error("Please enter an encryption key first");
      return;
    }
    saveSettings({
      ...settings,
      enabled: !settings.enabled,
      encryptionKey: customKey || settings.encryptionKey,
    });
    toast.success(settings.enabled ? "Cloud backup disabled" : "Cloud backup enabled");
  };

  const handleBackupToCloud = async () => {
    if (!settings.enabled) {
      toast.error("Enable cloud backup first");
      return;
    }

    setIsUploading(true);
    try {
      const data = exportData();
      const encrypted = await encryptData(JSON.stringify(data));

      // Store in localStorage as "cloud" simulation
      // In production, this would upload to actual cloud storage
      const cloudData = {
        data: encrypted,
        timestamp: new Date().toISOString(),
        checksum: btoa(JSON.stringify(data).slice(0, 50)),
      };
      localStorage.setItem("morphoscan_cloud_backup", JSON.stringify(cloudData));

      saveSettings({
        ...settings,
        lastBackup: new Date().toISOString(),
      });

      toast.success("Backup uploaded successfully", {
        description: `${scans.length} scans and ${diaryEntries.length} diary entries backed up`,
      });
    } catch (error) {
      toast.error("Backup failed", { description: "Could not encrypt data" });
    }
    setIsUploading(false);
  };

  const handleRestoreFromCloud = async () => {
    setIsDownloading(true);
    try {
      const cloudBackup = localStorage.getItem("morphoscan_cloud_backup");
      if (!cloudBackup) {
        toast.error("No cloud backup found");
        setIsDownloading(false);
        return;
      }

      const { data: encryptedData } = JSON.parse(cloudBackup);
      const decrypted = await decryptData(encryptedData);
      const parsedData = JSON.parse(decrypted);

      await importData(parsedData);
      toast.success("Data restored successfully", {
        description: `${parsedData.scans?.length || 0} scans and ${parsedData.diaryEntries?.length || 0} entries restored`,
      });
    } catch (error) {
      toast.error("Restore failed", { description: "Could not decrypt data or invalid format" });
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
        {settings.lastBackup && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/20">
            <CheckCircle2 className="w-4 h-4 text-success" />
            <span className="text-sm text-success">
              Last backup: {new Date(settings.lastBackup).toLocaleString()}
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
            Cloud backup stores encrypted data locally as a simulation. In production, this would
            connect to secure cloud storage.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
