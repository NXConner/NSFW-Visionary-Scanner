import type { CourseSeed } from "../types";

export const learningCourses: CourseSeed[] = [
  {
    key: "pe-foundations",
    title: "PE Foundations & Safety",
    description:
      "Build a safe, consistent foundation for PE routines with evidence-informed practices and clear stop rules.",
    category: "foundation",
    difficulty_level: "beginner",
    estimated_duration_minutes: 150,
    order_index: 1,
    is_featured: true,
  },
  {
    key: "peyronies-care",
    title: "Peyronie's & Curvature Care",
    description:
      "Understand curvature, monitor changes, and prepare for professional care with confidence.",
    category: "conditions",
    difficulty_level: "intermediate",
    estimated_duration_minutes: 140,
    order_index: 2,
  },
  {
    key: "pelvic-floor-eq",
    title: "Pelvic Floor & EQ Optimization",
    description:
      "Strengthen pelvic floor control and erection quality with safe, progressive training.",
    category: "wellness",
    difficulty_level: "intermediate",
    estimated_duration_minutes: 130,
    order_index: 3,
  },
  {
    key: "measurement-tracking",
    title: "Measurement & Progress Tracking",
    description:
      "Measure consistently, interpret trends, and maintain private, accurate progress records.",
    category: "tracking",
    difficulty_level: "beginner",
    estimated_duration_minutes: 110,
    order_index: 4,
  },
];
