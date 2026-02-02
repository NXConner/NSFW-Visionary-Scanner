import { supabase } from "./supabase";

export async function seedLearningContent() {
  const courses = [
    {
      title: "PE Fundamentals",
      description: "Master the basics of penis enhancement with evidence-based techniques",
      category: "beginner",
      difficulty_level: "beginner",
      estimated_duration_minutes: 120,
      is_published: true,
      is_featured: true,
      sort_order: 1,
    },
    {
      title: "Advanced Stretching Techniques",
      description: "Learn advanced manual and device-assisted stretching methods",
      category: "intermediate",
      difficulty_level: "intermediate",
      estimated_duration_minutes: 180,
      is_published: true,
      sort_order: 2,
    },
    {
      title: "Pumping Mastery",
      description: "Complete guide to safe and effective vacuum pumping",
      category: "intermediate",
      difficulty_level: "intermediate",
      estimated_duration_minutes: 150,
      is_published: true,
      sort_order: 3,
    },
    {
      title: "Health & Safety Essentials",
      description: "Critical safety information every practitioner must know",
      category: "beginner",
      difficulty_level: "beginner",
      estimated_duration_minutes: 60,
      is_published: true,
      is_featured: true,
      sort_order: 4,
    },
    {
      title: "Measuring & Tracking Progress",
      description: "Accurate measurement techniques and progress tracking strategies",
      category: "beginner",
      difficulty_level: "beginner",
      estimated_duration_minutes: 45,
      is_published: true,
      sort_order: 5,
    },
  ];

  const { data: insertedCourses, error: courseError } = await supabase
    .from("learning_courses")
    .upsert(courses, { onConflict: "title" })
    .select();

  if (courseError) {
    console.error("Error seeding courses:", courseError.message);
    return;
  }
  console.log(`✅ Seeded ${courses.length} learning courses`);

  if (insertedCourses && insertedCourses.length > 0) {
    const modules = insertedCourses.flatMap(course => [
      {
        course_id: course.id,
        title: "Introduction",
        description: "Getting started with this course",
        sort_order: 1,
        is_published: true,
      },
      {
        course_id: course.id,
        title: "Core Concepts",
        description: "Understanding the fundamentals",
        sort_order: 2,
        is_published: true,
      },
      {
        course_id: course.id,
        title: "Practical Application",
        description: "Hands-on techniques and exercises",
        sort_order: 3,
        is_published: true,
      },
      {
        course_id: course.id,
        title: "Summary & Next Steps",
        description: "Review and continue your journey",
        sort_order: 4,
        is_published: true,
      },
    ]);

    const { error: moduleError } = await supabase.from("learning_modules").upsert(modules);
    if (moduleError) console.error("Error seeding modules:", moduleError.message);
    else console.log(`✅ Seeded ${modules.length} learning modules`);
  }
}
