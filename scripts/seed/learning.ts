import { supabase } from "./supabase";
import {
  learningCourses as courses,
  learningLessonsMeasurementTracking,
  learningLessonsPeFoundations,
  learningLessonsPelvicFloorEq,
  learningLessonsPeyroniesCare,
  learningModules as modules,
  learningQuizzes as quizzes,
} from "./learning/data";

const lessons = [
  ...learningLessonsPeFoundations,
  ...learningLessonsPeyroniesCare,
  ...learningLessonsPelvicFloorEq,
  ...learningLessonsMeasurementTracking,
];

export async function seedLearningContent(): Promise<void> {
  const courseTitles = courses.map(c => c.title);
  const { data: existingCourses } = await supabase
    .from("learning_courses")
    .select("id, title")
    .in("title", courseTitles);

  const existingCourseMap = new Map(
    (existingCourses || []).map(c => [String(c.title), String(c.id)]),
  );

  const courseRows = courses.map(course => ({
    id: existingCourseMap.get(course.title),
    title: course.title,
    description: course.description,
    category: course.category,
    difficulty_level: course.difficulty_level,
    estimated_duration_minutes: course.estimated_duration_minutes,
    order_index: course.order_index,
    is_featured: Boolean(course.is_featured),
    is_published: true,
  }));

  const { data: upsertedCourses, error: courseError } = await supabase
    .from("learning_courses")
    .upsert(courseRows, { onConflict: "id" })
    .select("id, title");

  if (courseError || !upsertedCourses) {
    console.error("Error seeding courses:", courseError?.message);
    return;
  }

  const courseByKey = new Map<string, string>();
  courses.forEach(course => {
    const match = upsertedCourses.find(c => c.title === course.title);
    if (match?.id) courseByKey.set(course.key, match.id);
  });

  const moduleRows = modules.map(module => ({
    course_id: courseByKey.get(module.courseKey),
    title: module.title,
    description: module.description,
    order_index: module.order_index,
    estimated_duration_minutes: module.estimated_duration_minutes,
  }));

  const moduleCourseIds = moduleRows.map(m => m.course_id).filter(Boolean) as string[];
  const { data: existingModules } = await supabase
    .from("learning_modules")
    .select("id, course_id, title")
    .in("course_id", moduleCourseIds);

  const existingModuleMap = new Map(
    (existingModules || []).map(m => [`${m.course_id}:${m.title}`, String(m.id)]),
  );

  const moduleUpserts = modules.map(module => ({
    id: existingModuleMap.get(`${courseByKey.get(module.courseKey)}:${module.title}`),
    course_id: courseByKey.get(module.courseKey),
    title: module.title,
    description: module.description,
    order_index: module.order_index,
    estimated_duration_minutes: module.estimated_duration_minutes,
  }));

  const { data: upsertedModules, error: moduleError } = await supabase
    .from("learning_modules")
    .upsert(moduleUpserts, { onConflict: "id" })
    .select("id, title, course_id");

  if (moduleError || !upsertedModules) {
    console.error("Error seeding modules:", moduleError?.message);
    return;
  }

  const moduleByKey = new Map<string, string>();
  modules.forEach(module => {
    const moduleId = upsertedModules.find(
      m => m.title === module.title && m.course_id === courseByKey.get(module.courseKey),
    )?.id;
    if (moduleId) moduleByKey.set(module.key, moduleId);
  });

  const lessonModuleIds = lessons
    .map(lesson => moduleByKey.get(lesson.moduleKey))
    .filter(Boolean) as string[];

  const { data: existingLessons } = await supabase
    .from("learning_lessons")
    .select("id, module_id, title")
    .in("module_id", lessonModuleIds);

  const existingLessonMap = new Map(
    (existingLessons || []).map(l => [`${l.module_id}:${l.title}`, String(l.id)]),
  );

  const lessonUpserts = lessons.map(lesson => ({
    id: existingLessonMap.get(`${moduleByKey.get(lesson.moduleKey)}:${lesson.title}`),
    module_id: moduleByKey.get(lesson.moduleKey),
    title: lesson.title,
    content_type: lesson.content_type,
    content_data: lesson.content_data,
    order_index: lesson.order_index,
    estimated_duration_minutes: lesson.estimated_duration_minutes,
  }));

  const { data: upsertedLessons, error: lessonError } = await supabase
    .from("learning_lessons")
    .upsert(lessonUpserts, { onConflict: "id" })
    .select("id, title, module_id");

  if (lessonError || !upsertedLessons) {
    console.error("Error seeding lessons:", lessonError?.message);
    return;
  }

  const lessonByKey = new Map<string, string>();
  lessons.forEach(lesson => {
    const lessonId = upsertedLessons.find(
      l => l.title === lesson.title && l.module_id === moduleByKey.get(lesson.moduleKey),
    )?.id;
    if (lessonId) lessonByKey.set(lesson.key, lessonId);
  });

  const quizLessonIds = quizzes
    .map(quiz => lessonByKey.get(quiz.lessonKey))
    .filter(Boolean) as string[];
  const { data: existingQuizzes } = await supabase
    .from("learning_quizzes")
    .select("id, lesson_id, title")
    .in("lesson_id", quizLessonIds);

  const existingQuizMap = new Map(
    (existingQuizzes || []).map(q => [`${q.lesson_id}:${q.title}`, String(q.id)]),
  );

  const quizUpserts = quizzes.map(quiz => ({
    id: existingQuizMap.get(`${lessonByKey.get(quiz.lessonKey)}:${quiz.title}`),
    lesson_id: lessonByKey.get(quiz.lessonKey),
    course_id: courseByKey.get(quiz.courseKey),
    title: quiz.title,
    description: quiz.description,
    quiz_type: "multiple_choice",
    questions: quiz.questions,
    passing_score: 80,
    show_results_immediately: true,
  }));

  const { error: quizError } = await supabase.from("learning_quizzes").upsert(quizUpserts, {
    onConflict: "id",
  });

  if (quizError) {
    console.error("Error seeding quizzes:", quizError.message);
  }

  for (const course of courses) {
    const courseId = courseByKey.get(course.key);
    if (!courseId) continue;
    const moduleCount = modules.filter(m => m.courseKey === course.key).length;
    const lessonCount = lessons.filter(l => {
      const mod = modules.find(m => m.key === l.moduleKey);
      return mod?.courseKey === course.key;
    }).length;
    await supabase
      .from("learning_courses")
      .update({ module_count: moduleCount, lesson_count: lessonCount })
      .eq("id", courseId);
  }

  console.log(`✅ Seeded ${courses.length} learning courses`);
  console.log(`✅ Seeded ${modules.length} learning modules`);
  console.log(`✅ Seeded ${lessons.length} learning lessons`);
  console.log(`✅ Seeded ${quizzes.length} learning quizzes`);
}
