import React, { useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Reveal } from "@/components/premium/Reveal";
import { useVisualContent, VISUAL_CONTENT_CATEGORIES } from "@/hooks/useVisualContent";
import { useDLC } from "@/dlc/context/DLCContext";
import { AgeVerificationModal } from "@/dlc/components/AgeVerificationModal";
import { emitNavigateTab } from "@/lib/appEvents";
import {
  AlertTriangle,
  Circle,
  CircleDot,
  Dumbbell,
  Filter,
  Gauge,
  GraduationCap,
  Hand,
  Heart,
  Lock,
} from "lucide-react";

import type { ExperienceLevel, GuideSection } from "@/components/mensHealthGuide/types";
import {
  ballStretchersGuide,
  clampingGuide,
  cockRingsGuide,
  hangersGuide,
  hydroPumpGuide,
  jelqingGuide,
  kegelExercisesGuide,
  penisExtenderGuide,
  prostateHealthGuide,
  pumpingGuide,
  stretchingGuide,
  testicularHealthGuide,
} from "@/components/mensHealthGuide/data";
import {
  GuideCard,
  ProstateHealthCard,
  TesticularHealthCard,
  VisualGuideDialog,
} from "@/components/mensHealthGuide/components";

const allGuides: GuideSection[] = [
  pumpingGuide,
  stretchingGuide,
  jelqingGuide,
  hangersGuide,
  penisExtenderGuide,
  hydroPumpGuide,
  kegelExercisesGuide,
  clampingGuide,
  cockRingsGuide,
  ballStretchersGuide,
];

const EXPERIENCE_LEVELS: ExperienceLevel[] = ["all", "beginner", "intermediate", "advanced"];

const TAB_IDS = ["enhancement", "exercises", "devices", "rings", "testicular", "prostate"] as const;
type TabId = (typeof TAB_IDS)[number];

const riskByTitle: Record<string, "low" | "medium" | "high" | "extreme"> = {
  [pumpingGuide.title]: "medium",
  [stretchingGuide.title]: "low",
  [jelqingGuide.title]: "medium",
  [hangersGuide.title]: "high",
  [penisExtenderGuide.title]: "high",
  [hydroPumpGuide.title]: "medium",
  [kegelExercisesGuide.title]: "low",
  [clampingGuide.title]: "extreme",
  [cockRingsGuide.title]: "low",
  [ballStretchersGuide.title]: "medium",
};

const MensHealthGuide: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>("enhancement");
  const [experienceFilter, setExperienceFilter] = useState<ExperienceLevel>("all");
  const [showVisualGuide, setShowVisualGuide] = useState<string | null>(null);
  const [showAgeModal, setShowAgeModal] = useState(false);
  const { isAgeVerified, isLoading: dlcLoading } = useDLC();

  // Load visual content for exercises and techniques
  const { content: exerciseVisuals } = useVisualContent({
    categories: [
      VISUAL_CONTENT_CATEGORIES.EXERCISES,
      VISUAL_CONTENT_CATEGORIES.TECHNIQUES,
      VISUAL_CONTENT_CATEGORIES.EQUIPMENT,
    ],
    autoLoad: true,
    autoInvert: true,
  });

  // Show loading while DLC context is loading
  if (dlcLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const filterByExperience = (guide: GuideSection) => {
    if (experienceFilter === "all") return true;
    return guide.experienceLevel.includes(experienceFilter);
  };

  const filteredAny = allGuides.some(filterByExperience);

  // This tab includes adult anatomy/sexual-health educational content.
  // Gate behind the same age verification system used for NSFW/DLC features.
  if (!isAgeVerified) {
    return (
      <div className="space-y-6">
        <AgeVerificationModal
          isOpen={showAgeModal}
          onClose={() => setShowAgeModal(false)}
          onVerified={() => {
            setShowAgeModal(false);
            // Age verified - content will now be accessible
          }}
        />
        <Reveal variant="fade-up" delay={0}>
          <Card className="glass-morphism">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-3 py-10">
                <div className="p-4 rounded-full bg-muted/30">
                  <Lock className="h-10 w-10 text-muted-foreground" />
                </div>
                <div className="space-y-2 max-w-2xl">
                  <h2 className="text-2xl font-bold text-foreground">Age Verification Required</h2>
                  <p className="text-muted-foreground">
                    This guide includes adult-only educational content. Please verify you are 18+ to
                    continue.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 mt-2">
                  <Button onClick={() => setShowAgeModal(true)}>Verify Age</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </Reveal>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AgeVerificationModal
        isOpen={showAgeModal}
        onClose={() => setShowAgeModal(false)}
        onVerified={() => {
          setShowAgeModal(false);
        }}
      />
      <Reveal variant="fade-up" delay={0}>
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">Complete Men's Health Guide</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Comprehensive educational resources on penis enhancement methods, testicular health, and
            prostate care. Always prioritize safety and consult professionals when needed.
          </p>
        </div>
      </Reveal>

      {/* Experience Level Filter */}
      <Reveal variant="fade-up" delay={0.1}>
        <Card className="glass-morphism">
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Experience Level Filter</p>
                  <p className="text-xs text-muted-foreground">
                    Filter content by your experience level
                  </p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {EXPERIENCE_LEVELS.map(level => (
                  <Button
                    key={level}
                    variant={experienceFilter === level ? "default" : "outline"}
                    size="sm"
                    onClick={() => setExperienceFilter(level)}
                    className={experienceFilter === level ? "" : "hover:bg-muted/50"}
                  >
                    {level === "all" ? (
                      <>
                        <Filter className="h-3 w-3 mr-1" /> All
                      </>
                    ) : (
                      `${level.charAt(0).toUpperCase()}${level.slice(1)}`
                    )}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </Reveal>

      <Reveal variant="fade-up" delay={0.15}>
        <Alert className="border-primary/50 bg-primary/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Medical Disclaimer</AlertTitle>
          <AlertDescription className="text-sm">
            This information is for educational purposes only. These techniques carry inherent
            risks. Consult a healthcare provider before starting any enhancement program, especially
            if you have existing medical conditions. Stop any activity if you experience pain.
          </AlertDescription>
        </Alert>
      </Reveal>

      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as TabId)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 gap-1 h-auto p-1">
          <TabsTrigger value="enhancement" className="text-xs py-2">
            <Gauge className="h-3 w-3 mr-1" /> Enhancement
          </TabsTrigger>
          <TabsTrigger value="exercises" className="text-xs py-2">
            <Hand className="h-3 w-3 mr-1" /> Exercises
          </TabsTrigger>
          <TabsTrigger value="devices" className="text-xs py-2">
            <Dumbbell className="h-3 w-3 mr-1" /> Devices
          </TabsTrigger>
          <TabsTrigger value="rings" className="text-xs py-2">
            <Circle className="h-3 w-3 mr-1" /> Rings
          </TabsTrigger>
          <TabsTrigger value="testicular" className="text-xs py-2">
            <CircleDot className="h-3 w-3 mr-1" /> Testicular
          </TabsTrigger>
          <TabsTrigger value="prostate" className="text-xs py-2">
            <Heart className="h-3 w-3 mr-1" /> Prostate
          </TabsTrigger>
        </TabsList>

        <TabsContent value="enhancement" className="space-y-6 mt-6">
          {filterByExperience(pumpingGuide) ? (
            <GuideCard
              guide={pumpingGuide}
              riskLevel={riskByTitle[pumpingGuide.title]}
              exerciseVisuals={exerciseVisuals}
              setShowVisualGuide={setShowVisualGuide}
            />
          ) : (
            <Alert>
              <AlertDescription>
                No content matches your selected experience level in this category.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="exercises" className="space-y-6 mt-6">
          {filterByExperience(stretchingGuide) && (
            <GuideCard
              guide={stretchingGuide}
              riskLevel={riskByTitle[stretchingGuide.title]}
              exerciseVisuals={exerciseVisuals}
              setShowVisualGuide={setShowVisualGuide}
            />
          )}
          {filterByExperience(jelqingGuide) && (
            <GuideCard
              guide={jelqingGuide}
              riskLevel={riskByTitle[jelqingGuide.title]}
              exerciseVisuals={exerciseVisuals}
              setShowVisualGuide={setShowVisualGuide}
            />
          )}
          {filterByExperience(kegelExercisesGuide) && (
            <>
              <GuideCard
                guide={kegelExercisesGuide}
                riskLevel={riskByTitle[kegelExercisesGuide.title]}
                exerciseVisuals={exerciseVisuals}
                setShowVisualGuide={setShowVisualGuide}
              />
              <Card className="glass-morphism">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">
                        Want a deeper Kegels walkthrough?
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Open the dedicated Pelvic Floor hub for illustrated technique, pros/cons,
                        troubleshooting, and video demos.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => emitNavigateTab("pelvic-floor")}>
                        Open Pelvic Floor
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
          {!filterByExperience(stretchingGuide) &&
            !filterByExperience(jelqingGuide) &&
            !filterByExperience(kegelExercisesGuide) && (
              <Alert>
                <AlertDescription>
                  No exercises match your selected experience level.
                </AlertDescription>
              </Alert>
            )}
        </TabsContent>

        <TabsContent value="devices" className="space-y-6 mt-6">
          {filterByExperience(hangersGuide) && (
            <GuideCard
              guide={hangersGuide}
              riskLevel={riskByTitle[hangersGuide.title]}
              exerciseVisuals={exerciseVisuals}
            />
          )}
          {filterByExperience(penisExtenderGuide) && (
            <GuideCard
              guide={penisExtenderGuide}
              riskLevel={riskByTitle[penisExtenderGuide.title]}
              exerciseVisuals={exerciseVisuals}
              setShowVisualGuide={setShowVisualGuide}
            />
          )}
          {filterByExperience(hydroPumpGuide) && (
            <GuideCard
              guide={hydroPumpGuide}
              riskLevel={riskByTitle[hydroPumpGuide.title]}
              exerciseVisuals={exerciseVisuals}
              setShowVisualGuide={setShowVisualGuide}
            />
          )}
          {filterByExperience(clampingGuide) && (
            <GuideCard
              guide={clampingGuide}
              riskLevel={riskByTitle[clampingGuide.title]}
              exerciseVisuals={exerciseVisuals}
            />
          )}
          {!filterByExperience(hangersGuide) &&
            !filterByExperience(penisExtenderGuide) &&
            !filterByExperience(hydroPumpGuide) &&
            !filterByExperience(clampingGuide) && (
              <Alert>
                <AlertDescription>
                  No devices match your selected experience level. These are for
                  intermediate/advanced users.
                </AlertDescription>
              </Alert>
            )}
        </TabsContent>

        <TabsContent value="rings" className="space-y-6 mt-6">
          {filterByExperience(cockRingsGuide) && (
            <GuideCard
              guide={cockRingsGuide}
              riskLevel={riskByTitle[cockRingsGuide.title]}
              exerciseVisuals={exerciseVisuals}
            />
          )}
          {filterByExperience(ballStretchersGuide) && (
            <GuideCard
              guide={ballStretchersGuide}
              riskLevel={riskByTitle[ballStretchersGuide.title]}
              exerciseVisuals={exerciseVisuals}
            />
          )}
          {!filterByExperience(cockRingsGuide) && !filterByExperience(ballStretchersGuide) && (
            <Alert>
              <AlertDescription>
                No ring content matches your selected experience level.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="testicular" className="space-y-6 mt-6">
          <TesticularHealthCard guide={testicularHealthGuide} />
        </TabsContent>

        <TabsContent value="prostate" className="space-y-6 mt-6">
          <ProstateHealthCard guide={prostateHealthGuide} />
        </TabsContent>
      </Tabs>

      {!filteredAny && (
        <Alert>
          <AlertDescription>No content matches your selected experience level.</AlertDescription>
        </Alert>
      )}

      <VisualGuideDialog
        openTitle={showVisualGuide}
        onClose={() => setShowVisualGuide(null)}
        guides={allGuides}
        exerciseVisuals={exerciseVisuals}
      />
    </div>
  );
};

export default MensHealthGuide;
