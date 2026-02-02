import { Button } from "@/components/ui/button";
import { ArrowRight, Scan, Shield, Lock, Heart } from "lucide-react";
import { MeshGradient, Reveal, TiltCard } from "@/components/premium";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { hapticMedium } from "@/lib/haptics";

interface CTASectionProps {
  onGetStarted: () => void;
}

export const CTASection = ({ onGetStarted }: CTASectionProps) => {
  const premiumMesh = useFeatureFlag("premium_mesh");

  const handleViewFeatures = () => {
    const el = document.getElementById("features");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.dispatchEvent(new CustomEvent("navigate-tab", { detail: "home" }));
      requestAnimationFrame(() => {
        const el2 = document.getElementById("features");
        el2?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  };

  return (
    <section className="py-20 px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 gradient-primary opacity-10" />
      <div className="absolute inset-0 pointer-events-none">
        {premiumMesh && <MeshGradient variant="hero" intensity="subtle" />}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto max-w-4xl relative z-10">
        <Reveal variant="wipe" className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Heart className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">Start Your Growth Journey</span>
          </div>

          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to Take Control of
            <br />
            <span className="gradient-text">Your Progress?</span>
          </h2>

          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of men who are achieving their goals with precise tracking, expert
            guidance, and complete privacy.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              variant="hero"
              onClick={() => {
                hapticMedium();
                onGetStarted();
              }}
              className="group"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="glass" size="xl" onClick={handleViewFeatures}>
              View Features
            </Button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-muted-foreground">
            <TiltCard variant="glass" className="px-4 py-3 rounded-2xl">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-success" />
                <span className="text-sm">100% Private</span>
              </div>
            </TiltCard>
            <TiltCard variant="glass" className="px-4 py-3 rounded-2xl">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                <span className="text-sm">AES-256 Encryption</span>
              </div>
            </TiltCard>
            <TiltCard variant="glass" className="px-4 py-3 rounded-2xl">
              <div className="flex items-center gap-2">
                <Scan className="w-5 h-5 text-accent" />
                <span className="text-sm">AI-Powered Analysis</span>
              </div>
            </TiltCard>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
