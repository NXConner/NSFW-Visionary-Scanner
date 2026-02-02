import { useCallback, useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { BookOpen } from "lucide-react";
import { toast } from "sonner";
import {
  bookmarkContent,
  completeModule,
  getEducationModule,
  getEducationModules,
  getEducationQA,
  getExpertContent,
  getResearchUpdates,
  getUserEducationCompletion,
  getUserProgress,
  markQAHelpful,
  updateUserProgress,
  type BookmarkContentType,
  type EducationModule,
} from "@/lib/sexualHealthEducation";
import type {
  CategoryOption,
  SexualHealthEducationTab,
  UserProgress,
  EducationQA,
  ExpertContent,
  ResearchUpdate,
} from "./types";
import { ModulesTab } from "./tabs/ModulesTab";
import { QATab } from "./tabs/QATab";
import { ExpertsTab } from "./tabs/ExpertsTab";
import { ResearchTab } from "./tabs/ResearchTab";
import { ModuleDetailView } from "./views/ModuleDetailView";

export const SexualHealthEducation = (): JSX.Element => {
  const [activeTab, setActiveTab] = useState<SexualHealthEducationTab>("modules");
  const [loading, setLoading] = useState(false);

  const [modules, setModules] = useState<EducationModule[]>([]);
  const [selectedModule, setSelectedModule] = useState<EducationModule | null>(null);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [qa, setQA] = useState<EducationQA[]>([]);
  const [expertContent, setExpertContent] = useState<ExpertContent[]>([]);
  const [researchUpdates, setResearchUpdates] = useState<ResearchUpdate[]>([]);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories: CategoryOption[] = useMemo(
    () => [
      { id: "all", label: "All Categories" },
      { id: "anatomy", label: "Anatomy" },
      { id: "function", label: "Function" },
      { id: "conditions", label: "Conditions" },
      { id: "treatment", label: "Treatment" },
      { id: "prevention", label: "Prevention" },
      { id: "wellness", label: "Wellness" },
      { id: "relationships", label: "Relationships" },
      { id: "myths", label: "Myths & Facts" },
    ],
    [],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case "modules": {
          const modulesData = await getEducationModules(
            selectedCategory === "all" ? undefined : selectedCategory,
            false,
            false,
          );
          setModules(modulesData);
          const progressData = await getUserProgress();
          setProgress(progressData);
          const completion = await getUserEducationCompletion();
          setCompletionPercentage(completion);
          break;
        }
        case "qa": {
          const qaData = await getEducationQA(undefined, searchQuery || undefined);
          setQA(qaData);
          break;
        }
        case "experts": {
          const expertData = await getExpertContent(20);
          setExpertContent(expertData);
          break;
        }
        case "research": {
          const researchData = await getResearchUpdates(undefined, 20);
          setResearchUpdates(researchData);
          break;
        }
      }
    } catch (error) {
      toast.error("Failed to load education content");
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery, selectedCategory]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleOpenModule = useCallback(
    async (module: EducationModule) => {
      try {
        const moduleData = await getEducationModule(module.id!);
        if (moduleData) {
          setSelectedModule(moduleData);
          await updateUserProgress(module.id!, { last_accessed_at: new Date().toISOString() });
          await loadData();
        }
      } catch {
        toast.error("Failed to load module");
      }
    },
    [loadData],
  );

  const handleCompleteModule = useCallback(async () => {
    if (!selectedModule) return;
    try {
      await completeModule(selectedModule.id!);
      toast.success("Module completed!");
      setSelectedModule(null);
      await loadData();
    } catch {
      toast.error("Failed to complete module");
    }
  }, [loadData, selectedModule]);

  const handleBookmark = useCallback(
    async (contentType: BookmarkContentType, contentId: string) => {
      try {
        await bookmarkContent(contentType, contentId);
        toast.success("Bookmarked!");
      } catch {
        toast.error("Failed to bookmark");
      }
    },
    [],
  );

  if (selectedModule) {
    return (
      <ModuleDetailView
        module={selectedModule}
        onBack={() => setSelectedModule(null)}
        onComplete={() => void handleCompleteModule()}
        onBookmark={(t, id) => void handleBookmark(t, id)}
        onReload={async () => {
          const moduleData = await getEducationModule(selectedModule.id!);
          if (moduleData) setSelectedModule(moduleData);
          await loadData();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
          <BookOpen className="w-4 h-4 text-primary" />
          <span className="text-sm text-primary font-medium">Education</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          <span className="gradient-text">Sexual Health</span> Education
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Comprehensive educational content on sexual health, anatomy, function, and wellness.
        </p>
        {completionPercentage > 0 && (
          <div className="mt-4 max-w-md mx-auto">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>Your Progress</span>
              <span className="font-semibold">{completionPercentage.toFixed(0)}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as SexualHealthEducationTab)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="qa">Q&amp;A</TabsTrigger>
          <TabsTrigger value="experts">Experts</TabsTrigger>
          <TabsTrigger value="research">Research</TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="space-y-6">
          <ModulesTab
            loading={loading}
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            modules={modules}
            progress={progress}
            onOpenModule={m => void handleOpenModule(m)}
          />
        </TabsContent>
        <TabsContent value="qa" className="space-y-6">
          <QATab
            loading={loading}
            searchQuery={searchQuery}
            onSearchQueryChange={q => setSearchQuery(q)}
            qa={qa}
            onHelpful={(id, helpful) => void markQAHelpful(id, helpful)}
            onBookmark={(t, id) => void handleBookmark(t, id)}
          />
        </TabsContent>
        <TabsContent value="experts" className="space-y-6">
          <ExpertsTab
            loading={loading}
            expertContent={expertContent}
            onBookmark={(t, id) => void handleBookmark(t, id)}
          />
        </TabsContent>
        <TabsContent value="research" className="space-y-6">
          <ResearchTab
            loading={loading}
            researchUpdates={researchUpdates}
            onBookmark={(t, id) => void handleBookmark(t, id)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
