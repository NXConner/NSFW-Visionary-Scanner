import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  getRoutineTemplates,
  createRoutineTemplate,
  createAdaptiveRoutine,
  getAdaptiveRoutines,
  adaptRoutine,
  shareRoutine,
  getMarketplaceRoutines,
  purchaseRoutine,
  getRestDayRecommendations,
  createMultiWeekProgram,
  getMultiWeekPrograms,
  type RoutineTemplate,
  type AdaptiveRoutine,
  type SharedRoutine,
  type RoutineMarketplaceItem,
  type RestDayRecommendation,
  type MultiWeekProgram,
} from "@/lib/advancedRoutineFeatures";
import {
  Calendar,
  Sparkles,
  Share2,
  ShoppingCart,
  TrendingUp,
  Target,
  Play,
  Pause,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export const AdvancedRoutineFeatures = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("templates");
  const [loading, setLoading] = useState(false);

  // Templates
  const [templates, setTemplates] = useState<RoutineTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // Adaptive Routines
  const [adaptiveRoutines, setAdaptiveRoutines] = useState<AdaptiveRoutine[]>([]);

  // Marketplace
  const [marketplaceItems, setMarketplaceItems] = useState<RoutineMarketplaceItem[]>([]);

  // Rest Day Recommendations
  const [restDayRecommendations, setRestDayRecommendations] = useState<RestDayRecommendation[]>([]);

  // Multi-Week Programs
  const [programs, setPrograms] = useState<MultiWeekProgram[]>([]);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      switch (activeTab) {
        case "templates": {
          const templatesData = await getRoutineTemplates(
            (selectedCategory as RoutineTemplate["category"]) || undefined,
          );
          setTemplates(templatesData);
          break;
        }
        case "adaptive": {
          const routinesData = await getAdaptiveRoutines();
          setAdaptiveRoutines(routinesData);
          break;
        }
        case "marketplace": {
          const marketplaceData = await getMarketplaceRoutines();
          setMarketplaceItems(marketplaceData);
          break;
        }
        case "rest-days": {
          const restDaysData = await getRestDayRecommendations();
          setRestDayRecommendations(restDaysData);
          break;
        }
        case "programs": {
          const programsData = await getMultiWeekPrograms();
          setPrograms(programsData);
          break;
        }
      }
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedCategory, user]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleCreateAdaptiveRoutine = async (templateId: string | null) => {
    setLoading(true);
    try {
      const routine = await createAdaptiveRoutine(templateId, "My Adaptive Routine");
      if (routine) {
        setAdaptiveRoutines([routine, ...adaptiveRoutines]);
        toast.success("Adaptive routine created!");
      }
    } catch (error) {
      toast.error("Failed to create routine");
    } finally {
      setLoading(false);
    }
  };

  const handleAdaptRoutine = async (routineId: string) => {
    setLoading(true);
    try {
      const success = await adaptRoutine(routineId);
      if (success) {
        await loadData();
      }
    } catch (error) {
      toast.error("Failed to adapt routine");
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyBadge = (level: number | null) => {
    if (level === null) return null;
    const colors = ["green", "yellow", "orange", "red"];
    const color = colors[Math.min(Math.floor(level / 3), 3)];
    return (
      <Badge variant="outline" className={`border-${color}-500 text-${color}-700`}>
        Level {level}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Advanced Routine Features</h1>
        <p className="text-muted-foreground">
          Routine templates, adaptive routines, sharing, marketplace, video-guided sessions, and
          multi-week programs
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="templates">
            <Sparkles className="w-4 h-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="adaptive">
            <Target className="w-4 h-4 mr-2" />
            Adaptive
          </TabsTrigger>
          <TabsTrigger value="marketplace">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Marketplace
          </TabsTrigger>
          <TabsTrigger value="rest-days">
            <Pause className="w-4 h-4 mr-2" />
            Rest Days
          </TabsTrigger>
          <TabsTrigger value="programs">
            <Calendar className="w-4 h-4 mr-2" />
            Programs
          </TabsTrigger>
        </TabsList>

        {/* Templates */}
        <TabsContent value="templates" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Routine Templates</CardTitle>
                <select
                  className="p-2 border rounded"
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="recovery">Recovery</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {templates.map(template => (
                  <Card key={template.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{template.template_name}</h4>
                            {template.is_featured && <Badge variant="default">Featured</Badge>}
                            {template.is_premium && <Badge variant="outline">Premium</Badge>}
                            {template.is_verified && <Badge variant="outline">Verified</Badge>}
                            {getDifficultyBadge(template.difficulty_level)}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {template.description}
                          </p>
                          <div className="flex gap-2 flex-wrap">
                            {template.duration_weeks && (
                              <Badge variant="secondary">{template.duration_weeks} weeks</Badge>
                            )}
                            {template.sessions_per_week && (
                              <Badge variant="secondary">
                                {template.sessions_per_week} sessions/week
                              </Badge>
                            )}
                            {template.average_rating && (
                              <Badge variant="outline">
                                ⭐ {template.average_rating.toFixed(1)} ({template.rating_count})
                              </Badge>
                            )}
                            <Badge variant="secondary">Used {template.usage_count} times</Badge>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleCreateAdaptiveRoutine(template.id)}
                          disabled={loading}
                        >
                          Use Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Adaptive Routines */}
        <TabsContent value="adaptive" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Adaptive Routines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {adaptiveRoutines.map(routine => (
                  <Card key={routine.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{routine.routine_name}</h4>
                            <Badge variant={routine.status === "active" ? "default" : "secondary"}>
                              {routine.status}
                            </Badge>
                            {routine.adaptation_confidence && (
                              <Badge variant="outline">
                                {Math.round(routine.adaptation_confidence * 100)}% confidence
                              </Badge>
                            )}
                          </div>
                          {routine.adaptation_reason && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {routine.adaptation_reason}
                            </p>
                          )}
                          <div className="flex gap-2">
                            <Badge variant="secondary">
                              Adapted {routine.adaptation_count} times
                            </Badge>
                            {routine.last_adapted_at && (
                              <Badge variant="outline">
                                Last adapted:{" "}
                                {new Date(routine.last_adapted_at).toLocaleDateString()}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAdaptRoutine(routine.id)}
                          disabled={loading}
                        >
                          Adapt Now
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Marketplace */}
        <TabsContent value="marketplace" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Routine Marketplace</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {marketplaceItems.map(item => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">Routine #{item.id.slice(0, 8)}</h4>
                            {item.is_featured && <Badge variant="default">Featured</Badge>}
                            {item.average_rating && (
                              <Badge variant="outline">⭐ {item.average_rating.toFixed(1)}</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <p className="text-lg font-semibold">${item.price.toFixed(2)}</p>
                            <Badge variant="secondary">{item.sales_count} sales</Badge>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={async () => {
                            setLoading(true);
                            try {
                              const ok = await purchaseRoutine(item.id);
                              if (ok) toast.info("Opening checkout…");
                            } finally {
                              setLoading(false);
                            }
                          }}
                          disabled={loading}
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Purchase
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rest Day Recommendations */}
        <TabsContent value="rest-days" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Rest Day Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {restDayRecommendations.map(rec => (
                  <Card key={rec.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">
                              {new Date(rec.recommended_date).toLocaleDateString()}
                            </h4>
                            {rec.recommendation_type && (
                              <Badge variant="outline" className="capitalize">
                                {rec.recommendation_type.replace("_", " ")}
                              </Badge>
                            )}
                            {rec.confidence && (
                              <Badge variant="secondary">
                                {Math.round(rec.confidence * 100)}% confidence
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{rec.reason}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Multi-Week Programs */}
        <TabsContent value="programs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Multi-Week Programs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {programs.map(program => (
                  <Card key={program.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{program.program_name}</h4>
                            <Badge variant={program.status === "active" ? "default" : "secondary"}>
                              {program.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {program.description}
                          </p>
                          <div className="flex gap-2">
                            <Badge variant="outline">
                              Week {program.current_week} / {program.total_weeks}
                            </Badge>
                            {program.start_date && (
                              <Badge variant="outline">
                                Started: {new Date(program.start_date).toLocaleDateString()}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          <Play className="w-4 h-4 mr-2" />
                          Continue
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
