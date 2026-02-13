import * as React from "react";
import { BookOpen, Heart, HeartHandshake, Link, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { CockWorshipingEducation } from "./cockWorshiping";
import { BondageBdsmEducation } from "./bondageBdsm";
import { TantricEducation } from "./tantric";
import { KamaSutraEducation } from "./kamaSutra";
import { SubmissiveEducation } from "./submissive";

type CategoryKey = "cock-worshiping" | "bondage-bdsm" | "tantric" | "kama-sutra" | "submissive";

const CATEGORIES: Array<{
  key: CategoryKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}> = [
  {
    key: "cock-worshiping",
    label: "Cock Worshiping",
    icon: HeartHandshake,
    description: "Admiration and attention-focused intimacy",
  },
  {
    key: "bondage-bdsm",
    label: "Bondage & BDSM",
    icon: Link,
    description: "Power exchange and restraint play",
  },
  {
    key: "submissive",
    label: "Submissive Dynamics",
    icon: HeartHandshake,
    description: "Understanding healthy submission",
  },
  {
    key: "tantric",
    label: "Tantric Practices",
    icon: Heart,
    description: "Mindful intimacy and energy work",
  },
  {
    key: "kama-sutra",
    label: "Kama Sutra",
    icon: BookOpen,
    description: "Ancient wisdom on love and connection",
  },
];

interface NsfwEducationHubProps {
  initialCategory?: CategoryKey;
}

export function NsfwEducationHub({ initialCategory = "cock-worshiping" }: NsfwEducationHubProps): JSX.Element {
  const [activeCategory, setActiveCategory] = React.useState<CategoryKey>(initialCategory);

  const renderContent = () => {
    switch (activeCategory) {
      case "cock-worshiping":
        return <CockWorshipingEducation />;
      case "bondage-bdsm":
        return <BondageBdsmEducation />;
      case "tantric":
        return <TantricEducation />;
      case "kama-sutra":
        return <KamaSutraEducation />;
      case "submissive":
        return <SubmissiveEducation />;
      default:
        return <CockWorshipingEducation />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Intimate Education</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Consent-first, safety-focused educational content for adults exploring intimacy.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Badge variant="secondary">18+ Only</Badge>
          <Badge variant="outline">Educational</Badge>
          <Badge variant="outline">Consent-focused</Badge>
        </div>
      </div>

      {/* Category selector */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {CATEGORIES.map(cat => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={[
                "p-4 rounded-xl border transition-all text-left",
                isActive
                  ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                  : "border-border/50 bg-background/40 hover:border-primary/50 hover:bg-primary/5",
              ].join(" ")}
            >
              <Icon className={`h-5 w-5 mb-2 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
              <div className={`font-medium text-sm ${isActive ? "text-primary" : "text-foreground"}`}>
                {cat.label}
              </div>
              <div className="text-xs text-muted-foreground mt-1 hidden md:block">{cat.description}</div>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="mt-6">{renderContent()}</div>
    </div>
  );
}

export default NsfwEducationHub;
