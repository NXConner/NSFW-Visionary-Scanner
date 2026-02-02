import React from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Circle, CreditCard, Ruler, Target } from "lucide-react";

import type { ReferenceType } from "@/components/calibrationWizard/types";

export function Step1ReferenceSelect({
  referenceType,
  setReferenceType,
  customWidth,
  setCustomWidth,
  customHeight,
  setCustomHeight,
}: {
  referenceType: ReferenceType;
  setReferenceType: (t: ReferenceType) => void;
  customWidth: number;
  setCustomWidth: (n: number) => void;
  customHeight: number;
  setCustomHeight: (n: number) => void;
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Select Reference Object</h3>
        <p className="text-sm text-muted-foreground">
          Choose an object with known dimensions to calibrate measurements
        </p>
      </div>

      <Tabs value={referenceType} onValueChange={v => setReferenceType(v as ReferenceType)}>
        <TabsList className="grid grid-cols-3 sm:grid-cols-6 w-full h-auto flex-wrap gap-1">
          <TabsTrigger value="credit-card" className="flex items-center gap-1 text-xs px-2 py-1.5">
            <CreditCard className="w-3 h-3" />
            <span className="hidden sm:inline">Card</span>
          </TabsTrigger>
          <TabsTrigger value="ruler" className="flex items-center gap-1 text-xs px-2 py-1.5">
            <Ruler className="w-3 h-3" />
            <span className="hidden sm:inline">Ruler</span>
          </TabsTrigger>
          <TabsTrigger value="quarter" className="flex items-center gap-1 text-xs px-2 py-1.5">
            <Circle className="w-3 h-3" />
            <span className="hidden sm:inline">Quarter</span>
          </TabsTrigger>
          <TabsTrigger value="nickel" className="flex items-center gap-1 text-xs px-2 py-1.5">
            <Circle className="w-3 h-3" />
            <span className="hidden sm:inline">Nickel</span>
          </TabsTrigger>
          <TabsTrigger value="dime" className="flex items-center gap-1 text-xs px-2 py-1.5">
            <Circle className="w-3 h-3" />
            <span className="hidden sm:inline">Dime</span>
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex items-center gap-1 text-xs px-2 py-1.5">
            <Target className="w-3 h-3" />
            <span className="hidden sm:inline">Custom</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="credit-card" className="mt-4">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-32 h-20 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                  <CreditCard className="w-12 h-12 text-primary-foreground" />
                </div>
                <div>
                  <h4 className="font-semibold">Standard Credit Card</h4>
                  <p className="text-sm text-muted-foreground">ISO/IEC 7810 ID-1 standard</p>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span>
                      <strong>Width:</strong> 85.6mm
                    </span>
                    <span>
                      <strong>Height:</strong> 53.98mm
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ruler" className="mt-4">
          <Card className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-32 h-8 rounded bg-gradient-to-r from-accent to-accent/60 flex items-center justify-between px-2 shadow-lg">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="w-px h-4 bg-accent-foreground/50" />
                  ))}
                </div>
                <div>
                  <h4 className="font-semibold">10cm Ruler Section</h4>
                  <p className="text-sm text-muted-foreground">Mark first 10cm on any ruler</p>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span>
                      <strong>Width:</strong> 100mm
                    </span>
                    <span>
                      <strong>Height:</strong> ~30mm
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quarter" className="mt-4">
          <Card className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xs">25¢</span>
                </div>
                <div>
                  <h4 className="font-semibold">US Quarter</h4>
                  <p className="text-sm text-muted-foreground">Standard US quarter dollar coin</p>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span>
                      <strong>Diameter:</strong> 24.26mm
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nickel" className="mt-4">
          <Card className="bg-gradient-to-br from-slate-400/5 to-slate-400/10 border-slate-400/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-300 to-slate-500 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xs">5¢</span>
                </div>
                <div>
                  <h4 className="font-semibold">US Nickel</h4>
                  <p className="text-sm text-muted-foreground">Standard US five cent coin</p>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span>
                      <strong>Diameter:</strong> 21.21mm
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dime" className="mt-4">
          <Card className="bg-gradient-to-br from-zinc-400/5 to-zinc-400/10 border-zinc-400/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-zinc-300 to-zinc-500 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-[10px]">10¢</span>
                </div>
                <div>
                  <h4 className="font-semibold">US Dime</h4>
                  <p className="text-sm text-muted-foreground">Standard US ten cent coin</p>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span>
                      <strong>Diameter:</strong> 17.91mm
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="mt-4">
          <Card className="border-border/50">
            <CardContent className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter the exact dimensions of your reference object
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customWidth">Width (mm)</Label>
                  <Input
                    id="customWidth"
                    type="number"
                    value={customWidth}
                    onChange={e => setCustomWidth(Number(e.target.value))}
                    min={10}
                    max={300}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customHeight">Height (mm)</Label>
                  <Input
                    id="customHeight"
                    type="number"
                    value={customHeight}
                    onChange={e => setCustomHeight(Number(e.target.value))}
                    min={10}
                    max={300}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
