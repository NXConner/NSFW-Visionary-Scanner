import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MeshGradient, Reveal, TiltCard, TiltLayer, AnimatedCheckmark } from "@/components/premium";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { hapticSelection } from "@/lib/haptics";
import {
  Camera,
  Activity,
  Shield,
  Brain,
  Ruler,
  TrendingUp,
  ChevronRight,
  Heart,
  FileText,
  Eye,
  AlertTriangle,
  Scan,
  Layers,
} from "lucide-react";

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  benefits: string[];
  gradient: string;
  tab: string;
}

interface FeatureShowcaseProps {
  onNavigate?: (tab: string) => void;
}

export const FeatureShowcase = ({ onNavigate }: FeatureShowcaseProps) => {
  const [activeFeature, setActiveFeature] = useState(0);
  const premiumMesh = useFeatureFlag("premium_mesh");

  const features: Feature[] = [
    {
      id: "peyronies",
      title: "Peyronie's Disease Detection",
      description:
        "AI-powered scanning to detect curvature abnormalities, plaque formations, and early signs of Peyronie's disease with detailed risk assessment.",
      icon: AlertTriangle,
      benefits: [
        "Curvature angle measurement",
        "Plaque detection analysis",
        "Risk score calculation",
        "Progress monitoring",
      ],
      gradient: "from-warning to-warning/50",
      tab: "scanner",
    },
    {
      id: "scanner",
      title: "Advanced 2D/3D Scanning",
      description:
        "Medical-grade scanning technology to measure length, circumference, girth, and generate detailed 2D cross-sections and 3D models.",
      icon: Scan,
      benefits: [
        "2D & 3D model generation",
        "Millimeter precision",
        "Volume estimation",
        "Surface area calculation",
      ],
      gradient: "from-primary to-primary/50",
      tab: "scanner",
    },
    {
      id: "health",
      title: "Visual Health Analysis",
      description:
        "Comprehensive visual screening for skin conditions, STI indicators, fungal infections, and vascular health abnormalities.",
      icon: Eye,
      benefits: [
        "Skin condition detection",
        "Infection screening",
        "Vascular assessment",
        "Color & texture analysis",
      ],
      gradient: "from-destructive to-destructive/50",
      tab: "scanner",
    },
    {
      id: "reports",
      title: "Comprehensive Reports",
      description:
        "Detailed health reports with measurements, detections, predictions, charts, and actionable recommendations for your records.",
      icon: FileText,
      benefits: ["Detailed analysis", "Growth charts", "Export to PDF", "Share with doctor"],
      gradient: "from-success to-success/50",
      tab: "diary",
    },
    {
      id: "pumping",
      title: "Pumping Therapy Tracker",
      description:
        "Track pumping sessions with duration, pressure settings, and pre/post measurements to monitor growth progression safely.",
      icon: Activity,
      benefits: ["Session logging", "Pressure tracking", "Growth analytics", "Safety reminders"],
      gradient: "from-accent to-accent/50",
      tab: "pumping",
    },
    {
      id: "ai",
      title: "AI Growth Predictions",
      description:
        "Machine learning algorithms analyze your data to predict 30-day and 90-day growth trajectories with personalized recommendations.",
      icon: Brain,
      benefits: [
        "Pattern detection",
        "Growth forecasting",
        "Personalized tips",
        "Routine optimization",
      ],
      gradient: "from-cyan-500 to-cyan-500/50",
      tab: "ai-chat",
    },
  ];

  const handleTryFeature = (tab: string) => {
    if (onNavigate) {
      onNavigate(tab);
    } else {
      window.dispatchEvent(new CustomEvent("navigate-tab", { detail: tab }));
    }
  };

  return (
    <section id="features" className="py-20 px-4 relative overflow-hidden">
      {premiumMesh && <MeshGradient variant="hero" intensity="subtle" />}
      <div className="container mx-auto max-w-6xl">
        <Reveal variant="wipe" className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Heart className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">Complete Health Suite</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Medical-Grade <span className="gradient-text">Health Analysis</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            From Peyronie's disease detection to comprehensive health reports - everything you need
            for complete penis health monitoring with clinical-grade accuracy and total privacy.
          </p>
        </Reveal>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Feature List */}
          <div className="space-y-3">
            {features.map((feature, index) => (
              <Reveal key={feature.id} delay={index * 0.03} className="will-change-transform">
                <TiltCard
                  variant={activeFeature === index ? "glass" : "default"}
                  className={`cursor-pointer transition-all duration-300 ${
                    activeFeature === index
                      ? "border-primary/50 scale-[1.02]"
                      : "hover:border-primary/30"
                  }`}
                  onClick={() => {
                    hapticSelection();
                    setActiveFeature(index);
                  }}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <TiltLayer depth={10} z={10} className="shrink-0">
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center`}
                      >
                        <feature.icon className="w-6 h-6 text-primary-foreground" />
                      </div>
                    </TiltLayer>
                    <TiltLayer depth={6} z={6} className="flex-1 min-w-0">
                      <h3 className="font-semibold">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {feature.description}
                      </p>
                    </TiltLayer>
                    <TiltLayer depth={12} z={12} className="shrink-0">
                      <ChevronRight
                        className={`w-5 h-5 transition-transform ${
                          activeFeature === index
                            ? "rotate-90 text-primary"
                            : "text-muted-foreground"
                        }`}
                      />
                    </TiltLayer>
                  </CardContent>
                </TiltCard>
              </Reveal>
            ))}
          </div>

          {/* Feature Detail */}
          <Reveal variant="fade-up" className="sticky top-24">
            <TiltCard variant="glass" className="p-8" glow>
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${features[activeFeature].gradient} flex items-center justify-center mb-6`}
              >
                {(() => {
                  const Icon = features[activeFeature].icon;
                  return <Icon className="w-8 h-8 text-primary-foreground" />;
                })()}
              </div>
              <h3 className="text-2xl font-bold mb-3">{features[activeFeature].title}</h3>
              <p className="text-muted-foreground mb-6">{features[activeFeature].description}</p>

              <div className="space-y-3 mb-6">
                {features[activeFeature].benefits.map((benefit, benefitIndex) => (
                  <div key={benefit} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <AnimatedCheckmark
                        size={14}
                        color="hsl(var(--primary))"
                        delay={benefitIndex * 0.1}
                      />
                    </div>
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>

              {features[activeFeature].id === "peyronies" && (
                <div className="p-4 rounded-lg bg-warning/10 border border-warning/30 mb-6">
                  <p className="text-sm text-muted-foreground">
                    <AlertTriangle className="w-4 h-4 inline mr-2 text-warning" />
                    <strong className="text-warning">Early detection is key.</strong> Peyronie's
                    disease affects up to 10% of men. Regular monitoring can help catch changes
                    early.
                  </p>
                </div>
              )}

              <Button
                variant="gradient"
                className="w-full"
                onClick={() => handleTryFeature(features[activeFeature].tab)}
              >
                Try {features[activeFeature].title}
                <ChevronRight className="w-5 h-5" />
              </Button>
            </TiltCard>
          </Reveal>
        </div>
      </div>
    </section>
  );
};
