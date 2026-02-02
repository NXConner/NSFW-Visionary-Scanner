import React from "react";

import { VisualContentDisplay } from "@/components/VisualContentDisplay";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Bookmark,
  CheckCircle,
  ChevronRight,
  Clock,
  HelpCircle,
  Info,
  Pill,
  Share2,
  Shield,
  Stethoscope,
  XCircle,
} from "lucide-react";

import type { VisualContent } from "@/lib/visualContentManager";
import type {
  HealthTopic,
  HealthTopicCategory,
  HealthTopicSeverity,
} from "@/components/educationCenter/types";

export function TopicDetailView({
  topic,
  onBack,
  healthVisuals,
  categoryIcons,
  categoryLabels,
  severityColors,
}: {
  topic: HealthTopic;
  onBack: () => void;
  healthVisuals: VisualContent[];
  categoryIcons: Record<HealthTopicCategory, React.ComponentType<{ className?: string }>>;
  categoryLabels: Record<HealthTopicCategory, string>;
  severityColors: Record<HealthTopicSeverity, string>;
}) {
  const Icon = categoryIcons[topic.category];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back Button */}
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Topics
      </Button>

      {/* Topic Header */}
      <Card variant="glass">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Icon className="w-6 h-6 text-primary" />
                <Badge variant="outline">{categoryLabels[topic.category]}</Badge>
                <Badge className={severityColors[topic.severity]}>
                  {topic.severity.charAt(0).toUpperCase() + topic.severity.slice(1)}
                </Badge>
              </div>
              <h1 className="text-3xl font-bold">{topic.title}</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Bookmark className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="symptoms">Symptoms</TabsTrigger>
          <TabsTrigger value="treatment">Treatment</TabsTrigger>
          <TabsTrigger value="prevention">Prevention</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                What is {topic.title}?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">{topic.overview}</p>
              {/* Visual content for condition */}
              {healthVisuals.length > 0 && (
                <div className="pt-4 border-t border-border/50">
                  <VisualContentDisplay
                    content={healthVisuals
                      .filter(v =>
                        v.tags.some(
                          tag =>
                            topic.title.toLowerCase().includes(tag) ||
                            tag.includes(topic.title.toLowerCase().split(" ")[0] ?? ""),
                        ),
                      )
                      .slice(0, 2)}
                    title="Visual Reference"
                    showThumbnails={true}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary" />
                Causes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {topic.causes.map((cause, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <ChevronRight className="w-4 h-4 text-primary mt-1 shrink-0" />
                    <span className="text-muted-foreground">{cause}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-primary" />
                Diagnosis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">{topic.diagnosis}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="symptoms" className="space-y-6">
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                Common Symptoms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-3">
                {topic.symptoms.map((symptom, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                    <XCircle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                    <span className="text-sm">{symptom}</span>
                  </div>
                ))}
              </div>
              {/* Visual symptom identification */}
              {healthVisuals.length > 0 && (
                <div className="pt-4 border-t border-border/50">
                  <VisualContentDisplay
                    content={healthVisuals
                      .filter(v =>
                        v.tags.some(
                          tag => topic.title.toLowerCase().includes(tag) || tag.includes("symptom"),
                        ),
                      )
                      .slice(0, 1)}
                    title="Symptom Visualization"
                    showThumbnails={false}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card variant="glass" className="border-warning/30 bg-warning/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-warning">
                <Clock className="w-5 h-5" />
                When to See a Doctor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {topic.whenToSeeDoctor.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="treatment" className="space-y-6">
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-primary" />
                Treatment Options
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {topic.treatment.map((treatment, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20"
                  >
                    <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>{treatment}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                <strong>Disclaimer:</strong> This information is for educational purposes only.
                Always consult a healthcare professional for diagnosis and treatment. Do not
                self-diagnose or self-treat based on this information.
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="prevention" className="space-y-6">
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-success" />
                Prevention Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-3">
                {topic.prevention.map((tip, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-lg bg-success/5 border border-success/20"
                  >
                    <CheckCircle className="w-4 h-4 text-success mt-0.5 shrink-0" />
                    <span className="text-sm">{tip}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faq" className="space-y-6">
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary" />
                Frequently Asked Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="space-y-2">
                {topic.faqs.map((faq, i) => (
                  <AccordionItem key={i} value={`faq-${i}`} className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <span className="text-left">{faq.question}</span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-muted-foreground">{faq.answer}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
