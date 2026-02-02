import * as React from "react";
import { AlertTriangle, BookOpen, HeartHandshake, Info, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { SUBMISSIVE_CONTENT } from "./content";
import type { EducationSection, EducationTone } from "./types";

function toneBadgeVariant(tone?: EducationTone): "secondary" | "outline" {
  if (!tone) return "outline";
  if (tone === "safety" || tone === "consent") return "secondary";
  return "outline";
}

function SectionCard({ section }: { section: EducationSection }): JSX.Element {
  return (
    <Card className="glass-card border-border/50">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl">{section.title}</CardTitle>
        {section.summary ? <CardDescription className="text-sm">{section.summary}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {section.bullets && section.bullets.length > 0 ? (
          <div className="space-y-2">
            {section.bullets.map(b => (
              <div key={b.id} className="flex items-start gap-3 rounded-xl border border-border/50 bg-background/40 p-3">
                <div className="pt-0.5">
                  <Info className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="text-sm text-foreground leading-relaxed">{b.text}</div>
                  {b.tone ? (
                    <div>
                      <Badge variant={toneBadgeVariant(b.tone)} className="text-[10px] uppercase tracking-wide">
                        {b.tone}
                      </Badge>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {section.callouts && section.callouts.length > 0 ? (
          <div className="space-y-2">
            {section.callouts.map(c => (
              <div
                key={c.id}
                className={[
                  "rounded-xl border p-4 bg-background/40",
                  c.tone === "warning" ? "border-destructive/40" : "border-border/50",
                ].join(" ")}
              >
                <div className="flex items-center gap-2 font-semibold">
                  {c.tone === "warning" ? (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  ) : c.tone === "tip" ? (
                    <ShieldCheck className="h-4 w-4 text-primary" />
                  ) : (
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div>{c.title}</div>
                </div>
                <div className="text-sm text-muted-foreground mt-1 leading-relaxed">{c.body}</div>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function SubmissiveEducation(): JSX.Element {
  const content = SUBMISSIVE_CONTENT;

  const sectionsById = React.useMemo(() => {
    const map = new Map<string, EducationSection>();
    for (const s of content.sections) map.set(s.id, s);
    return map;
  }, [content.sections]);

  const primaryOrder = ["overview", "why", "key-components", "how-to", "communication", "boundaries-safety", "aftercare", "faq"];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2">
          <div className="p-2 rounded-xl bg-muted/30 border border-border/50">
            <HeartHandshake className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">{content.title}</h2>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">{content.subtitle}</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Badge variant="secondary">18+ Educational</Badge>
          <Badge variant="outline">Consent-first</Badge>
          <Badge variant="outline">Safety-focused</Badge>
        </div>
      </div>

      <Card className="glass-card border-border/50">
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" /> {content.disclaimer.title}
          </CardTitle>
          <CardDescription>{content.disclaimer.body}</CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="guide" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="guide">Guide</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="guide" className="space-y-5 mt-5">
          {primaryOrder.map(id => {
            const section = sectionsById.get(id);
            if (!section) return null;
            return <SectionCard key={section.id} section={section} />;
          })}
        </TabsContent>

        <TabsContent value="resources" className="space-y-4 mt-5">
          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Quick tools</CardTitle>
              <CardDescription>Resources for healthy submissive dynamics.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {content.resources.map(r => (
                <div key={r.id} className="rounded-xl border border-border/50 bg-background/40 p-4 space-y-2">
                  <div className="font-semibold">{r.title}</div>
                  <div className="text-sm text-muted-foreground">{r.description}</div>
                  <div className="flex flex-wrap gap-2">
                    {r.tags.map(t => (
                      <Badge key={`${r.id}-${t}`} variant="outline" className="text-[10px] uppercase tracking-wide">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SubmissiveEducation;
