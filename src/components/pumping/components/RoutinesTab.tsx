import React from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Lightbulb } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { formatPressureRangeFromInHg, formatPressureTextInHg } from "@/lib/measurementsComparison";

import type { PumpingRoutine } from "@/components/pumping/types";

export function RoutinesTab({
  routines,
  onOpenVisualGuide,
}: {
  routines: PumpingRoutine[];
  onOpenVisualGuide: (routineName: string) => void;
}) {
  const { pressureUnits } = useSettings();
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        {routines.map((routine, index) => (
          <Card
            key={routine.name}
            variant="glass"
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardHeader>
              <CardTitle className="text-lg">{routine.name}</CardTitle>
              <div className="flex gap-2 flex-wrap">
                <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
                  {routine.duration}
                </span>
                <span className="px-2 py-1 rounded-full bg-accent/10 text-accent text-xs">
                  {formatPressureTextInHg(routine.pressure, pressureUnits)}
                </span>
                <span className="px-2 py-1 rounded-full bg-success/10 text-success text-xs">
                  {routine.frequency}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">{routine.description}</p>
              <div className="space-y-2">
                {routine.steps.map((step, i) => (
                  <div key={i} className="flex gap-2 text-sm">
                    <span className="text-primary font-mono">{i + 1}.</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => onOpenVisualGuide(routine.name)}
              >
                <Eye className="w-4 h-4 mr-2" />
                View Visual Guide
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tips & Recommendations */}
      <Card variant="glass" className="animate-fade-in-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-warning" />
            Tips & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="pressure">
              <AccordionTrigger>Optimal Pressure Levels</AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li>
                    • Beginners: {formatPressureRangeFromInHg(2, 3, pressureUnits)} (never exceed{" "}
                    {formatPressureTextInHg("5 inHg", pressureUnits)})
                  </li>
                  <li>
                    • Intermediate: {formatPressureRangeFromInHg(3, 5, pressureUnits)} with rest
                    periods
                  </li>
                  <li>
                    • Advanced: {formatPressureRangeFromInHg(5, 7, pressureUnits)} (only with
                    experience)
                  </li>
                  <li>• Never use "as much as possible" - more isn't better</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="duration">
              <AccordionTrigger>Session Duration Guidelines</AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Start with 10-minute sessions</li>
                  <li>• Take 1-2 minute breaks every 5 minutes</li>
                  <li>• Maximum 30 minutes total per session</li>
                  <li>• Quality over quantity - listen to your body</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="gains">
              <AccordionTrigger>Maximizing Gains Safely</AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Consistency beats intensity - regular sessions matter</li>
                  <li>• Combine with jelqing exercises (carefully)</li>
                  <li>• Stay hydrated and maintain good circulation</li>
                  <li>• Track everything to understand what works for you</li>
                  <li>• Temporary gains vs permanent gains take time</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="equipment">
              <AccordionTrigger>Equipment Care</AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Clean cylinder before and after each use</li>
                  <li>• Check seals and gaskets regularly</li>
                  <li>• Ensure pressure gauge is accurate</li>
                  <li>• Use silicone or water-based sleeve protectors</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
