import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScanHistoryComparison } from "@/components/ScanHistoryComparison";
import { Reveal, AnimatedNumber, TiltCard } from "@/components/premium";
import {
  History,
  Camera,
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  MoreVertical,
  FileText,
  GitCompare,
  BarChart3,
} from "lucide-react";

interface HistoryItem {
  id: string;
  type: "scan" | "search";
  title: string;
  date: string;
  details: string;
  trend?: "up" | "down" | "stable";
  value?: string;
}

export const HistorySection = () => {
  const historyItems: HistoryItem[] = [
    {
      id: "1",
      type: "scan",
      title: "Body Scan",
      date: "2024-01-15",
      details: "Length: 14.5cm, Circumference: 12.3cm",
      trend: "stable",
      value: "14.5cm",
    },
    {
      id: "2",
      type: "search",
      title: "John Smith",
      date: "2024-01-14",
      details: "Background check completed",
    },
    {
      id: "3",
      type: "scan",
      title: "Body Scan",
      date: "2024-01-10",
      details: "Length: 14.3cm, Circumference: 12.1cm",
      trend: "up",
      value: "14.3cm",
    },
    {
      id: "4",
      type: "search",
      title: "Jane Doe",
      date: "2024-01-08",
      details: "Phone lookup completed",
    },
    {
      id: "5",
      type: "scan",
      title: "Body Scan",
      date: "2024-01-05",
      details: "Length: 14.1cm, Circumference: 12.0cm",
      trend: "up",
      value: "14.1cm",
    },
    {
      id: "6",
      type: "scan",
      title: "Body Scan",
      date: "2024-01-01",
      details: "Length: 13.8cm, Circumference: 11.8cm",
      trend: "stable",
      value: "13.8cm",
    },
  ];

  const scanHistory = historyItems.filter(item => item.type === "scan");

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-success" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-destructive" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <section className="min-h-screen px-4 py-20 relative">
      <div className="container mx-auto max-w-6xl">
        <Reveal variant="wipe" className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <History className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">Activity Log</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="gradient-text">Scan</span> History
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Track your health measurements over time and review past searches.
          </p>
        </Reveal>

        <Tabs defaultValue="comparison" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="comparison" className="gap-2">
              <GitCompare className="w-4 h-4" />
              Comparison
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Timeline
            </TabsTrigger>
          </TabsList>

          <TabsContent value="comparison" className="animate-fade-in">
            <ScanHistoryComparison />
          </TabsContent>

          <TabsContent value="timeline" className="animate-fade-in">
            <div className="grid lg:grid-cols-3 gap-8">
              <Card variant="glass" className="lg:col-span-2 animate-fade-in-up">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Progress Overview
                  </CardTitle>
                  <Button variant="ghost" size="sm">
                    <Calendar className="w-4 h-4 mr-2" />
                    Last 30 days
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-end gap-3 mb-6">
                    {scanHistory.map((item, index) => {
                      const value = parseFloat(item.value || "0");
                      const height = ((value - 12) / 4) * 100;
                      return (
                        <div key={item.id} className="flex-1 flex flex-col items-center gap-2">
                          <div className="w-full flex flex-col items-center">
                            <span className="text-xs font-mono text-muted-foreground mb-1">
                              {item.value}
                            </span>
                            <div
                              className="w-full rounded-t-lg gradient-primary transition-all duration-500"
                              style={{
                                height: `${Math.max(height, 20)}%`,
                                animationDelay: `${index * 0.1}s`,
                              }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(item.date).toLocaleDateString("en", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border/50">
                    <div className="text-center">
                      <div className="text-2xl font-bold gradient-text">
                        +<AnimatedNumber value={5} />%
                      </div>
                      <div className="text-xs text-muted-foreground">Monthly Growth</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground">
                        <AnimatedNumber value={14.5} decimals={1} />
                        cm
                      </div>
                      <div className="text-xs text-muted-foreground">Current Avg</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground">
                        <AnimatedNumber value={6} />
                      </div>
                      <div className="text-xs text-muted-foreground">Total Scans</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Reveal variant="slide-left" delay={0.1}>
                  <TiltCard variant="stat" maxTilt={8}>
                    <div className="flex items-center justify-between p-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Scans</p>
                        <p className="text-3xl font-bold">
                          <AnimatedNumber value={scanHistory.length} />
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Camera className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </TiltCard>
                </Reveal>

                <Reveal variant="slide-left" delay={0.15}>
                  <TiltCard variant="stat" maxTilt={8}>
                    <div className="flex items-center justify-between p-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Searches</p>
                        <p className="text-3xl font-bold">
                          <AnimatedNumber
                            value={historyItems.filter(i => i.type === "search").length}
                          />
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                        <Search className="w-6 h-6 text-accent" />
                      </div>
                    </div>
                  </TiltCard>
                </Reveal>

                <Reveal variant="slide-left" delay={0.2}>
                  <TiltCard variant="stat" maxTilt={8}>
                    <div className="flex items-center justify-between p-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Health Score</p>
                        <p className="text-3xl font-bold text-success">
                          <AnimatedNumber value={95} />%
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-success" />
                      </div>
                    </div>
                  </TiltCard>
                </Reveal>
              </div>
            </div>

            <Card
              variant="glass"
              className="mt-8 animate-fade-in-up"
              style={{ animationDelay: "0.2s" }}
            >
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Activity</CardTitle>
                <Button variant="outline" size="sm">
                  <FileText className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {historyItems.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors group"
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          item.type === "scan" ? "bg-primary/10" : "bg-accent/10"
                        }`}
                      >
                        {item.type === "scan" ? (
                          <Camera className="w-5 h-5 text-primary" />
                        ) : (
                          <Search className="w-5 h-5 text-accent" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{item.title}</h4>
                          {item.trend && getTrendIcon(item.trend)}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{item.details}</p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {new Date(item.date).toLocaleDateString("en", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};
