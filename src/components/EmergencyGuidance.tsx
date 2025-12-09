import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle, Phone, MapPin, Clock, Heart, Zap,
  AlertCircle, Calendar, ChevronRight, ExternalLink,
  Building2 as Hospital, Info, Shield, Siren as Ambulance
} from "lucide-react";
import { VisualContentDisplay } from "./VisualContentDisplay";
import { useVisualContent } from "@/hooks/useVisualContent";
import { VISUAL_CONTENT_CATEGORIES } from "@/lib/visualContentManager";

interface EmergencySymptom {
  symptom: string;
  description: string;
  action: string;
}

const redFlagSymptoms: EmergencySymptom[] = [
  {
    symptom: "Priapism (Prolonged Erection)",
    description: "An erection lasting more than 4 hours, with or without sexual stimulation",
    action: "SEEK EMERGENCY CARE IMMEDIATELY. This can cause permanent damage if not treated within 4-6 hours."
  },
  {
    symptom: "Sudden Severe Pain",
    description: "Intense, sudden pain in the penis, testicles, or groin area",
    action: "Go to the emergency room immediately. Could indicate torsion, fracture, or other serious conditions."
  },
  {
    symptom: "Blood in Urine or Semen",
    description: "Visible blood (hematuria or hematospermia) that persists or is accompanied by pain",
    action: "Seek urgent medical evaluation to rule out injury, infection, or other serious conditions."
  },
  {
    symptom: "Penile Fracture",
    description: "A popping sound during sex followed by immediate loss of erection, severe pain, and rapid swelling",
    action: "EMERGENCY - Go to ER immediately. Surgical repair is often needed within 24 hours."
  },
  {
    symptom: "Urinary Retention",
    description: "Complete inability to urinate despite having a full bladder",
    action: "Seek emergency care immediately. A catheter may be needed to relieve the bladder."
  },
  {
    symptom: "Signs of Severe Infection",
    description: "Fever, pus discharge, red streaks spreading from the area, extreme swelling",
    action: "Emergency care needed. Infections can spread rapidly and become life-threatening."
  },
  {
    symptom: "Testicular Torsion Signs",
    description: "Sudden severe testicular pain, swelling, nausea, and one testicle appearing higher",
    action: "EMERGENCY - Surgery needed within 6 hours to save the testicle."
  },
  {
    symptom: "Loss of Sensation",
    description: "Sudden numbness or complete loss of feeling in genitals",
    action: "Seek immediate evaluation. Could indicate nerve damage or circulatory issues."
  },
];

const urgentSymptoms: EmergencySymptom[] = [
  {
    symptom: "Persistent Painful Urination",
    description: "Burning or pain during urination lasting more than 2-3 days",
    action: "See a doctor within 24-48 hours. May indicate UTI or STI requiring treatment."
  },
  {
    symptom: "Unusual Discharge",
    description: "New or abnormal discharge from the penis, especially if colored or odorous",
    action: "Schedule urgent appointment. STI testing recommended."
  },
  {
    symptom: "New Sores or Lesions",
    description: "Blisters, ulcers, or open sores appearing on genitals",
    action: "See doctor within 24-48 hours. Testing needed to determine cause."
  },
  {
    symptom: "Sudden Curvature Change",
    description: "Rapid or significant change in penile curvature, especially with pain",
    action: "Schedule appointment within 1-2 days. Early Peyronie's treatment is more effective."
  },
  {
    symptom: "Significant Unexplained Swelling",
    description: "Swelling not related to injury that persists or worsens",
    action: "Seek medical evaluation within 24-48 hours."
  },
];

const scheduleSymptoms: EmergencySymptom[] = [
  {
    symptom: "Gradual Curvature Progression",
    description: "Slow increase in penile curvature over weeks or months",
    action: "Schedule urologist appointment to discuss treatment options and monitoring."
  },
  {
    symptom: "Erectile Difficulties",
    description: "Trouble achieving or maintaining erections",
    action: "Schedule appointment with urologist. Many effective treatments available."
  },
  {
    symptom: "Recurring Infections",
    description: "Repeated yeast infections or balanitis episodes",
    action: "Schedule appointment to identify underlying causes and prevention strategies."
  },
  {
    symptom: "Skin Changes",
    description: "New or changing moles, patches, or discoloration",
    action: "Schedule dermatology appointment for evaluation."
  },
  {
    symptom: "Decreased Sensitivity",
    description: "Gradual loss of sensation over time",
    action: "Discuss with doctor at next visit. May be age-related or indicate other issues."
  },
];

export const EmergencyGuidance = () => {
  const [expandedSection, setExpandedSection] = useState<string>("emergency");

  // Load visual content for emergency/safety guidance
  const { content: safetyVisuals } = useVisualContent({
    categories: [
      VISUAL_CONTENT_CATEGORIES.SAFETY,
      VISUAL_CONTENT_CATEGORIES.SYMPTOMS,
    ],
    autoLoad: true,
    autoInvert: true,
  });

  const handleCall911 = () => {
    window.location.href = "tel:911";
  };

  const handleFindER = () => {
    window.open("https://www.google.com/maps/search/emergency+room+near+me", "_blank");
  };

  return (
    <section className="min-h-screen px-4 py-20">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <Badge variant="destructive" className="mb-4 animate-pulse">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Medical Emergency Reference
          </Badge>
          <h1 className="text-3xl font-bold mb-2">When to See a Doctor</h1>
          <p className="text-muted-foreground">
            Know the warning signs that require immediate, urgent, or scheduled medical attention
          </p>
        </div>

        {/* Emergency Quick Actions */}
        <Card className="mb-6 border-destructive/50 bg-destructive/5">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <Button 
                variant="destructive" 
                size="lg" 
                className="gap-2 w-full sm:w-auto"
                onClick={handleCall911}
              >
                <Phone className="w-5 h-5" />
                Call 911
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="gap-2 border-destructive text-destructive hover:bg-destructive/10 w-full sm:w-auto"
                onClick={handleFindER}
              >
                <MapPin className="w-5 h-5" />
                Find Nearest ER
              </Button>
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4">
              If you're experiencing a life-threatening emergency, call 911 immediately
            </p>
          </CardContent>
        </Card>

        {/* Emergency Numbers Card */}
        <Card variant="glass" className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Phone className="w-4 h-4 text-primary" />
              Emergency Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <Ambulance className="w-5 h-5 text-destructive" />
                <div>
                  <p className="font-medium text-sm">Emergency</p>
                  <p className="text-destructive font-bold">911</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20">
                <Hospital className="w-5 h-5 text-warning" />
                <div>
                  <p className="font-medium text-sm">Poison Control</p>
                  <p className="text-warning font-bold">1-800-222-1222</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                <Heart className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium text-sm">Health Hotline</p>
                  <p className="text-primary font-bold">1-800-CDC-INFO</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Symptom Categories */}
        <Accordion type="single" value={expandedSection} onValueChange={setExpandedSection} className="space-y-4">
          {/* Red Flag - Emergency */}
          <AccordionItem value="emergency" className="border-none">
            <Card className="border-destructive/50 overflow-hidden">
              <AccordionTrigger className="px-6 py-4 hover:no-underline [&[data-state=open]]:bg-destructive/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-destructive/20">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-destructive">🚨 Emergency - Call 911 or Go to ER</h3>
                    <p className="text-sm text-muted-foreground">Requires immediate medical attention</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {redFlagSymptoms.map((item, index) => (
                      <div 
                        key={index}
                        className="p-4 rounded-lg bg-destructive/5 border border-destructive/20"
                      >
                        <div className="flex items-start gap-3">
                          <Zap className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-destructive mb-1">{item.symptom}</h4>
                            <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                            <div className="p-2 rounded bg-destructive/10 border border-destructive/30">
                              <p className="text-xs font-medium text-destructive">
                                ⚡ {item.action}
                              </p>
                            </div>
                            {/* Visual aid for symptom recognition */}
                            {safetyVisuals.length > 0 && index < safetyVisuals.length && (
                              <div className="mt-3 pt-3 border-t border-destructive/20">
                                <VisualContentDisplay
                                  content={[safetyVisuals[index % safetyVisuals.length]]}
                                  title="Visual Reference"
                                  showThumbnails={false}
                                  className="max-w-md"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          {/* Urgent - 24-48 Hours */}
          <AccordionItem value="urgent" className="border-none">
            <Card className="border-warning/50 overflow-hidden">
              <AccordionTrigger className="px-6 py-4 hover:no-underline [&[data-state=open]]:bg-warning/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-warning/20">
                    <Clock className="w-5 h-5 text-warning" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-warning">⚠️ Urgent - See Doctor Within 24-48 Hours</h3>
                    <p className="text-sm text-muted-foreground">Needs prompt medical evaluation</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {urgentSymptoms.map((item, index) => (
                      <div 
                        key={index}
                        className="p-4 rounded-lg bg-warning/5 border border-warning/20"
                      >
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-warning mb-1">{item.symptom}</h4>
                            <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                            <div className="p-2 rounded bg-warning/10 border border-warning/30">
                              <p className="text-xs font-medium text-warning">
                                📋 {item.action}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          {/* Schedule - 1-2 Weeks */}
          <AccordionItem value="schedule" className="border-none">
            <Card className="border-primary/50 overflow-hidden">
              <AccordionTrigger className="px-6 py-4 hover:no-underline [&[data-state=open]]:bg-primary/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-primary">📅 Schedule Appointment - 1-2 Weeks</h3>
                    <p className="text-sm text-muted-foreground">Should be evaluated but not urgent</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {scheduleSymptoms.map((item, index) => (
                      <div 
                        key={index}
                        className="p-4 rounded-lg bg-primary/5 border border-primary/20"
                      >
                        <div className="flex items-start gap-3">
                          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-primary mb-1">{item.symptom}</h4>
                            <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                            <div className="p-2 rounded bg-primary/10 border border-primary/30">
                              <p className="text-xs font-medium text-primary">
                                ✓ {item.action}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>
        </Accordion>

        {/* Important Reminder */}
        <Card variant="glass" className="mt-6">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <Shield className="w-6 h-6 text-primary shrink-0" />
              <div>
                <h4 className="font-semibold mb-2">Important Reminder</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  This guide is for reference only. When in doubt, always err on the side of caution 
                  and seek medical attention. Early intervention often leads to better outcomes.
                </p>
                <p className="text-sm font-medium text-primary">
                  "We're a tool, for your tool. Don't be a fool—we're not a doctor."
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
