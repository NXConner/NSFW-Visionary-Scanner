import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Stethoscope,
  Pill,
  Activity,
  AlertCircle,
  HeartPulse,
  Users,
  Image as ImageIcon,
} from "lucide-react";
import { VisualContentDisplay } from "./VisualContentDisplay";
import { useVisualContent } from "@/hooks/useVisualContent";
import { VISUAL_CONTENT_CATEGORIES } from "@/lib/visualContentManager";

const educationalSections = {
  overview: {
    title: "Understanding Peyronie's Disease",
    icon: BookOpen,
    content: [
      {
        question: "What is Peyronie's Disease?",
        answer:
          "Peyronie's disease is a condition where fibrous scar tissue (plaque) forms inside the penis, causing curved, painful erections. It's named after French surgeon François Gigot de la Peyronie, who first described it in 1743. The condition affects approximately 6-10% of men, typically between ages 40-70, though it can occur at any age.",
      },
      {
        question: "What causes Peyronie's Disease?",
        answer:
          "The exact cause is not fully understood, but it's believed to result from repeated injury to the penis during sexual activity or physical trauma. When the penis heals, scar tissue forms in a disorganized manner, creating the plaque. Risk factors include genetics, connective tissue disorders, age, prostate surgery, and certain health conditions like diabetes.",
      },
      {
        question: "What are the two phases of Peyronie's Disease?",
        answer:
          "Acute Phase: Lasts 6-18 months. During this phase, plaque forms, the penis may curve progressively, and pain during erections is common. Chronic Phase: The plaque and curvature stabilize. Pain typically resolves, but the curvature remains without treatment. Most treatments are more effective in the chronic phase.",
      },
      {
        question: "How common is this condition?",
        answer:
          "Studies suggest 6-10% of men have Peyronie's disease, though the actual number may be higher as many men don't seek treatment due to embarrassment. It becomes more common with age and is associated with erectile dysfunction in about 30-50% of cases.",
      },
    ],
  },
  symptoms: {
    title: "Signs & Symptoms",
    icon: Activity,
    content: [
      {
        question: "What are the main symptoms?",
        answer:
          "Common symptoms include: curved or bent penis during erection, hard lumps or bands of tissue (plaque) under the skin, pain during erections or intercourse, shortening of the penis, erectile dysfunction, indentation or hourglass appearance, and difficulty with sexual intercourse due to curvature.",
      },
      {
        question: "Does Peyronie's Disease cause pain?",
        answer:
          "Pain is most common during the acute phase and typically occurs during erections. About 35-45% of men experience pain, which usually improves within 12-18 months as the disease enters the chronic phase. Some men never experience significant pain.",
      },
      {
        question: "Can the curvature change over time?",
        answer:
          "Yes. During the acute phase (first 12-18 months), the curvature may progressively worsen. Once the disease stabilizes in the chronic phase, the curvature typically remains stable. In some cases (about 12-13%), the curvature may improve slightly without treatment.",
      },
      {
        question: "When should I see a doctor?",
        answer:
          "Consult a urologist if you notice: a new bend or curve in your penis, pain during erections, difficulty with sexual activity, hard lumps under the penile skin, or any change in the shape of your penis. Early diagnosis can help determine the best treatment approach.",
      },
    ],
  },
  treatment: {
    title: "Treatment Options",
    icon: Pill,
    content: [
      {
        question: "What treatments are available?",
        answer:
          "Treatment options include: Observation (for mild cases), Oral medications (vitamin E, potassium para-aminobenzoate, pentoxifylline), Injections (Xiaflex/collagenase, verapamil, interferon), Traction therapy devices, Shockwave therapy, and Surgery (for severe cases that don't respond to other treatments).",
      },
      {
        question: "What is Xiaflex (Collagenase)?",
        answer:
          "Xiaflex is the only FDA-approved medication specifically for Peyronie's disease. It's an enzyme injected directly into the plaque that breaks down collagen, helping to reduce curvature. Treatment typically involves a series of injections combined with penile modeling exercises. It's most effective for curvature between 30-90 degrees.",
      },
      {
        question: "Does surgery cure Peyronie's Disease?",
        answer:
          "Surgery can effectively correct curvature but is typically reserved for men with stable disease (chronic phase) who have significant curvature affecting sexual function. Surgical options include: Plication (shortening the longer side), Grafting (lengthening the shorter side), and Penile implants (for men with both curvature and severe erectile dysfunction).",
      },
      {
        question: "Are there natural treatments?",
        answer:
          "Some men try supplements like vitamin E, L-arginine, or coenzyme Q10, though scientific evidence for their effectiveness is limited. Traction therapy using medical devices has shown promise in some studies. Always consult a healthcare provider before trying any treatment.",
      },
    ],
  },
  lifestyle: {
    title: "Living with Peyronie's",
    icon: HeartPulse,
    content: [
      {
        question: "How does this affect relationships?",
        answer:
          "Peyronie's disease can significantly impact intimate relationships and psychological well-being. Open communication with your partner is essential. Many couples benefit from counseling to address emotional concerns. Remember that sexual intimacy involves more than penetration, and alternative forms of intimacy can maintain connection.",
      },
      {
        question: "What about psychological effects?",
        answer:
          "Depression, anxiety, and relationship stress are common. Studies show 48% of men with Peyronie's disease report depression. Seeking support from mental health professionals, support groups, or online communities can be helpful. Remember that this is a medical condition, not something to be ashamed of.",
      },
      {
        question: "Can I still have a normal sex life?",
        answer:
          "Many men with Peyronie's disease maintain satisfying sexual relationships. This may require: trying different positions, using lubrication, communicating openly with partners, treating any associated erectile dysfunction, and possibly using aids or devices recommended by doctors.",
      },
      {
        question: "Are there lifestyle changes that help?",
        answer:
          "While lifestyle changes won't cure the condition, they may help: Quit smoking (smoking impairs healing), Maintain a healthy weight, Exercise regularly, Manage conditions like diabetes, Avoid penile injury during intercourse, and Consider stress management techniques.",
      },
    ],
  },
  support: {
    title: "Getting Support",
    icon: Users,
    content: [
      {
        question: "Where can I find support?",
        answer:
          "Support resources include: Urologists specializing in men's health, Sexual health clinics, Online patient communities and forums, The Association of Peyronie's Disease Advocates (APDA), Mental health professionals familiar with sexual health issues, and Your primary care physician for referrals.",
      },
      {
        question: "What questions should I ask my doctor?",
        answer:
          "Consider asking: What stage is my condition in? What are all my treatment options? What are the risks and benefits of each? How will this affect my sexual function? Should I see a specialist? Are there clinical trials I might qualify for? What can I expect without treatment?",
      },
      {
        question: "How can I track my condition?",
        answer:
          "Tracking helps you and your doctor monitor progression: Take regular measurements (length, circumference, angle), Document pain levels and when they occur, Note any changes in erectile function, Keep photos for comparison (this app can help), Record treatments tried and their effects.",
      },
      {
        question: "What's the outlook for this condition?",
        answer:
          "The outlook varies by individual. About 12-13% of men see improvement without treatment, 40-50% remain stable, and the rest may worsen. With treatment, many men see significant improvement in curvature and function. Early intervention and proper management can lead to better outcomes.",
      },
    ],
  },
};

export const EducationalContent = () => {
  const [activeTab, setActiveTab] = useState("overview");

  // Load visual content for educational purposes
  const { content: educationalVisuals, isLoading: isLoadingVisuals } = useVisualContent({
    categories: [
      VISUAL_CONTENT_CATEGORIES.EDUCATIONAL,
      VISUAL_CONTENT_CATEGORIES.ANATOMY,
      VISUAL_CONTENT_CATEGORIES.HEALTH_CONDITIONS,
    ],
    autoLoad: true,
    autoInvert: true,
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 rounded-xl gradient-primary mb-4">
          <BookOpen className="w-8 h-8 text-primary-foreground" />
        </div>
        <h2 className="text-3xl font-bold gradient-text mb-2">Educational Resources</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Learn about Peyronie's disease, its causes, symptoms, and treatment options. This
          information is for educational purposes and should not replace medical advice.
        </p>
      </div>

      <Card className="glass-card border-border/50">
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start overflow-x-auto flex-nowrap rounded-t-lg rounded-b-none h-auto p-1 bg-muted/30">
              {Object.entries(educationalSections).map(([key, section]) => {
                const Icon = section.icon;
                return (
                  <TabsTrigger
                    key={key}
                    value={key}
                    className="flex items-center gap-2 data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground whitespace-nowrap"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{section.title.split(" ")[0]}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {Object.entries(educationalSections).map(([key, section]) => (
              <TabsContent key={key} value={key} className="p-6 mt-0">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-2">{section.title}</h3>
                  <div className="h-1 w-20 gradient-primary rounded-full" />
                </div>

                <Accordion type="single" collapsible className="space-y-3">
                  {section.content.map((item, itemIndex) => (
                    <AccordionItem
                      key={item.question}
                      value={item.question}
                      className="border border-border/50 rounded-lg px-4 bg-muted/10 data-[state=open]:bg-muted/20"
                    >
                      <AccordionTrigger className="hover:no-underline py-4">
                        <span className="text-left font-medium">{item.question}</span>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-4 leading-relaxed space-y-4">
                        <p>{item.answer}</p>
                        {/* Visual aids for educational content */}
                        {educationalVisuals.length > 0 && itemIndex < educationalVisuals.length && (
                          <div className="mt-4 pt-4 border-t border-border/50">
                            <div className="flex items-center gap-2 mb-2">
                              <ImageIcon className="w-4 h-4 text-primary" />
                              <span className="text-sm font-medium">Visual Reference</span>
                            </div>
                            <VisualContentDisplay
                              content={[educationalVisuals[itemIndex % educationalVisuals.length]]}
                              showThumbnails={false}
                              className="max-w-md"
                            />
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <Card className="glass-card border-border/50 mt-6">
        <CardContent className="flex items-start gap-4 p-6">
          <div className="p-2 rounded-lg bg-yellow-500/20">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h4 className="font-semibold mb-1">Medical Disclaimer</h4>
            <p className="text-sm text-muted-foreground">
              This educational content is provided for informational purposes only and should not be
              considered medical advice. Always consult with a qualified healthcare professional for
              diagnosis, treatment recommendations, and answers to your medical questions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
