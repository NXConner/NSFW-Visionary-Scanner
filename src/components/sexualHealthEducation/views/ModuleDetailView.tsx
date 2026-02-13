import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, Clock, Users } from "lucide-react";
import DOMPurify from "dompurify";
import type { BookmarkContentType, EducationModule } from "../types";
import { useUserRoles } from "@/hooks/useUserRoles";
import { EditEducationModuleDialog } from "@/components/sexualHealthEducation/admin/EditEducationModuleDialog";
import { buildModuleFallback } from "@/lib/learningFallbacks";

export function ModuleDetailView({
  module,
  onBack,
  onComplete,
  onBookmark,
  onReload,
}: {
  module: EducationModule;
  onBack: () => void;
  onComplete: () => void;
  onBookmark: (contentType: BookmarkContentType, contentId: string) => void;
  onReload: () => void | Promise<void>;
}): JSX.Element {
  const { isAdmin } = useUserRoles();
  const fallback = buildModuleFallback({
    title: module.title,
    description: module.description,
    category: module.category,
    difficultyLevel: module.difficulty_level,
    estimatedMinutes: module.estimated_duration_minutes,
  });
  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack}>
        ← Back to Modules
      </Button>

      <Card variant="glass">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-2xl mb-2">{module.title}</CardTitle>
              <CardDescription>{module.description}</CardDescription>
              <div className="flex gap-2 mt-4 flex-wrap">
                <Badge variant="outline">{module.category}</Badge>
                {module.difficulty_level && (
                  <Badge variant="outline">{module.difficulty_level}</Badge>
                )}
                {module.expert_reviewed && <Badge className="bg-green-500">Expert Reviewed</Badge>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && <EditEducationModuleDialog module={module} onSaved={onReload} />}
              <Button variant="ghost" size="sm" onClick={() => onBookmark("module", module.id!)}>
                Bookmark
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {module.video_url && (
            <div className="aspect-video rounded-lg overflow-hidden bg-secondary">
              <iframe
                title={`Education video: ${module.title}`}
                src={module.video_url}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          {module.content_html ? (
            <div
              className="prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(module.content_html) }}
            />
          ) : module.content_text ? (
            <div className="prose prose-invert max-w-none whitespace-pre-wrap">
              {module.content_text}
            </div>
          ) : (
            <div className="space-y-5">
              <p className="text-muted-foreground">{fallback.summary}</p>
              {fallback.sections.map(section => (
                <div key={section.title} className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {section.title}
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    {section.bullets.map(item => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  {section.note && <p className="text-xs text-muted-foreground">{section.note}</p>}
                </div>
              ))}
              {isAdmin && (
                <p className="text-xs text-muted-foreground">
                  Admin note: publish the module content to replace this default guidance.
                </p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {module.estimated_duration_minutes && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {module.estimated_duration_minutes} min
                </div>
              )}
              {module.view_count !== undefined && (
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {module.view_count} views
                </div>
              )}
            </div>
            <Button onClick={onComplete} variant="gradient">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Mark Complete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
