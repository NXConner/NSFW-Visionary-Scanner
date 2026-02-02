import { supabase } from "./supabase";

export async function seedTrustBadges() {
  const badges = [
    {
      name: "Verified User",
      description: "Email verified account",
      icon: "CheckCircle",
      color: "#4CAF50",
      sort_order: 1,
    },
    {
      name: "Premium Member",
      description: "Active premium subscription",
      icon: "Crown",
      color: "#FFD700",
      sort_order: 2,
    },
    {
      name: "Trusted Contributor",
      description: "Helpful community member",
      icon: "Star",
      color: "#2196F3",
      sort_order: 3,
    },
    {
      name: "Expert",
      description: "Verified health professional",
      icon: "Award",
      color: "#9C27B0",
      sort_order: 4,
    },
    {
      name: "Moderator",
      description: "Community moderator",
      icon: "Shield",
      color: "#F44336",
      sort_order: 5,
    },
  ];

  const { error } = await supabase.from("trust_badges").upsert(badges, { onConflict: "name" });
  if (error) console.error("Error seeding trust badges:", error.message);
  else console.log(`✅ Seeded ${badges.length} trust badges`);
}
