import React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, BookOpen, ChevronRight } from "lucide-react";

import type { PumpingSafetyTip } from "@/components/pumping/types";

export function SafetyTab({
  safetyTips,
  stopSignsLeft,
  stopSignsRight,
}: {
  safetyTips: PumpingSafetyTip[];
  stopSignsLeft: string[];
  stopSignsRight: string[];
}) {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {safetyTips.map((tip, index) => (
          <Card
            key={tip.title}
            variant="glass"
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center mb-4">
                <tip.icon className="w-6 h-6 text-warning" />
              </div>
              <h3 className="font-semibold mb-2">{tip.title}</h3>
              <p className="text-sm text-muted-foreground">{tip.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Warning Signs */}
      <Card variant="glass" className="border-destructive/50 animate-fade-in-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Stop Immediately If You Experience
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <ul className="space-y-2">
              {stopSignsLeft.map(t => (
                <li key={t} className="flex items-center gap-2 text-destructive">
                  <ChevronRight className="w-4 h-4" />
                  {t}
                </li>
              ))}
            </ul>
            <ul className="space-y-2">
              {stopSignsRight.map(t => (
                <li key={t} className="flex items-center gap-2 text-destructive">
                  <ChevronRight className="w-4 h-4" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            If symptoms persist after stopping, consult a healthcare professional immediately.
          </p>
        </CardContent>
      </Card>

      {/* Educational Content */}
      <Card variant="glass" className="animate-fade-in-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Understanding How Pumping Works
          </CardTitle>
        </CardHeader>
        <CardContent className="prose prose-invert max-w-none">
          <p className="text-muted-foreground">
            Vacuum pumping creates negative pressure around the tissue, causing increased blood flow
            and temporary expansion of the corpus cavernosum. Regular use may lead to:
          </p>
          <ul className="text-muted-foreground space-y-2 mt-4">
            <li>
              <strong className="text-foreground">Temporary gains:</strong> Immediate post-session
              increases due to blood engorgement (typically lasting 1-24 hours)
            </li>
            <li>
              <strong className="text-foreground">Cumulative effects:</strong> With consistent,
              long-term use, some users report semi-permanent improvements in EQ and size
            </li>
            <li>
              <strong className="text-foreground">Improved circulation:</strong> Regular use may
              help maintain healthy blood flow and tissue elasticity
            </li>
          </ul>
          <p className="text-sm text-muted-foreground mt-4 italic">
            Note: Results vary significantly between individuals. Scientific studies on permanent
            gains are limited. Always prioritize safety over aggressive gains.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
