import { supabase } from "./supabase";

export async function seedMarketplaceCategories() {
  const categories = [
    {
      name: "Pumps & Devices",
      slug: "pumps",
      description: "Vacuum pumps and enhancement devices",
      icon: "Gauge",
      sort_order: 1,
      is_active: true,
    },
    {
      name: "Extenders & Hangers",
      slug: "extenders",
      description: "Penis extenders and hanging devices",
      icon: "Ruler",
      sort_order: 2,
      is_active: true,
    },
    {
      name: "Supplements",
      slug: "supplements",
      description: "Health supplements and vitamins",
      icon: "Pill",
      sort_order: 3,
      is_active: true,
    },
    {
      name: "Accessories",
      slug: "accessories",
      description: "Rings, sleeves, and accessories",
      icon: "Circle",
      sort_order: 4,
      is_active: true,
    },
    {
      name: "Books & Guides",
      slug: "education",
      description: "Educational materials and guides",
      icon: "BookOpen",
      sort_order: 5,
      is_active: true,
    },
  ];

  const { error } = await supabase
    .from("marketplace_categories")
    .upsert(categories, { onConflict: "slug" });
  if (error) console.error("Error seeding marketplace categories:", error.message);
  else console.log(`✅ Seeded ${categories.length} marketplace categories`);
}
