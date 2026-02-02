import React from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, Hand, Shield, ThermometerSun } from "lucide-react";

import type { ProstateHealthGuide } from "@/components/mensHealthGuide/types";

export function ProstateHealthCard({ guide }: { guide: ProstateHealthGuide }) {
  return (
    <Card className="glass-morphism">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {guide.icon}
          {guide.title}
        </CardTitle>
        <CardDescription>
          Understanding prostate health becomes increasingly important as men age.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 rounded-lg bg-muted/50">
          <h4 className="font-semibold text-primary mb-2">What Is the Prostate?</h4>
          <p className="text-sm text-muted-foreground">{guide.content.whatIsProstate}</p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="benefits">
            <AccordionTrigger className="font-medium">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-400" /> Benefits of Prostate Massage
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-2">
                {guide.content.benefits.map((benefit, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-green-400 mt-1 shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="how-to">
            <AccordionTrigger className="font-medium">
              <span className="flex items-center gap-2">
                <Hand className="h-4 w-4 text-blue-400" /> How to Safely Massage
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <ol className="space-y-3">
                {guide.content.howToSafely.map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <span className="bg-primary/20 text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs shrink-0">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="warnings">
            <AccordionTrigger className="font-medium">
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-400" /> Warnings & Contraindications
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <Alert className="mb-4 border-orange-500/50 bg-orange-500/10">
                <AlertTriangle className="h-4 w-4 text-orange-400" />
                <AlertTitle className="text-orange-400">Important Warnings</AlertTitle>
                <AlertDescription className="text-xs">
                  Do not perform prostate massage if any of these conditions apply.
                </AlertDescription>
              </Alert>
              <ul className="space-y-2">
                {guide.content.warnings.map((warning, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-orange-300">
                    <AlertTriangle className="h-3 w-3 text-orange-400 mt-1 shrink-0" />
                    {warning}
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="symptoms">
            <AccordionTrigger className="font-medium">
              <span className="flex items-center gap-2">
                <ThermometerSun className="h-4 w-4 text-red-400" /> Signs of Prostate Problems
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-2">
                {guide.content.signsOfProstateProblems.map((sign, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <ThermometerSun className="h-3 w-3 text-red-400 mt-1 shrink-0" />
                    {sign}
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="screening">
            <AccordionTrigger className="font-medium">
              <span className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-cyan-400" /> Screening Recommendations
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-2">
                {guide.content.screeningRecommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Shield className="h-3 w-3 text-cyan-400 mt-1 shrink-0" />
                    {rec}
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
