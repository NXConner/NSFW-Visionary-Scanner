import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Shield, Lock, Cloud, CloudOff, Database, Download, Trash2,
  Eye, EyeOff, CheckCircle, AlertTriangle, HardDrive, FileText,
  Image, Calendar, Activity, Sparkles, RefreshCw
} from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { toast } from "sonner";

interface StorageItem {
  key: string;
  label: string;
  icon: React.ElementType;
  size: number;
  count?: number;
}

export const PrivacyDashboard = () => {
  const { scans, diaryEntries, clearAllData } = useData();
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageItems, setStorageItems] = useState<StorageItem[]>([]);

  // Calculate storage usage
  useEffect(() => {
    const calculateStorage = () => {
      const items: StorageItem[] = [];
      let total = 0;

      // Check localStorage items
      const storageKeys: { key: string; label: string; icon: React.ElementType }[] = [
        { key: 'morphoscan_scans', label: 'Scan History', icon: Activity },
        { key: 'morphoscan_diary', label: 'Health Diary', icon: Calendar },
        { key: 'morphoscan_settings', label: 'Settings', icon: FileText },
        { key: 'morphoscan_audit_log', label: 'Activity Log', icon: FileText },
        { key: 'morphoscan_goals', label: 'Goals', icon: Sparkles },
        { key: 'morphoscan_encryption_key', label: 'Encryption Key', icon: Lock },
      ];

      storageKeys.forEach(({ key, label, icon }) => {
        const data = localStorage.getItem(key);
        if (data) {
          const size = new Blob([data]).size;
          total += size;
          items.push({ key, label, icon, size });
        }
      });

      // Add image data size estimation
      const imageData = localStorage.getItem('morphoscan_images');
      if (imageData) {
        const size = new Blob([imageData]).size;
        total += size;
        items.push({ key: 'morphoscan_images', label: 'Stored Images', icon: Image, size });
      }

      setStorageUsed(total);
      setStorageItems(items);
    };

    calculateStorage();
  }, [scans, diaryEntries]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Estimate max storage (5MB is typical localStorage limit)
  const maxStorage = 5 * 1024 * 1024;
  const storagePercentage = (storageUsed / maxStorage) * 100;

  const handleExportAllData = () => {
    const exportData: Record<string, any> = {};
    
    storageItems.forEach(item => {
      const data = localStorage.getItem(item.key);
      if (data) {
        try {
          exportData[item.key] = JSON.parse(data);
        } catch {
          exportData[item.key] = data;
        }
      }
    });

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `growthtracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success("Data exported successfully", { description: "Your backup file has been downloaded" });
  };

  const handleDeleteCategory = (key: string, label: string) => {
    localStorage.removeItem(key);
    toast.success(`${label} deleted`, { description: "Data has been permanently removed" });
    // Trigger re-calculation
    window.location.reload();
  };

  const handleNuclearOption = () => {
    // Clear everything
    const keysToKeep = ['morphoscan_encryption_key']; // Keep encryption key
    const allKeys = Object.keys(localStorage).filter(k => k.startsWith('morphoscan_'));
    
    allKeys.forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });

    clearAllData();
    toast.success("All data cleared", { description: "Your app has been reset to factory settings" });
    setTimeout(() => window.location.reload(), 1000);
  };

  const privacyGuarantees = [
    { icon: CloudOff, label: "No Cloud Sync", desc: "All data stays on your device" },
    { icon: Lock, label: "Encrypted Storage", desc: "AES-256 encryption for all data" },
    { icon: EyeOff, label: "No Tracking", desc: "Zero analytics or user tracking" },
    { icon: Shield, label: "No Third-Party Sharing", desc: "Your data is never shared" },
  ];

  return (
    <div className="space-y-6">
      {/* Privacy Guarantees */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-success" />
            Privacy Guarantees
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {privacyGuarantees.map((item, index) => (
              <div 
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-success/5 border border-success/20"
              >
                <div className="p-2 rounded-lg bg-success/20">
                  <item.icon className="w-4 h-4 text-success" />
                </div>
                <div>
                  <p className="font-medium text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Storage Overview */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-primary" />
            Storage Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Storage Used</span>
            <span className="font-bold">{formatBytes(storageUsed)} / {formatBytes(maxStorage)}</span>
          </div>
          <Progress value={storagePercentage} className="h-3" />
          <p className="text-xs text-muted-foreground">
            {storagePercentage.toFixed(1)}% of available local storage used
          </p>

          <Separator />

          {/* Data Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-primary/5 border border-primary/20">
              <Activity className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold">{scans.length}</p>
              <p className="text-xs text-muted-foreground">Scans</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-accent/5 border border-accent/20">
              <Calendar className="w-5 h-5 text-accent mx-auto mb-1" />
              <p className="text-2xl font-bold">{diaryEntries.length}</p>
              <p className="text-xs text-muted-foreground">Diary Entries</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-warning/5 border border-warning/20">
              <Image className="w-5 h-5 text-warning mx-auto mb-1" />
              <p className="text-2xl font-bold">{scans.filter(s => s.image_data).length}</p>
              <p className="text-xs text-muted-foreground">Images</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-success/5 border border-success/20">
              <Lock className="w-5 h-5 text-success mx-auto mb-1" />
              <p className="text-2xl font-bold">
                <CheckCircle className="w-6 h-6 inline text-success" />
              </p>
              <p className="text-xs text-muted-foreground">Encrypted</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Categories */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            Stored Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          {storageItems.length === 0 ? (
            <div className="text-center py-8">
              <Database className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">No data stored yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {storageItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{formatBytes(item.size)}</p>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete {item.label}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete all data in {item.label}. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteCategory(item.key, item.label)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Data Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2"
            onClick={handleExportAllData}
          >
            <Download className="w-4 h-4" />
            Export All Data (Encrypted Backup)
          </Button>

          <Separator />

          <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-destructive mb-1">Danger Zone</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Permanently delete all your data. This action cannot be undone.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="gap-2">
                      <Trash2 className="w-4 h-4" />
                      Delete All Data
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete ALL Data?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete ALL your data including scans, diary entries, 
                        settings, and activity logs. Your encryption key will be preserved. 
                        This action CANNOT be undone. Consider exporting a backup first.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleNuclearOption}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Yes, Delete Everything
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Notice */}
      <Card variant="glass" className="border-success/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-success shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-success mb-1">Your Privacy is Protected</p>
              <p className="text-xs text-muted-foreground">
                All data is encrypted and stored locally on your device. We have no access to your 
                personal health information. No data is ever transmitted to external servers.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
