/**
 * AI Chat Placeholder - SFW version for app stores
 * Shows upgrade prompt for AI assistant features
 */

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Lock, Brain, Zap } from "lucide-react";
import { UnlockPremiumCta } from "./UnlockPremiumCta";

export const AIChatPlaceholder: React.FC = () => {
  return (
    <section className="min-h-screen px-4 py-20">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-4">
            Premium Feature
          </Badge>
          <h1 className="text-3xl font-bold gradient-text mb-4">AI Health Assistant</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Get personalized health guidance powered by advanced AI.
          </p>
        </div>

        <Card className="glass-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-6 rounded-full bg-primary/10 mb-6">
              <MessageSquare className="w-16 h-16 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold mb-3">Smart Health Assistant</h2>
            <p className="text-muted-foreground max-w-md mb-8">
              Chat with our AI assistant for personalized health tips and wellness guidance.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8 max-w-sm">
              {[
                { icon: Brain, label: "AI-Powered" },
                { icon: Zap, label: "Instant Responses" },
                { icon: MessageSquare, label: "24/7 Available" },
                { icon: Lock, label: "Private & Secure" },
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

export default AIChatPlaceholder;
