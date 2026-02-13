/**
 * Guide Placeholder - SFW version for app stores
 * Shows upgrade prompt for health guide features
 */

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Lock, Sparkles, GraduationCap, FileText } from "lucide-react";
import { UnlockPremiumCta } from "./UnlockPremiumCta";

export const GuidePlaceholder: React.FC = () => {
  return (
    <section className="min-h-screen px-4 py-20">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-4">
            Premium Feature
          </Badge>
          <h1 className="text-3xl font-bold gradient-text mb-4">Health Guide</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Comprehensive educational resources and health information.
          </p>
        </div>

        <Card className="glass-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-6 rounded-full bg-primary/10 mb-6">
              <BookOpen className="w-16 h-16 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold mb-3">Health Education Center</h2>
            <p className="text-muted-foreground max-w-md mb-8">
              Access expert health guides, wellness tips, and educational content.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8 max-w-sm">
              {[
                { icon: GraduationCap, label: "Expert Guides" },
                { icon: FileText, label: "Health Articles" },
                { icon: Sparkles, label: "Wellness Tips" },
                { icon: Lock, label: "Premium Content" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                  <Icon className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">{label}</span>
                </div>
              ))}
            </div>

            <UnlockPremiumCta />
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default GuidePlaceholder;
