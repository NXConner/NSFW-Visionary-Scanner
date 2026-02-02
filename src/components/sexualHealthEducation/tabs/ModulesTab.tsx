import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, CheckCircle2, Clock, FileText, Video } from "lucide-react";
import type { CategoryOption, EducationModule, UserProgress } from "../types";

export function ModulesTab({
  loading,
  categories,
  selectedCategory,
  onSelectCategory,
  modules,
  progress,
  onOpenModule,
}: {
  loading: boolean;
  categories: CategoryOption[];
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
  modules: EducationModule[];
  progress: UserProgress[];
  onOpenModule: (m: EducationModule) => void;
}): JSX.Element {
  const getModuleProgress = (moduleId: string): number => {
    const moduleProgress = progress.find(p => p.module_id === moduleId);
    return moduleProgress?.progress_percentage || 0;
  };

  const isModuleCompleted = (moduleId: string): boolean => {
    const moduleProgress = progress.find(p => p.module_id === moduleId);
    return moduleProgress?.is_completed || false;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <Button
            key={cat.id}
            variant={selectedCategory === cat.id ? "default" : "outline"}
            size="sm"
            onClick={() => onSelectCategory(cat.id)}
          >
            {cat.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : modules.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map(module => {
            const moduleProgress = getModuleProgress(module.id!);
            const isCompleted = isModuleCompleted(module.id!);

            return (
              <button
                key={module.id}
                type="button"
                className="text-left"
                onClick={() => onOpenModule(module)}
                aria-label={`Open module ${module.title}`}
              >
                <Card
                  variant="glass"
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{module.title}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {module.description}
                        </CardDescription>
                      </div>
                      {isCompleted && (
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 ml-2" />
                      )}
                    </div>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {module.category}
                      </Badge>
                      {module.difficulty_level && (
                        <Badge variant="outline" className="text-xs">
                          {module.difficulty_level}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {moduleProgress > 0 && (
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span>Progress</span>
                            <span>{moduleProgress.toFixed(0)}%</span>
                          </div>
                          <Progress value={moduleProgress} className="h-1" />
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {module.content_type && (
                          <div className="flex items-center gap-1">
                            {module.content_type === "video" ? (
                              <Video className="w-3 h-3" />
                            ) : (
                              <FileText className="w-3 h-3" />
                            )}
                            {module.content_type}
                          </div>
                        )}
                        {module.estimated_duration_minutes && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {module.estimated_duration_minutes} min
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No modules available yet. Check back soon!</p>
        </div>
      )}
    </div>
  );
}
