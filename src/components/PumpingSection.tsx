import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useData } from "@/contexts/DataContext";
import { triggerHaptic } from "@/lib/haptics";
import { toast } from "sonner";
import { VisualContentDisplay } from "./VisualContentDisplay";
import { StepByStepVisualGuide } from "./StepByStepVisualGuide";
import { useVisualContent } from "@/hooks/useVisualContent";
import { VISUAL_CONTENT_CATEGORIES } from "@/lib/visualContentManager";
import {
  TrendingUp,
  Clock,
  Gauge,
  Ruler,
  CircleDot,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  Timer,
  Target,
  Lightbulb,
  Shield,
  ChevronRight,
  Plus,
  Trash2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { format } from "date-fns";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface PumpingSession {
  id: string;
  date: string;
  duration: number; // minutes
  pressure: number; // inHg
  lengthBefore: number;
  lengthAfter: number;
  girthBefore: number;
  girthAfter: number;
  notes: string;
}

const PUMPING_KEY = 'morphoscan_pumping_sessions';

export const PumpingSection = () => {
  const [activeTab, setActiveTab] = useState("tracker");
  const [sessions, setSessions] = useState<PumpingSession[]>(() => {
    const saved = localStorage.getItem(PUMPING_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [showRoutineVisual, setShowRoutineVisual] = useState<string | null>(null);

  // Load visual content for pumping equipment and techniques
  const { content: pumpingVisuals } = useVisualContent({
    categories: [
      VISUAL_CONTENT_CATEGORIES.EQUIPMENT,
      VISUAL_CONTENT_CATEGORIES.TECHNIQUES,
      VISUAL_CONTENT_CATEGORIES.SAFETY,
    ],
    autoLoad: true,
    autoInvert: true,
  });

  // Form state
  const [duration, setDuration] = useState(15);
  const [pressure, setPressure] = useState(3);
  const [lengthBefore, setLengthBefore] = useState("");
  const [lengthAfter, setLengthAfter] = useState("");
  const [girthBefore, setGirthBefore] = useState("");
  const [girthAfter, setGirthAfter] = useState("");
  const [notes, setNotes] = useState("");

  const saveSessions = (newSessions: PumpingSession[]) => {
    localStorage.setItem(PUMPING_KEY, JSON.stringify(newSessions));
    setSessions(newSessions);
  };

  const handleSaveSession = () => {
    if (!lengthBefore || !lengthAfter || !girthBefore || !girthAfter) {
      toast.error("Please fill in all measurements");
      triggerHaptic('error');
      return;
    }

    const newSession: PumpingSession = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      duration,
      pressure,
      lengthBefore: parseFloat(lengthBefore),
      lengthAfter: parseFloat(lengthAfter),
      girthBefore: parseFloat(girthBefore),
      girthAfter: parseFloat(girthAfter),
      notes,
    };

    saveSessions([newSession, ...sessions]);
    toast.success("Session logged successfully!");
    triggerHaptic('success');

    // Reset form
    setLengthBefore("");
    setLengthAfter("");
    setGirthBefore("");
    setGirthAfter("");
    setNotes("");
  };

  const deleteSession = (id: string) => {
    saveSessions(sessions.filter(s => s.id !== id));
    toast.success("Session deleted");
    triggerHaptic('light');
  };

  // Calculate stats
  const calculateStats = () => {
    if (sessions.length === 0) return null;
    
    const avgLengthGain = sessions.reduce((acc, s) => acc + (s.lengthAfter - s.lengthBefore), 0) / sessions.length;
    const avgGirthGain = sessions.reduce((acc, s) => acc + (s.girthAfter - s.girthBefore), 0) / sessions.length;
    const totalSessions = sessions.length;
    const totalTime = sessions.reduce((acc, s) => acc + s.duration, 0);

    return { avgLengthGain, avgGirthGain, totalSessions, totalTime };
  };

  const stats = calculateStats();

  // Chart data
  const chartData = sessions
    .slice(0, 30)
    .reverse()
    .map((s) => ({
      date: format(new Date(s.date), "MMM d"),
      lengthGain: s.lengthAfter - s.lengthBefore,
      girthGain: s.girthAfter - s.girthBefore,
      length: s.lengthAfter,
      girth: s.girthAfter,
    }));

  const routines = [
    {
      name: "Beginner Routine",
      duration: "10-15 min",
      pressure: "2-3 inHg",
      frequency: "3x/week",
      description: "Start slow, focus on comfort. Warm up thoroughly before each session.",
      steps: [
        "5 min warm-up with warm towel",
        "Start at 2 inHg for 5 minutes",
        "Rest 1 minute",
        "Increase to 3 inHg for 5 minutes",
        "Cool down and massage"
      ]
    },
    {
      name: "Intermediate Routine",
      duration: "15-20 min",
      pressure: "3-5 inHg",
      frequency: "4x/week",
      description: "For users with 1-3 months experience. Gradually increase intensity.",
      steps: [
        "5 min warm-up",
        "Start at 3 inHg for 5 minutes",
        "Increase to 4 inHg for 5 minutes",
        "Peak at 5 inHg for 5 minutes",
        "Gradual release and massage"
      ]
    },
    {
      name: "Advanced Routine",
      duration: "20-30 min",
      pressure: "5-7 inHg",
      frequency: "5x/week",
      description: "For experienced users only. Listen to your body and never exceed comfort.",
      steps: [
        "10 min warm-up with heat pad",
        "Multiple sets at 5-7 inHg",
        "3x5 min sets with 2 min rest",
        "Jelqing between sets (optional)",
        "Extended cool down and massage"
      ]
    }
  ];

  const safetyTips = [
    {
      icon: AlertTriangle,
      title: "Start Low, Go Slow",
      content: "Begin with lower pressure (2-3 inHg) and shorter sessions. Increase gradually over weeks."
    },
    {
      icon: Clock,
      title: "Time Your Sessions",
      content: "Never exceed 20 minutes initially. Take breaks every 5-10 minutes to restore circulation."
    },
    {
      icon: Shield,
      title: "Watch for Warning Signs",
      content: "Stop immediately if you experience pain, numbness, discoloration, or cold sensation."
    },
    {
      icon: CheckCircle2,
      title: "Warm Up Properly",
      content: "Always warm up with a hot towel or warm water for 5 minutes before pumping."
    },
    {
      icon: Target,
      title: "Use Water-Based Lube",
      content: "Apply water-based lubricant to create a proper seal and prevent skin irritation."
    },
    {
      icon: Lightbulb,
      title: "Rest Days Matter",
      content: "Take at least 2 rest days per week. Recovery is when growth actually happens."
    }
  ];

  return (
    <section className="min-h-screen px-4 py-20">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">Pumping Progress</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="gradient-text">Growth</span> Tracker
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Track your pumping sessions, monitor gains, and follow safe routines.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-lg mx-auto">
            <TabsTrigger value="tracker" className="gap-2">
              <Timer className="w-4 h-4" />
              <span className="hidden sm:inline">Log</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Progress</span>
            </TabsTrigger>
            <TabsTrigger value="routines" className="gap-2">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Routines</span>
            </TabsTrigger>
            <TabsTrigger value="safety" className="gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Safety</span>
            </TabsTrigger>
          </TabsList>

          {/* Log Session Tab */}
          <TabsContent value="tracker" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Session Form */}
              <Card variant="glass" className="animate-fade-in-up">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5 text-primary" />
                    Log New Session
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Duration Slider */}
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Duration
                      </Label>
                      <span className="text-primary font-mono">{duration} min</span>
                    </div>
                    <Slider
                      value={[duration]}
                      onValueChange={([v]) => setDuration(v)}
                      min={5}
                      max={30}
                      step={5}
                    />
                  </div>

                  {/* Pressure Slider */}
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label className="flex items-center gap-2">
                        <Gauge className="w-4 h-4" />
                        Pressure
                      </Label>
                      <span className="text-primary font-mono">{pressure} inHg</span>
                    </div>
                    <Slider
                      value={[pressure]}
                      onValueChange={([v]) => setPressure(v)}
                      min={1}
                      max={10}
                      step={0.5}
                    />
                  </div>

                  {/* Measurements */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="flex items-center gap-2 mb-2">
                        <Ruler className="w-4 h-4" />
                        Length Before (cm)
                      </Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={lengthBefore}
                        onChange={(e) => setLengthBefore(e.target.value)}
                        placeholder="0.0"
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block">Length After (cm)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={lengthAfter}
                        onChange={(e) => setLengthAfter(e.target.value)}
                        placeholder="0.0"
                      />
                    </div>
                    <div>
                      <Label className="flex items-center gap-2 mb-2">
                        <CircleDot className="w-4 h-4" />
                        Girth Before (cm)
                      </Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={girthBefore}
                        onChange={(e) => setGirthBefore(e.target.value)}
                        placeholder="0.0"
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block">Girth After (cm)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={girthAfter}
                        onChange={(e) => setGirthAfter(e.target.value)}
                        placeholder="0.0"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <Label className="mb-2 block">Notes (optional)</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="How did the session feel? Any observations..."
                      rows={3}
                    />
                  </div>

                  <Button variant="gradient" className="w-full" onClick={handleSaveSession}>
                    Save Session
                  </Button>
                </CardContent>
              </Card>

              {/* Stats Overview */}
              <div className="space-y-6">
                {stats && (
                  <div className="grid grid-cols-2 gap-4 animate-fade-in-up">
                    <Card variant="glass" className="p-4">
                      <div className="text-center">
                        <p className="text-muted-foreground text-sm">Avg Length Gain</p>
                        <p className="text-2xl font-bold gradient-text">
                          +{stats.avgLengthGain.toFixed(2)} cm
                        </p>
                      </div>
                    </Card>
                    <Card variant="glass" className="p-4">
                      <div className="text-center">
                        <p className="text-muted-foreground text-sm">Avg Girth Gain</p>
                        <p className="text-2xl font-bold gradient-text">
                          +{stats.avgGirthGain.toFixed(2)} cm
                        </p>
                      </div>
                    </Card>
                    <Card variant="glass" className="p-4">
                      <div className="text-center">
                        <p className="text-muted-foreground text-sm">Total Sessions</p>
                        <p className="text-2xl font-bold">{stats.totalSessions}</p>
                      </div>
                    </Card>
                    <Card variant="glass" className="p-4">
                      <div className="text-center">
                        <p className="text-muted-foreground text-sm">Total Time</p>
                        <p className="text-2xl font-bold">{stats.totalTime} min</p>
                      </div>
                    </Card>
                  </div>
                )}

                {/* Recent Sessions */}
                <Card variant="glass" className="animate-fade-in-up">
                  <CardHeader>
                    <CardTitle>Recent Sessions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {sessions.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        No sessions logged yet. Start tracking!
                      </p>
                    ) : (
                      <div className="space-y-3 max-h-[300px] overflow-y-auto">
                        {sessions.slice(0, 10).map((session) => (
                          <div
                            key={session.id}
                            className="p-3 rounded-lg bg-secondary/50 flex items-center justify-between"
                          >
                            <div>
                              <p className="font-medium">
                                {format(new Date(session.date), "MMM d, yyyy")}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {session.duration}min @ {session.pressure} inHg
                              </p>
                            </div>
                            <div className="text-right flex items-center gap-4">
                              <div>
                                <p className="text-sm text-success">
                                  +{(session.lengthAfter - session.lengthBefore).toFixed(1)} L
                                </p>
                                <p className="text-sm text-primary">
                                  +{(session.girthAfter - session.girthBefore).toFixed(1)} G
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteSession(session.id)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-6">
            {chartData.length > 0 ? (
              <>
                <Card variant="glass" className="animate-fade-in-up">
                  <CardHeader>
                    <CardTitle>Session Gains Over Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                          <YAxis stroke="hsl(var(--muted-foreground))" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="lengthGain"
                            stroke="hsl(var(--primary))"
                            fill="hsl(var(--primary) / 0.2)"
                            name="Length Gain (cm)"
                          />
                          <Area
                            type="monotone"
                            dataKey="girthGain"
                            stroke="hsl(var(--accent))"
                            fill="hsl(var(--accent) / 0.2)"
                            name="Girth Gain (cm)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card variant="glass" className="animate-fade-in-up">
                  <CardHeader>
                    <CardTitle>Measurement Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                          <YAxis stroke="hsl(var(--muted-foreground))" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="length"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            dot={{ fill: 'hsl(var(--primary))' }}
                            name="Post-Session Length (cm)"
                          />
                          <Line
                            type="monotone"
                            dataKey="girth"
                            stroke="hsl(var(--accent))"
                            strokeWidth={2}
                            dot={{ fill: 'hsl(var(--accent))' }}
                            name="Post-Session Girth (cm)"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card variant="glass" className="animate-fade-in-up">
                <CardContent className="py-12 text-center">
                  <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Log sessions to see your progress charts
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Routines Tab */}
          <TabsContent value="routines" className="space-y-6">
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
                        {routine.pressure}
                      </span>
                      <span className="px-2 py-1 rounded-full bg-success/10 text-success text-xs">
                        {routine.frequency}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm mb-4">{routine.description}</p>
                    <div className="space-y-2">
                      {routine.steps.map((step, i) => (
                        <div key={i} className="flex gap-2 text-sm">
                          <span className="text-primary font-mono">{i + 1}.</span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
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
                        <li>• Beginners: 2-3 inHg (never exceed 5 inHg)</li>
                        <li>• Intermediate: 3-5 inHg with rest periods</li>
                        <li>• Advanced: 5-7 inHg (only with experience)</li>
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
          </TabsContent>

          {/* Safety Tab */}
          <TabsContent value="safety" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {safetyTips.map((tip, index) => (
                <Card
                  key={tip.title}
                  variant="glass"
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center mb-4">
                      <tip.icon className="w-6 h-6 text-warning" />
                    </div>
                    <h3 className="font-semibold mb-2">{tip.title}</h3>
                    <p className="text-sm text-muted-foreground">{tip.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Warning Signs */}
            <Card variant="glass" className="border-destructive/50 animate-fade-in-up">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-5 h-5" />
                  Stop Immediately If You Experience
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-destructive">
                      <ChevronRight className="w-4 h-4" />
                      Sharp or severe pain
                    </li>
                    <li className="flex items-center gap-2 text-destructive">
                      <ChevronRight className="w-4 h-4" />
                      Numbness or tingling
                    </li>
                    <li className="flex items-center gap-2 text-destructive">
                      <ChevronRight className="w-4 h-4" />
                      Blue or purple discoloration
                    </li>
                  </ul>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-destructive">
                      <ChevronRight className="w-4 h-4" />
                      Cold sensation
                    </li>
                    <li className="flex items-center gap-2 text-destructive">
                      <ChevronRight className="w-4 h-4" />
                      Blistering or bruising
                    </li>
                    <li className="flex items-center gap-2 text-destructive">
                      <ChevronRight className="w-4 h-4" />
                      Any bleeding
                    </li>
                  </ul>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  If symptoms persist after stopping, consult a healthcare professional immediately.
                </p>
              </CardContent>
            </Card>

            {/* Educational Content */}
            <Card variant="glass" className="animate-fade-in-up">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Understanding How Pumping Works
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-invert max-w-none">
                <p className="text-muted-foreground">
                  Vacuum pumping creates negative pressure around the tissue, causing increased blood flow
                  and temporary expansion of the corpus cavernosum. Regular use may lead to:
                </p>
                <ul className="text-muted-foreground space-y-2 mt-4">
                  <li>
                    <strong className="text-foreground">Temporary gains:</strong> Immediate post-session
                    increases due to blood engorgement (typically lasting 1-24 hours)
                  </li>
                  <li>
                    <strong className="text-foreground">Cumulative effects:</strong> With consistent,
                    long-term use, some users report semi-permanent improvements in EQ and size
                  </li>
                  <li>
                    <strong className="text-foreground">Improved circulation:</strong> Regular use may
                    help maintain healthy blood flow and tissue elasticity
                  </li>
                </ul>
                <p className="text-sm text-muted-foreground mt-4 italic">
                  Note: Results vary significantly between individuals. Scientific studies on permanent
                  gains are limited. Always prioritize safety over aggressive gains.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Routine Visual Guide Dialog */}
        {showRoutineVisual && (
          <Dialog open={!!showRoutineVisual} onOpenChange={() => setShowRoutineVisual(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{showRoutineVisual} - Visual Guide</DialogTitle>
              </DialogHeader>
              {(() => {
                const routine = routines.find(r => r.name === showRoutineVisual);
                if (!routine) return null;
                
                const routineVisuals = pumpingVisuals.filter(v =>
                  v.tags.some(tag => routine.name.toLowerCase().includes(tag) || tag.includes('pump'))
                );
                
                return (
                  <StepByStepVisualGuide
                    title={routine.name}
                    description={routine.description}
                    steps={routine.steps.map((step, idx) => ({
                      number: idx + 1,
                      title: `Step ${idx + 1}`,
                      description: step,
                      instructions: [step],
                      visualContent: routineVisuals.slice(idx, idx + 1),
                    }))}
                    onComplete={() => setShowRoutineVisual(null)}
                  />
                );
              })()}
            </DialogContent>
          </Dialog>
        )}
      </div>
    </section>
  );
};
