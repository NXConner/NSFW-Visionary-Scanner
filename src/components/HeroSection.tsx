import { Button } from "@/components/ui/button";
import { ScannerVisualization } from "@/components/ScannerVisualization";
import { FeatureShowcase } from "@/components/FeatureShowcase";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { CTASection } from "@/components/CTASection";
import { ArrowRight, Shield, Zap, Eye, Heart, TrendingUp, Lock, Activity, Scan, FileText, AlertTriangle } from "lucide-react";

interface HeroSectionProps {
  onGetStarted: () => void;
}

export const HeroSection = ({ onGetStarted }: HeroSectionProps) => {
  const features = [
    { icon: Shield, label: "100% Private", desc: "All data stays on your device" },
    { icon: Activity, label: "Peyronie's Detection", desc: "AI-powered curvature analysis" },
    { icon: FileText, label: "Detailed Reports", desc: "Comprehensive health insights" },
  ];

  const healthFeatures = [
    { icon: Scan, label: "2D/3D Scanning", desc: "Advanced morphology measurement" },
    { icon: Eye, label: "Visual Health Analysis", desc: "Detect skin conditions & infections" },
    { icon: TrendingUp, label: "Growth Tracking", desc: "Monitor progress over time" },
    { icon: Lock, label: "Encrypted Storage", desc: "Military-grade data protection" },
  ];

  return (
    <>
      <section className="min-h-screen flex flex-col items-center justify-center px-4 pt-20 pb-12 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
          <div 
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--primary)) 1px, transparent 0)`,
              backgroundSize: '40px 40px'
            }}
          />
        </div>

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div className="text-center lg:text-left space-y-8 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <Heart className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-sm text-primary font-medium">Complete Men's Health Platform</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="text-foreground">Advanced </span>
                <span className="gradient-text">Penis Health</span>
                <br />
                <span className="text-foreground">Monitoring System</span>
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0">
                The most comprehensive private health tracker for men. AI-powered scanning for 
                <strong className="text-foreground"> Peyronie's disease detection</strong>, curvature analysis, 
                STI visual screening, growth tracking, and detailed health reports.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button variant="hero" onClick={onGetStarted} className="group">
                  Start Health Assessment
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button variant="glass" size="xl">
                  Learn About Peyronie's
                </Button>
              </div>

              {/* Health Focus Badge */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/30 max-w-md mx-auto lg:mx-0">
                <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
                <p className="text-xs text-muted-foreground">
                  <strong className="text-warning">Early detection matters.</strong> Regular monitoring can help identify 
                  Peyronie's disease and other conditions early.
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 pt-8 border-t border-border/50">
                <div>
                  <div className="text-xl md:text-2xl font-bold gradient-text">100%</div>
                  <div className="text-xs text-muted-foreground">Private</div>
                </div>
                <div>
                  <div className="text-xl md:text-2xl font-bold gradient-text">AI</div>
                  <div className="text-xs text-muted-foreground">Analysis</div>
                </div>
                <div>
                  <div className="text-xl md:text-2xl font-bold gradient-text">2D/3D</div>
                  <div className="text-xs text-muted-foreground">Models</div>
                </div>
                <div>
                  <div className="text-xl md:text-2xl font-bold gradient-text">8+</div>
                  <div className="text-xs text-muted-foreground">Detections</div>
                </div>
              </div>
            </div>

            {/* Scanner Visualization */}
            <div className="flex justify-center lg:justify-end animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <ScannerVisualization />
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-20">
            {features.map((feature, index) => (
              <div
                key={feature.label}
                className="glass-card p-6 rounded-2xl hover:border-primary/30 transition-all duration-300 group animate-fade-in-up"
                style={{ animationDelay: `${0.4 + index * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.label}</h3>
                <p className="text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>

          {/* Health Features Grid */}
          <div className="mt-16">
            <h3 className="text-center text-2xl font-bold mb-8">
              Complete <span className="gradient-text">Health Analysis</span> Suite
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {healthFeatures.map((feature, index) => (
                <div
                  key={feature.label}
                  className="p-4 rounded-xl bg-secondary/30 border border-border/50 hover:border-primary/30 transition-all duration-300 animate-fade-in-up"
                  style={{ animationDelay: `${0.6 + index * 0.1}s` }}
                >
                  <feature.icon className="w-8 h-8 text-primary mb-3" />
                  <h4 className="font-semibold mb-1">{feature.label}</h4>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* Feature Showcase */}
      <FeatureShowcase />
      
      {/* Testimonials */}
      <TestimonialsSection />
      
      {/* CTA */}
      <CTASection onGetStarted={onGetStarted} />
    </>
  );
};