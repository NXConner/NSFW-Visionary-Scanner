import { useEffect, useMemo } from "react";
import {
  ExternalLink,
  HeartHandshake,
  Info,
  MessageSquare,
  PlayCircle,
  Shield,
  Stethoscope,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { RouteTopNav } from "@/components/navigation/RouteTopNav";
import { APP_NAME } from "@/config/brand";

type ResourceItem = {
  name: string;
  url?: string;
  description: string;
  tags?: string[];
  note?: string;
};

function ExternalAnchor({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={[
        "inline-flex items-center gap-1 text-primary underline underline-offset-4 hover:text-primary/90",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
      <ExternalLink className="h-3.5 w-3.5 opacity-80" aria-hidden="true" />
    </a>
  );
}

const CreditsResources = () => {
  useEffect(() => {
    document.title = `Credits & Resources - ${APP_NAME}`;
  }, []);

  const sections = useMemo(() => {
    const reddit: ResourceItem[] = [
      {
        name: "r/gettingbigger",
        url: "https://www.reddit.com/r/gettingbigger/",
        description:
          "Community discussion, logs, questions, and shared experience (follow subreddit rules).",
        tags: ["community", "reddit"],
      },
      {
        name: "Reddit communities (general)",
        url: "https://www.reddit.com/",
        description:
          "A huge set of communities—use search and read each community’s rules before posting.",
        tags: ["community", "reddit"],
        note: "Some communities may contain adult content. Use discretion and follow local laws.",
      },
    ];

    const youtube: ResourceItem[] = [
      {
        name: "Hink (YouTube)",
        url: "https://www.youtube.com/results?search_query=hink",
        description:
          "YouTube search for “Hink” (share the exact channel link if you want it pinned).",
        tags: ["video", "youtube"],
      },
      {
        name: "DB (YouTube)",
        url: "https://www.youtube.com/results?search_query=db",
        description:
          "YouTube search for “DB” (share the exact channel link if you want it pinned).",
        tags: ["video", "youtube"],
      },
    ];

    const communitiesAndSites: ResourceItem[] = [
      {
        name: "Thunder’s Place",
        url: "https://www.thundersplace.com/",
        description: "Forum and community discussions (user-generated content).",
        tags: ["community", "forum"],
        note: "We’re not affiliated. Follow site rules and practice personal safety online.",
      },
      {
        name: "Getting Bigger (web)",
        url: "https://www.gettingbigger.com/",
        description:
          "Community and information hub (verify any health claims with medical sources).",
        tags: ["community", "information"],
      },
    ];

    const medicalAndResearch: ResourceItem[] = [
      {
        name: "MedlinePlus (NIH)",
        url: "https://medlineplus.gov/",
        description:
          "Evidence-based, plain-language health information from the U.S. National Library of Medicine.",
        tags: ["medical", "evidence-based"],
      },
      {
        name: "Mayo Clinic",
        url: "https://www.mayoclinic.org/",
        description: "Clinical overviews and patient education articles.",
        tags: ["medical"],
      },
      {
        name: "Cleveland Clinic",
        url: "https://my.clevelandclinic.org/",
        description: "Trusted patient education and condition overviews.",
        tags: ["medical"],
      },
      {
        name: "PubMed",
        url: "https://pubmed.ncbi.nlm.nih.gov/",
        description: "Search biomedical research papers and abstracts.",
        tags: ["research", "evidence-based"],
      },
    ];

    return [
      { id: "thanks", title: "Thank you", icon: HeartHandshake, items: [] as ResourceItem[] },
      { id: "reddit", title: "Reddit communities", icon: MessageSquare, items: reddit },
      { id: "youtube", title: "YouTube creators", icon: PlayCircle, items: youtube },
      { id: "sites", title: "Websites & forums", icon: Shield, items: communitiesAndSites },
      {
        id: "medical",
        title: "Medical & research references",
        icon: Stethoscope,
        items: medicalAndResearch,
      },
    ] as const;
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <RouteTopNav
        title="Credits & Resources"
        backTo="/"
        backLabel="Home"
        showFullNavigation={true}
        actions={[
          {
            key: "icon",
            kind: "custom",
            node: (
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                <HeartHandshake className="w-4 h-4 text-primary" />
                <span>Attribution</span>
              </div>
            ),
          },
        ]}
      />

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-6 h-6 text-primary" />
              Thank you, appreciation, and community credits
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              This page credits communities and resources that inspired features, education, and
              best practices. We are not affiliated with or endorsed by any third-party site unless
              explicitly stated.
            </p>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[70vh] pr-4">
              <div className="space-y-8 text-sm leading-relaxed">
                <section className="rounded-lg border border-primary/25 bg-primary/5 p-4">
                  <h2 className="text-base font-semibold mb-2 flex items-center gap-2">
                    <HeartHandshake className="h-5 w-5 text-primary" />
                    Thank you
                  </h2>
                  <p className="text-muted-foreground">
                    Huge appreciation to the people who share knowledge, lived experience, safety
                    reminders, and supportive discussion in online communities. {APP_NAME}
                    exists because communities teach, challenge, and improve what “good” looks
                    like—especially around privacy, harm reduction, and realistic expectations.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="secondary">Community-driven</Badge>
                    <Badge variant="secondary">Privacy-first</Badge>
                    <Badge variant="secondary">Safety-focused</Badge>
                  </div>
                </section>

                <section className="rounded-lg border border-warning/25 bg-warning/5 p-4">
                  <h2 className="text-base font-semibold mb-2 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-warning" />
                    Safety note (read this)
                  </h2>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>
                      Community posts and videos are{" "}
                      <strong className="text-foreground">not medical advice</strong>. If you have
                      pain, injury, or concerns, stop and consult a qualified clinician.
                    </li>
                    <li>
                      Be cautious with claims that promise extreme results, fast timelines, or “one
                      weird trick” fixes.
                    </li>
                    <li>Follow each community/site’s rules and keep personal info private.</li>
                  </ul>
                </section>

                {sections
                  .filter(s => s.id !== "thanks")
                  .map(section => (
                    <section key={section.id}>
                      <div className="flex items-center justify-between gap-4">
                        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                          <section.icon className="w-5 h-5 text-primary" />
                          {section.title}
                        </h2>
                      </div>
                      <Separator className="my-3" />

                      <div className="space-y-4">
                        {section.items.map(item => (
                          <div
                            key={item.name}
                            className="rounded-lg border border-border/60 bg-muted/10 p-4"
                          >
                            <div className="flex flex-col gap-1">
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                                <h3 className="font-semibold text-foreground">{item.name}</h3>
                                {item.url ? (
                                  <ExternalAnchor href={item.url} className="text-xs">
                                    Visit
                                  </ExternalAnchor>
                                ) : (
                                  <span className="text-xs text-muted-foreground">
                                    No link provided
                                  </span>
                                )}
                                {item.tags?.map(t => (
                                  <Badge key={t} variant="outline" className="text-[10px]">
                                    {t}
                                  </Badge>
                                ))}
                              </div>
                              <p className="text-muted-foreground">{item.description}</p>
                              {item.note ? (
                                <p className="text-xs text-muted-foreground italic">{item.note}</p>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}

                <section className="border-t border-border pt-6">
                  <p className="text-center text-muted-foreground text-xs">
                    Want to add or correct a credit? Send the link and a short note to be included
                    here.
                  </p>
                </section>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CreditsResources;
