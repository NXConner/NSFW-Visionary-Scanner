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
import { isHybrid } from "@/lib/featureFlags";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Badge } from "@/components/ui/badge";
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
  const [activeTab, setActiveTab] = useState("profile");
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    if (user) {
      setProfile(prev => ({
        ...prev,
        email: user.email || '',
        name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'User',
      }));
    }
  }, [user]);

  const getUserPlanDisplay = () => {
    if (isAdmin && isPro) return { label: 'Admin + Premium', icon: Sparkles, color: 'bg-gradient-to-r from-amber-500 to-orange-500' };
    if (isAdmin) return { label: 'Admin', icon: Shield, color: 'bg-gradient-to-r from-red-500 to-orange-500' };
    if (isPro) return { label: 'Premium', icon: Crown, color: 'bg-gradient-to-r from-amber-500 to-orange-500' };
    return { label: 'Free', icon: User, color: 'bg-muted' };
  };

  const planInfo = getUserPlanDisplay();
  const PlanIcon = planInfo.icon;

  // Tier order: Free → Pro ($9.99) → Premium ($19.99 - highest)
  const plans = [
    { 
      name: 'Free', 
      price: '$0', 
      features: ['Basic Scanner', 'Health Diary', 'Education Center', 'Local Storage'],
      current: !isPro && !isAdmin && roles.length === 0
    },
    { 
      name: 'Pro', 
      price: '$9.99', 
      features: ['Everything in Free', 'Positions Gallery', 'PE Progress Photos', 'PE Routine Builder', 'Cloud Backup'],
      current: false // Will implement with payment
    },
    { 
      name: 'Premium', 
      price: '$19.99', 
      features: ['Everything in Pro', 'AI Health Chatbot', 'AI Scan Analysis', 'Unlimited Scans', 'Medical Export'],
      current: isPro || isAdmin
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

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Profile Card */}
              <Card variant="glass" className="animate-fade-in-up">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <div className="relative w-24 h-24 mx-auto mb-4">
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                        <span className="text-3xl font-bold text-primary-foreground">
                          {profile.name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full ${planInfo.color} flex items-center justify-center`}>
                        <PlanIcon className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold">{profile.name}</h3>
                    <p className="text-muted-foreground">{profile.email}</p>
                    
                    {/* Role Badges */}
                    <div className="flex flex-wrap justify-center gap-2 mt-3">
                      {isLoading ? (
                        <Badge variant="outline" className="animate-pulse">Loading...</Badge>
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
                        <label className="text-sm text-muted-foreground">Name</label>
                        <Input 
                          value={profile.name}
                          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">Email</label>
                        <Input 
                          value={profile.email}
                          disabled
                          className="mt-1 opacity-50"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">Phone</label>
                        <Input 
                          value={profile.phone}
                          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button variant="gradient" className="flex-1" onClick={() => setIsEditing(false)}>
                          Save Changes
                        </Button>
                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-3 rounded-lg bg-secondary/50">
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="font-medium">{profile.phone || 'Not set'}</p>
                      </div>
                      <Button variant="outline" className="w-full gap-2" onClick={() => setIsEditing(true)}>
                        <Edit2 className="w-4 h-4" />
                        Edit Profile
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Subscription */}
              <Card variant="glass" className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <CardHeader>
                  <CardTitle>Subscription Plans</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {plans.map((plan) => (
                    <div 
                      key={plan.name}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        plan.current 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border/50 hover:border-primary/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{plan.name}</h4>
                          <p className="text-2xl font-bold gradient-text">{plan.price}<span className="text-sm text-muted-foreground">/mo</span></p>
                        </div>
                        {plan.current && (
                          <div className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                            Current
                          </div>
                        )}
                      </div>
                      
                      <ul className="space-y-2">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm">
                            <Check className="w-4 h-4 text-primary" />
                            <span className="text-muted-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      
                      {!plan.current && (
                        <Button 
                          variant={plan.name === 'Premium' ? 'gradient' : 'outline'} 
                          className="w-full mt-4"
                        >
                          {plan.name === 'Free' ? 'Downgrade' : 'Upgrade'}
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Treatment Tab */}
          <TabsContent value="treatment">
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="animate-fade-in-up">
                <MedicationTracker />
              </div>
              <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <TreatmentTimeline />
              </div>
            </div>
          </TabsContent>

          {/* Referral Tab */}
          <TabsContent value="referral">
            <div className="animate-fade-in-up">
              <ReferralProgram />
            </div>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements">
            <div className="animate-fade-in-up">
              <AchievementSystem />
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="space-y-6">
              <div className="animate-fade-in-up">
                <SettingsPanel />
              </div>
              {isHybrid() && (
                <div className="animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
                  <DLCStatus />
                </div>
              )}
              <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <CloudBackup />
              </div>
              <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <DataRetentionSettings />
              </div>
              <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <AccountDeletion />
              </div>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <div className="space-y-6">
              <div className="animate-fade-in-up">
                <AppLockSettings />
              </div>
              <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <EnhancedPrivacyControls />
              </div>

              {/* Security Notice */}
              <Card variant="glass" className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                      <Lock className="w-6 h-6 text-success" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">Your Data is Secure</h4>
                      <p className="text-sm text-muted-foreground">
                        All your personal data and scan results are encrypted with 256-bit encryption and stored securely on your device. 
                        We never share your information with third parties.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};
