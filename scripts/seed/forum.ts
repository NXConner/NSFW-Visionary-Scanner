import { supabase } from "./supabase";

export async function seedForumCategories() {
  const categories = [
    {
      name: "General Discussion",
      slug: "general",
      description: "General health and wellness discussions",
      icon: "MessageSquare",
      sort_order: 1,
      is_active: true,
    },
    {
      name: "PE Methods & Techniques",
      slug: "pe-methods",
      description: "Discuss various PE methods, techniques, and experiences",
      icon: "Dumbbell",
      sort_order: 2,
      is_active: true,
    },
    {
      name: "Progress & Results",
      slug: "progress",
      description: "Share your progress, milestones, and success stories",
      icon: "TrendingUp",
      sort_order: 3,
      is_active: true,
    },
    {
      name: "Health & Safety",
      slug: "health-safety",
      description: "Important health information and safety guidelines",
      icon: "Shield",
      sort_order: 4,
      is_active: true,
    },
    {
      name: "Equipment & Tools",
      slug: "equipment",
      description: "Reviews and discussions about PE equipment and tools",
      icon: "Tool",
      sort_order: 5,
      is_active: true,
    },
    {
      name: "Q&A Support",
      slug: "support",
      description: "Ask questions and get help from the community",
      icon: "HelpCircle",
      sort_order: 6,
      is_active: true,
    },
  ];

  const { error } = await supabase
    .from("nsfw_forum_categories")
    .upsert(categories, { onConflict: "slug" });
  if (error) console.error("Error seeding forum categories:", error.message);
  else console.log(`✅ Seeded ${categories.length} forum categories`);
}
