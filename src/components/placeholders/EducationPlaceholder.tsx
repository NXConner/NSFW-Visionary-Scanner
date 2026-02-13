/**
 * Education Placeholder - SFW version for app stores
 * Shows upgrade prompt for education center features
 */

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Lock, Video, FileText } from "lucide-react";
import { UnlockPremiumCta } from "./UnlockPremiumCta";

export const EducationPlaceholder: React.FC = () => {
  return (
    <section className="min-h-screen px-4 py-20">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-4">
            Premium Feature
          </Badge>
          <h1 className="text-3xl font-bold gradient-text mb-4">Education Center</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Learn from expert-curated educational content and resources.
          </p>
        </div>

        <Card className="glass-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-6 rounded-full bg-primary/10 mb-6">
              <GraduationCap className="w-16 h-16 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold mb-3">Learning Resources</h2>
            <p className="text-muted-foreground max-w-md mb-8">
              Access comprehensive tutorials, guides, and educational materials.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8 max-w-sm">
              {[
                { icon: Video, label: "Video Tutorials" },
                { icon: FileText, label: "Written Guides" },
                { icon: GraduationCap, label: "Expert Content" },
                { icon: Lock, label: "Premium Access" },
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

export default EducationPlaceholder;
