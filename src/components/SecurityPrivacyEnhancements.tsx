/**
 * Advanced Security & Privacy Enhancements
 * UI component for managing 2FA, biometric auth, sessions, devices, security alerts, and privacy controls
 */

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  get2FAStatus,
  enable2FA,
  verify2FA,
  getActiveSessions,
  revokeSession,
  getSecurityAlerts,
  markAlertAsRead,
  getPrivacyControls,
  updatePrivacyControls,
  getLoginHistory,
  type TwoFactorAuthentication,
  type ActiveSession,
  type SecurityAlert,
  type PrivacyControls,
  type LoginHistory,
} from "@/lib/securityPrivacyEnhancements";
import {
  Shield,
  Lock,
  Smartphone,
  AlertTriangle,
  Eye,
  Loader2,
  CheckCircle2,
  X,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

const profileVisibilityOptions = ["private", "friends", "public"] as const satisfies ReadonlyArray<
  PrivacyControls["profile_visibility"]
>;

export const SecurityPrivacyEnhancements = () => {
  const [activeTab, setActiveTab] = useState("security");
  const [loading, setLoading] = useState(false);
  const [twoFactorStatus, setTwoFactorStatus] = useState<TwoFactorAuthentication[]>([]);
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [privacyControls, setPrivacyControls] = useState<PrivacyControls | null>(null);
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [qrCode, setQrCode] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case "security": {
          const [twoFactorData, sessionsData, alertsData] = await Promise.all([
            get2FAStatus(),
            getActiveSessions(),
            getSecurityAlerts(),
          ]);
          setTwoFactorStatus(twoFactorData);
          setSessions(sessionsData);
          setAlerts(alertsData);
          break;
        }
        case "privacy": {
          const privacy = await getPrivacyControls();
          setPrivacyControls(privacy);
          break;
        }
        case "login-history": {
          const history = await getLoginHistory();
          setLoginHistory(history);
          break;
        }
      }
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleEnable2FA = async () => {
    try {
      const result = await enable2FA("totp");
      if (result) {
        setQrCode(result.qr_code || null);
        setShow2FASetup(true);
      }
    } catch (error) {
      toast.error("Failed to enable 2FA");
    }
  };

  const handleVerify2FA = async () => {
    if (!twoFactorCode.trim()) {
      toast.error("Please enter verification code");
      return;
    }

    try {
      const success = await verify2FA("totp", twoFactorCode);
      if (success) {
        setShow2FASetup(false);
        setTwoFactorCode("");
        setQrCode(null);
        await loadData();
      }
    } catch (error) {
      toast.error("Failed to verify 2FA");
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      const success = await revokeSession(sessionId);
      if (success) {
        await loadData();
      }
    } catch (error) {
      toast.error("Failed to revoke session");
    }
  };

  const handleUpdatePrivacy = async (updates: Partial<PrivacyControls>) => {
    try {
      const success = await updatePrivacyControls(updates);
      if (success) {
        await loadData();
      }
    } catch (error) {
      toast.error("Failed to update privacy settings");
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "high":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default:
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="glass-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="w-12 h-12 text-muted-foreground animate-spin mb-4" />
            <p className="text-muted-foreground">Loading security settings...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Security & Privacy
          </CardTitle>
          <CardDescription>
            Manage your security settings, two-factor authentication, sessions, and privacy controls
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
              <TabsTrigger value="login-history">Login History</TabsTrigger>
            </TabsList>

            <TabsContent value="security" className="space-y-4">
              {/* Two-Factor Authentication */}
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Two-Factor Authentication</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {twoFactorStatus.length > 0 && twoFactorStatus.some(tfa => tfa.is_enabled) ? (
                    <div className="space-y-2">
                      {twoFactorStatus.map(tfa => (
                        <div
                          key={tfa.id}
                          className="flex items-center justify-between p-3 border rounded"
                        >
                          <div>
                            <p className="font-medium">{tfa.method.toUpperCase()}</p>
                            <p className="text-sm text-muted-foreground">Enabled</p>
                          </div>
                          <Badge variant="default">Active</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      {show2FASetup && qrCode ? (
                        <div className="space-y-4">
                          <div className="text-center">
                            <p className="mb-2">Scan this QR code with your authenticator app:</p>
                            <img src={qrCode} alt="2FA QR Code" className="mx-auto mb-4" />
                            <Input
                              placeholder="Enter verification code"
                              value={twoFactorCode}
                              onChange={e => setTwoFactorCode(e.target.value)}
                              className="max-w-xs mx-auto"
                            />
                            <div className="flex gap-2 mt-4 justify-center">
                              <Button onClick={handleVerify2FA}>Verify</Button>
                              <Button variant="outline" onClick={() => setShow2FASetup(false)}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <Button onClick={handleEnable2FA} className="w-full">
                          Enable Two-Factor Authentication
                        </Button>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Active Sessions */}
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Active Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  {sessions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No active sessions</div>
                  ) : (
                    <div className="space-y-2">
                      {sessions.map(session => (
                        <div
                          key={session.id}
                          className="flex items-center justify-between p-3 border rounded"
                        >
                          <div>
                            <p className="font-medium">{session.device_name || "Unknown Device"}</p>
                            <p className="text-sm text-muted-foreground">
                              {session.location_city && `${session.location_city}, `}
                              {session.location_country} • {session.platform}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Last activity: {new Date(session.last_activity_at).toLocaleString()}
                            </p>
                          </div>
                          {session.is_current_session ? (
                            <Badge variant="default">Current</Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRevokeSession(session.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Security Alerts */}
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Security Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  {alerts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No security alerts</div>
                  ) : (
                    <div className="space-y-2">
                      {alerts.map(alert => (
                        <div
                          key={alert.id}
                          className={`p-3 border rounded ${getSeverityColor(alert.alert_severity)}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">{alert.alert_title}</h4>
                                <Badge variant="outline">{alert.alert_severity}</Badge>
                              </div>
                              <p className="text-sm">{alert.alert_message}</p>
                              <p className="text-xs mt-1">
                                {new Date(alert.created_at).toLocaleString()}
                              </p>
                            </div>
                            {!alert.is_read && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={async () => {
                                  await markAlertAsRead(alert.id);
                                  await loadData();
                                }}
                              >
                                Mark Read
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="privacy" className="space-y-4">
              {privacyControls ? (
                <Card className="glass-card border-border/50">
                  <CardHeader>
                    <CardTitle>Privacy Controls</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Share Analytics</Label>
                      <Switch
                        checked={privacyControls.share_analytics}
                        onCheckedChange={checked =>
                          handleUpdatePrivacy({ share_analytics: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Share Usage Data</Label>
                      <Switch
                        checked={privacyControls.share_usage_data}
                        onCheckedChange={checked =>
                          handleUpdatePrivacy({ share_usage_data: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Anonymize Data</Label>
                      <Switch
                        checked={privacyControls.anonymize_data}
                        onCheckedChange={checked =>
                          handleUpdatePrivacy({ anonymize_data: checked })
                        }
                      />
                    </div>
                    <div>
                      <Label>Profile Visibility</Label>
                      <Select
                        value={privacyControls.profile_visibility}
                        onValueChange={value => {
                          const v = value as PrivacyControls["profile_visibility"];
                          if (profileVisibilityOptions.includes(v)) {
                            void handleUpdatePrivacy({ profile_visibility: v });
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="private">Private</SelectItem>
                          <SelectItem value="friends">Friends Only</SelectItem>
                          <SelectItem value="public">Public</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Loading privacy controls...
                </div>
              )}
            </TabsContent>

            <TabsContent value="login-history" className="space-y-4">
              {loginHistory.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No login history</div>
              ) : (
                <div className="space-y-2">
                  {loginHistory.map(login => (
                    <Card key={login.id} className="glass-card border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">{login.login_method}</p>
                              <Badge
                                variant={
                                  login.login_status === "success" ? "default" : "destructive"
                                }
                              >
                                {login.login_status}
                              </Badge>
                              {login.is_suspicious && (
                                <Badge variant="outline">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  Suspicious
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {login.location_city && `${login.location_city}, `}
                              {login.location_country} •{" "}
                              {new Date(login.logged_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
