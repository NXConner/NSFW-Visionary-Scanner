import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { BUILD_IS_NSFW, BUILD_IS_STORE } from "@/lib/buildFlags";
import {
  Shield,
  Lock,
  Scan,
  TrendingUp,
  Brain,
  Heart,
  Users,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Smartphone,
  Globe,
  Download,
} from "lucide-react";
import { TacticalScannerBackground } from "@/components/landing/TacticalScannerBackground";

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // If user is already logged in, redirect to app
  const handleGetStarted = () => {
    if (user) {
      navigate("/app");
    } else {
      navigate("/auth");
    }
  };

  const handleOpenApp = () => {
    navigate("/app");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[90vh]">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background" />

        <div className="container mx-auto px-4 pt-12 lg:pt-16 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Privacy badge - ABOVE scanner */}
            <Badge variant="secondary" className="px-4 py-1.5 text-sm mb-6">
              <Shield className="h-3.5 w-3.5 mr-1.5" />
              100% Private & Secure
            </Badge>

            {/* MorphoScan title - ABOVE scanner */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-8">
              <span className="bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
                MorphoScan
              </span>
            </h1>

            {/* Interactive Scanner - centered */}
            <div className="relative py-4">
              <TacticalScannerBackground />
            </div>

            {/* Description text - BELOW scanner */}
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mt-6 mb-8">
              Advanced health tracking and analysis with complete privacy. Your data never leaves
              your device.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Button size="lg" onClick={handleOpenApp} className="gap-2 text-lg px-8">
                  Open App
                  <ArrowRight className="h-5 w-5" />
                </Button>
              ) : (
                <>
                  <Button size="lg" onClick={handleGetStarted} className="gap-2 text-lg px-8">
                    Get Started Free
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => navigate("/auth")}
                    className="text-lg px-8"
                  >
                    Sign In
                  </Button>
                </>
              )}
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center gap-6 pt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                <span>End-to-end encrypted</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span>No cloud uploads</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>HIPAA compliant design</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Comprehensive Health Tracking</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Everything you need to monitor, track, and improve your health journey
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <FeatureCard
              icon={Scan}
              title="Advanced Scanner"
              description="Precise measurements with AI-powered analysis and trend tracking"
            />
            <FeatureCard
              icon={TrendingUp}
              title="Progress Tracking"
              description="Visual charts, milestones, and detailed history of your journey"
            />
            <FeatureCard
              icon={Brain}
              title="AI Insights"
              description="Personalized recommendations based on your unique data patterns"
            />
            <FeatureCard
              icon={Heart}
              title="Health Monitoring"
              description="Track key health indicators with smart alerts and reminders"
            />
            <FeatureCard
              icon={Users}
              title="Partner Sync"
              description="Securely share progress with your partner when you choose"
            />
            <FeatureCard
              icon={Sparkles}
              title="Premium Features"
              description="Advanced analytics, DLC content, and expert consultations"
            />
          </div>
        </div>
      </section>

      {/* Privacy Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <Badge variant="outline" className="border-primary/50">
                  <Lock className="h-3.5 w-3.5 mr-1.5" />
                  Privacy First
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold">Your Data, Your Control</h2>
                <p className="text-muted-foreground text-lg">
                  We built MorphoScan with privacy as the foundation. Your sensitive health data is
                  processed locally on your device and never uploaded to any server.
                </p>
                <ul className="space-y-3">
                  <PrivacyFeature text="All processing happens on your device" />
                  <PrivacyFeature text="Optional encrypted cloud backup" />
                  <PrivacyFeature text="No tracking or analytics on your health data" />
                  <PrivacyFeature text="Export or delete your data anytime" />
                </ul>
              </div>
              <div className="relative">
                <Card className="glass-card border-primary/20">
                  <CardContent className="p-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Shield className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">Local Processing</p>
                          <p className="text-sm text-muted-foreground">
                            Data never leaves your device
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Lock className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">Encrypted Storage</p>
                          <p className="text-sm text-muted-foreground">Military-grade encryption</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <CheckCircle2 className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">Your Choice</p>
                          <p className="text-sm text-muted-foreground">Control what you share</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold">Available On Your Platform</h2>
            <p className="text-muted-foreground text-lg">
              {BUILD_IS_STORE
                ? "Download from your preferred app store"
                : "Use directly in your browser or download our apps"}
            </p>

            <div className="flex flex-wrap justify-center gap-4 pt-4">
              {BUILD_IS_STORE ? (
                <>
                  <Button size="lg" variant="outline" className="gap-2">
                    <Smartphone className="h-5 w-5" />
                    App Store
                  </Button>
                  <Button size="lg" variant="outline" className="gap-2">
                    <Smartphone className="h-5 w-5" />
                    Google Play
                  </Button>
                </>
              ) : (
                <>
                  <Button size="lg" onClick={handleGetStarted} className="gap-2">
                    <Globe className="h-5 w-5" />
                    Use Web App
                  </Button>
                  {BUILD_IS_NSFW && (
                    <Button size="lg" variant="outline" className="gap-2">
                      <Download className="h-5 w-5" />
                      Download APK
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto bg-gradient-to-br from-primary/10 via-background to-accent/10 border-primary/20">
            <CardContent className="p-8 md:p-12 text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">Start Your Health Journey Today</h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                Join thousands of users who trust MorphoScan for their health tracking needs. Free
                to start, premium features available.
              </p>
              <div className="pt-4">
                <Button size="lg" onClick={handleGetStarted} className="gap-2 text-lg px-8">
                  {user ? "Open App" : "Get Started Free"}
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold">MorphoScan</span>
              <span className="text-muted-foreground text-sm">© {new Date().getFullYear()}</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <button
                onClick={() => navigate("/privacy")}
                className="hover:text-foreground transition-colors"
              >
                Privacy Policy
              </button>
              <button
                onClick={() => navigate("/terms")}
                className="hover:text-foreground transition-colors"
              >
                Terms of Service
              </button>
              <button
                onClick={() => navigate("/contact")}
                className="hover:text-foreground transition-colors"
              >
                Contact
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: any;
  title: string;
  description: string;
}) {
  return (
    <Card className="glass-card border-border/50 hover:border-primary/30 transition-colors">
      <CardContent className="p-6 space-y-4">
        <div className="p-3 rounded-lg bg-primary/10 w-fit">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function PrivacyFeature({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-3">
      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
      <span>{text}</span>
    </li>
  );
}
