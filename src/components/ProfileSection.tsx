import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppLockSettings } from "@/components/AppLock";
import { SettingsPanel } from "@/components/SettingsPanel";
import { MedicationTracker } from "@/components/MedicationTracker";
import { TreatmentTimeline } from "@/components/TreatmentTimeline";
import { CloudBackup } from "@/components/CloudBackup";
import { AccountDeletion } from "@/components/AccountDeletion";
import { DataRetentionSettings } from "@/components/DataRetentionSettings";
import { DLCStatus } from "@/components/DLCStatus";
import { ReferralProgram } from "@/components/ReferralProgram";
import { AchievementSystem } from "@/components/AchievementSystem";
import { EnhancedPrivacyControls } from "@/components/EnhancedPrivacyControls";
import { TwoFactorSetup } from "@/components/TwoFactorSetup";
import { BiometricSettings } from "@/components/BiometricSettings";
import { Reveal } from "@/components/premium/Reveal";
import { TiltCard } from "@/components/premium/TiltCard";
import { AnimatedNumber } from "@/components/premium/AnimatedNumber";
import { isHybrid } from "@/lib/featureFlags";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import {
  User,
  Settings,
  Shield,
  Edit2,
  Crown,
  Check,
  Lock,
  Pill,
  Sparkles,
  Gift,
  Trophy,
} from "lucide-react";

export const ProfileSection = () => {
  const { user } = useAuth();
  const { roles, isAdmin, isPro, isLoading } = useUserRoles();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [profile, setProfile] = useState({
    name: "",
    screenName: "",
    email: "",
    phone: "",
  });

  // Load profile from database
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      // Set defaults from user object first
      setProfile(prev => ({
        ...prev,
        email: user.email || "",
        name: user.user_metadata?.display_name || user.email?.split("@")[0] || "User",
      }));

      // Then fetch from profiles table
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .single();

      if (!error && data) {
        setProfile(prev => ({
          ...prev,
          screenName: data.display_name || "",
          name: data.display_name || prev.name,
        }));
      }
    };

    loadProfile();
  }, [user]);

  // Save profile to database
  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: profile.screenName || profile.name,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;

      // Also update user metadata
      await supabase.auth.updateUser({
        data: { display_name: profile.screenName || profile.name },
      });

      toast({
        title: "Profile updated",
        description: "Your screen name has been saved successfully.",
      });

      setProfile(prev => ({
        ...prev,
        name: profile.screenName || prev.name,
      }));

      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save profile:", error);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getUserPlanDisplay = () => {
    if (isAdmin && isPro)
      return {
        label: "Admin + Premium",
        icon: Sparkles,
        color: "bg-gradient-to-r from-amber-500 to-orange-500",
      };
    if (isAdmin)
      return { label: "Admin", icon: Shield, color: "bg-gradient-to-r from-red-500 to-orange-500" };
    if (isPro)
      return {
        label: "Premium",
        icon: Crown,
        color: "bg-gradient-to-r from-amber-500 to-orange-500",
      };
    return { label: "Free", icon: User, color: "bg-muted" };
  };

  const planInfo = getUserPlanDisplay();
  const PlanIcon = planInfo.icon;

  // Tier order: Free → Pro ($9.99) → Premium ($19.99 - highest)
  const plans = [
    {
      name: "Free",
      price: "$0",
      features: ["Basic Scanner", "Health Diary", "Education Center", "Local Storage"],
      current: !isPro && !isAdmin && roles.length === 0,
    },
    {
      name: "Pro",
      price: "$9.99",
      features: [
        "Everything in Free",
        "Positions Gallery",
        "PE Progress Photos",
        "PE Routine Builder",
        "Cloud Backup",
      ],
      current: false, // Will implement with payment
    },
    {
      name: "Premium",
      price: "$19.99",
      features: [
        "Everything in Pro",
        "AI Health Chatbot",
        "AI Scan Analysis",
        "Unlimited Scans",
        "Medical Export",
      ],
      current: isPro || isAdmin,
    },
  ];

  return (
    <section className="min-h-screen px-4 py-20 relative">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <User className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">Account</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="gradient-text">Your</span> Profile
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Manage your account settings, treatment tracking, and preferences.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full max-w-4xl mx-auto">
            <TabsTrigger value="profile" className="gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="treatment" className="gap-2">
              <Pill className="w-4 h-4" />
              <span className="hidden sm:inline">Treatment</span>
            </TabsTrigger>
            <TabsTrigger value="referral" className="gap-2">
              <Gift className="w-4 h-4" />
              <span className="hidden sm:inline">Referral</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="gap-2">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Achievements</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Profile Card */}
              <Reveal variant="fade-up" delay={0}>
                <TiltCard maxTilt={4} glow>
                  <Card variant="glass">
                    <CardContent className="p-6">
                      <div className="text-center mb-6">
                        <div className="relative w-24 h-24 mx-auto mb-4">
                          <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                            <span className="text-3xl font-bold text-primary-foreground">
                              {profile.name
                                .split(" ")
                                .map(n => n[0])
                                .join("")
                                .toUpperCase() || "U"}
                            </span>
                          </div>
                          <div
                            className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full ${planInfo.color} flex items-center justify-center`}
                          >
                            <PlanIcon className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <h3 className="text-xl font-bold">{profile.name}</h3>
                        <p className="text-muted-foreground">{profile.email}</p>

                        {/* Role Badges */}
                        <div className="flex flex-wrap justify-center gap-2 mt-3">
                          {isLoading ? (
                            <Badge variant="outline" className="animate-pulse">
                              Loading...
                            </Badge>
                          ) : (
                            <>
                              {isAdmin && (
                                <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-0">
                                  <Shield className="w-3 h-3 mr-1" />
                                  Admin
                                </Badge>
                              )}
                              {isPro && (
                                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                                  <Crown className="w-3 h-3 mr-1" />
                                  Premium
                                </Badge>
                              )}
                              {!isAdmin && !isPro && (
                                <Badge variant="secondary">
                                  <User className="w-3 h-3 mr-1" />
                                  Free
                                </Badge>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="space-y-4">
                          <div>
                            <Label
                              htmlFor="profile-screen-name"
                              className="text-sm text-muted-foreground"
                            >
                              Screen Name / Username
                            </Label>
                            <Input
                              id="profile-screen-name"
                              value={profile.screenName}
                              onChange={e => setProfile({ ...profile, screenName: e.target.value })}
                              placeholder="Choose a display name"
                              className="mt-1"
                              maxLength={30}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              This is how you'll appear to others (
                              {30 - (profile.screenName?.length || 0)} characters left)
                            </p>
                          </div>
                          <div>
                            <Label
                              htmlFor="profile-email"
                              className="text-sm text-muted-foreground"
                            >
                              Email
                            </Label>
                            <Input
                              id="profile-email"
                              value={profile.email}
                              disabled
                              className="mt-1 opacity-50"
                            />
                          </div>
                          <div>
                            <Label
                              htmlFor="profile-phone"
                              className="text-sm text-muted-foreground"
                            >
                              Phone (optional)
                            </Label>
                            <Input
                              id="profile-phone"
                              value={profile.phone}
                              onChange={e => setProfile({ ...profile, phone: e.target.value })}
                              className="mt-1"
                              placeholder="Not set"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="gradient"
                              className="flex-1"
                              onClick={handleSaveProfile}
                              disabled={isSaving}
                            >
                              {isSaving ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                "Save Changes"
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setIsEditing(false)}
                              disabled={isSaving}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="p-3 rounded-lg bg-secondary/50">
                            <p className="text-xs text-muted-foreground">Screen Name</p>
                            <p className="font-medium">{profile.screenName || profile.name}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-secondary/50">
                            <p className="text-xs text-muted-foreground">Phone</p>
                            <p className="font-medium">{profile.phone || "Not set"}</p>
                          </div>
                          <Button
                            variant="outline"
                            className="w-full gap-2"
                            onClick={() => setIsEditing(true)}
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit Profile
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TiltCard>
              </Reveal>

              {/* Subscription */}
              <Reveal variant="fade-up" delay={0.1}>
                <TiltCard maxTilt={4} glow>
                  <Card variant="glass">
                    <CardHeader>
                      <CardTitle>Subscription Plans</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {plans.map((plan, index) => (
                        <div
                          key={plan.name}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            plan.current
                              ? "border-primary bg-primary/5"
                              : "border-border/50 hover:border-primary/30"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-semibold">{plan.name}</h4>
                              <p className="text-2xl font-bold gradient-text">
                                <AnimatedNumber
                                  value={parseFloat(plan.price.replace("$", ""))}
                                  prefix="$"
                                  decimals={plan.price.includes(".") ? 2 : 0}
                                />
                                <span className="text-sm text-muted-foreground">/mo</span>
                              </p>
                            </div>
                            {plan.current && (
                              <div className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                                Current
                              </div>
                            )}
                          </div>

                          <ul className="space-y-2">
                            {plan.features.map((feature, i) => (
                              <li key={i} className="flex items-center gap-2 text-sm">
                                <Check className="w-4 h-4 text-primary" />
                                <span className="text-muted-foreground">{feature}</span>
                              </li>
                            ))}
                          </ul>

                          {!plan.current && (
                            <Button
                              variant={plan.name === "Premium" ? "gradient" : "outline"}
                              className="w-full mt-4"
                            >
                              {plan.name === "Free" ? "Downgrade" : "Upgrade"}
                            </Button>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TiltCard>
              </Reveal>
            </div>
          </TabsContent>

          {/* Treatment Tab */}
          <TabsContent value="treatment">
            <div className="grid lg:grid-cols-2 gap-6">
              <Reveal variant="fade-up" delay={0}>
                <MedicationTracker />
              </Reveal>
              <Reveal variant="fade-up" delay={0.1}>
                <TreatmentTimeline />
              </Reveal>
            </div>
          </TabsContent>

          {/* Referral Tab */}
          <TabsContent value="referral">
            <Reveal variant="fade-up" delay={0}>
              <ReferralProgram />
            </Reveal>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements">
            <Reveal variant="fade-up" delay={0}>
              <AchievementSystem />
            </Reveal>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="space-y-6">
              <Reveal variant="fade-up" delay={0}>
                <SettingsPanel />
              </Reveal>
              {isHybrid() && (
                <Reveal variant="fade-up" delay={0.05}>
                  <DLCStatus />
                </Reveal>
              )}
              <Reveal variant="fade-up" delay={0.1}>
                <CloudBackup />
              </Reveal>
              <Reveal variant="fade-up" delay={0.15}>
                <DataRetentionSettings />
              </Reveal>
              <Reveal variant="fade-up" delay={0.2}>
                <AccountDeletion />
              </Reveal>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <div className="space-y-6">
              <Reveal variant="fade-up" delay={0}>
                <TwoFactorSetup />
              </Reveal>
              <Reveal variant="fade-up" delay={0.1}>
                <BiometricSettings />
              </Reveal>
              <Reveal variant="fade-up" delay={0.15}>
                <AppLockSettings />
              </Reveal>
              <Reveal variant="fade-up" delay={0.2}>
                <EnhancedPrivacyControls />
              </Reveal>

              {/* Security Notice */}
              <Reveal variant="fade-up" delay={0.25}>
                <TiltCard maxTilt={3} glow>
                  <Card variant="glass">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                          <Lock className="w-6 h-6 text-success" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">Your Data is Secure</h4>
                          <p className="text-sm text-muted-foreground">
                            All your personal data and scan results are encrypted with 256-bit
                            encryption and stored securely on your device. We never share your
                            information with third parties.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TiltCard>
              </Reveal>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};
