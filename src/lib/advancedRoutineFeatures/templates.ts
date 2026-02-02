import { toast } from "sonner";
import { logger } from "@/lib/logger";
import type { RoutineExercise, RoutineTemplate } from "./types";

// Local storage key for routine templates
const TEMPLATES_STORAGE_KEY = "routine_templates";

// Default system templates
const SYSTEM_TEMPLATES: RoutineTemplate[] = [
  {
    id: "beginner-basic",
    template_name: "Beginner Basic",
    description: "A gentle introduction to PE exercises",
    category: "stretching",
    exercises: [
      {
        id: "basic-stretch-1",
        name: "Basic Stretch",
        sets: 3,
        reps: 10,
        duration_seconds: 30,
        rest_seconds: 60,
        order: 1,
      },
    ],
    estimated_time_per_session_minutes: 15,
    difficulty_level: 1,
    intensity_level: "low",
    has_video_guidance: false,
    is_system_template: true,
    is_premium: false,
    is_featured: true,
    is_verified: true,
    usage_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "intermediate-combo",
    template_name: "Intermediate Combo",
    description: "A balanced routine combining stretching and jelqing",
    category: "jelqing",
    exercises: [
      {
        id: "warm-up-1",
        name: "Warm Up",
        sets: 1,
        reps: 1,
        duration_seconds: 300,
        rest_seconds: 30,
        order: 1,
      },
      {
        id: "jelq-1",
        name: "Jelqing",
        sets: 3,
        reps: 50,
        rest_seconds: 60,
        order: 2,
      },
    ],
    estimated_time_per_session_minutes: 25,
    difficulty_level: 3,
    intensity_level: "moderate",
    has_video_guidance: false,
    is_system_template: true,
    is_premium: false,
    is_featured: true,
    is_verified: true,
    usage_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

function getStoredTemplates(): RoutineTemplate[] {
  try {
    const stored = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveTemplatesToStorage(templates: RoutineTemplate[]): void {
  try {
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
  } catch {
    // ignore
  }
}

export async function getRoutineTemplates(
  category?: RoutineTemplate["category"],
  difficultyLevel?: number,
): Promise<RoutineTemplate[]> {
  try {
    const userTemplates = getStoredTemplates();
    const allTemplates = [...SYSTEM_TEMPLATES, ...userTemplates];

    let filtered = allTemplates;
    if (category) {
      filtered = filtered.filter(t => t.category === category);
    }
    if (difficultyLevel != null) {
      filtered = filtered.filter(t => t.difficulty_level === difficultyLevel);
    }

    return filtered.sort((a, b) => {
      if (a.is_featured !== b.is_featured) return b.is_featured ? 1 : -1;
      return (b.usage_count || 0) - (a.usage_count || 0);
    });
  } catch (err) {
    logger.error("Error getting routine templates", { error: err });
    return [];
  }
}

export async function createRoutineTemplate(
  templateName: string,
  description: string,
  exercises: RoutineExercise[],
  category: RoutineTemplate["category"],
  difficultyLevel: number,
): Promise<RoutineTemplate | null> {
  try {
    const estimated = exercises.reduce((acc, ex) => {
      const exerciseTime = ex.duration_seconds
        ? Number(ex.duration_seconds) * ex.sets
        : Number(ex.reps || 10) * ex.sets * 3;
      return acc + exerciseTime / 60 + (ex.rest_seconds * Math.max(0, ex.sets - 1)) / 60;
    }, 0);

    const intensity: RoutineTemplate["intensity_level"] =
      difficultyLevel <= 2
        ? "low"
        : difficultyLevel <= 4
          ? "moderate"
          : difficultyLevel <= 7
            ? "high"
            : "very_high";

    const template: RoutineTemplate = {
      id: crypto.randomUUID(),
      template_name: templateName,
      description,
      category,
      exercises,
      estimated_time_per_session_minutes: Math.round(estimated),
      difficulty_level: difficultyLevel,
      intensity_level: intensity,
      has_video_guidance: false,
      is_system_template: false,
      is_premium: false,
      is_featured: false,
      is_verified: false,
      usage_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const templates = getStoredTemplates();
    templates.unshift(template);
    saveTemplatesToStorage(templates);

    toast.success("Routine template created!");
    return template;
  } catch (err) {
    logger.error("Failed to create routine template", { error: err });
    toast.error("Failed to create template");
    return null;
  }
}
