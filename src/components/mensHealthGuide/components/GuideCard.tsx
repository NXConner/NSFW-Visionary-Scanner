import React from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VisualContentDisplay } from "@/components/VisualContentDisplay";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Eye,
  Info,
  Shield,
  ThermometerSun,
  XCircle,
  Zap,
} from "lucide-react";

import type { VisualContent } from "@/lib/visualContentManager";
import type { GuideSection, RiskLevel } from "@/components/mensHealthGuide/types";
import { ExperienceBadge, RiskBadge } from "@/components/mensHealthGuide/components/badges";
import { VisualStepsDisplay } from "@/components/mensHealthGuide/components/VisualStepsDisplay";

export function GuideCard({
  guide,
  riskLevel,
  showVisualSteps = true,
  exerciseVisuals = [],
  setShowVisualGuide,
}: {
  guide: GuideSection;
  riskLevel: RiskLevel;
  showVisualSteps?: boolean;
  exerciseVisuals?: VisualContent[];
  setShowVisualGuide?: (title: string) => void;
}) {
  return (
    <Card className="glass-morphism">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            {guide.icon}
            {guide.title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <ExperienceBadge levels={guide.experienceLevel} />
            <RiskBadge level={riskLevel} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 rounded-lg bg-muted/50">
          <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
            <Info className="h-4 w-4" /> What Is It?
          </h4>
          <p className="text-sm text-muted-foreground">{guide.whatIsIt}</p>
        </div>

        {/* Visual Step-by-Step Guide */}
        {showVisualSteps && guide.visualSteps && guide.visualSteps.length > 0 && (
          <div className="p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Eye className="h-4 w-4 text-blue-400" /> Visual Step-by-Step Guide
              </h4>
              {setShowVisualGuide && (
                <Button variant="outline" size="sm" onClick={() => setShowVisualGuide(guide.title)}>
                  View Interactive Guide
                </Button>
              )}
            </div>
            <VisualStepsDisplay steps={guide.visualSteps} />
            {/* Visual content display */}
            {exerciseVisuals.length > 0 && (
              <div className="mt-4">
                <VisualContentDisplay
                  content={exerciseVisuals.slice(0, 3)}
                  title="Technique Demonstrations"
                  showThumbnails={true}
                  className="mt-4"
                />
              </div>
            )}
          </div>
        )}

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="how-to">
            <AccordionTrigger className="text-sm font-medium">
              <span className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-400" /> Detailed Instructions
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-2">
                {guide.howToUse.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-primary font-mono text-xs mt-1">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ul>
              {/* Visual demonstration for this technique */}
              {exerciseVisuals.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border/50">
                  <VisualContentDisplay
                    content={exerciseVisuals
                      .filter(v =>
                        v.tags.some(
                          tag =>
                            guide.title.toLowerCase().includes(tag) ||
                            tag.includes(guide.title.toLowerCase().split(" ")[0] ?? ""),
                        ),
                      )
                      .slice(0, 2)}
                    title="Visual Demonstration"
                    showThumbnails={false}
                  />
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="benefits">
            <AccordionTrigger className="text-sm font-medium">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-400" /> Benefits
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-2">
                {guide.benefits.map((benefit, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-green-400 mt-1 shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="cons">
            <AccordionTrigger className="text-sm font-medium">
              <span className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-yellow-400" /> Cons & Limitations
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-2">
                {guide.cons.map((con, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <XCircle className="h-3 w-3 text-yellow-400 mt-1 shrink-0" />
                    {con}
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="warnings">
            <AccordionTrigger className="text-sm font-medium">
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-400" /> Warnings
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-2">
                {guide.warnings.map((warning, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-orange-300">
                    <AlertTriangle className="h-3 w-3 text-orange-400 mt-1 shrink-0" />
                    {warning}
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="dangers">
            <AccordionTrigger className="text-sm font-medium">
              <span className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-red-400" /> Dangers
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Serious Risks</AlertTitle>
                <AlertDescription className="text-xs">
                  These dangers can occur with improper use. Always prioritize safety.
                </AlertDescription>
              </Alert>
              <ul className="space-y-2">
                {guide.dangers.map((danger, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-red-300">
                    <Zap className="h-3 w-3 text-red-400 mt-1 shrink-0" />
                    {danger}
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="safety">
            <AccordionTrigger className="text-sm font-medium">
              <span className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-cyan-400" /> Safety Tips
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-2">
                {guide.safetyTips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Shield className="h-3 w-3 text-cyan-400 mt-1 shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="signs">
            <AccordionTrigger className="text-sm font-medium">
              <span className="flex items-center gap-2">
                <ThermometerSun className="h-4 w-4 text-purple-400" /> What to Look For
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-2">
                {guide.whatToLookFor.map((sign, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <ThermometerSun className="h-3 w-3 text-purple-400 mt-1 shrink-0" />
                    {sign}
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
