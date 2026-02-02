import { supabase } from "./supabase";

export async function seedDLCPacks() {
  const packs = [
    {
      pack_name: "Premium Positions Gallery",
      pack_type: "positions",
      description: "Unlock 50+ exclusive intimate positions with detailed guides",
      price: 9.99,
      currency: "USD",
      item_count: 50,
      is_active: true,
      is_featured: true,
      category: "content",
      difficulty_level: "all",
      content_rating: "adult",
    },
    {
      pack_name: "Advanced PE Routines",
      pack_type: "education",
      description: "Professional-grade PE workout routines for all levels",
      price: 14.99,
      currency: "USD",
      item_count: 25,
      is_active: true,
      is_featured: true,
      category: "training",
      difficulty_level: "intermediate",
      content_rating: "adult",
    },
    {
      pack_name: "Intimate Date Ideas Pro",
      pack_type: "premium_content",
      description: "100+ creative intimate date templates and ideas",
      price: 7.99,
      currency: "USD",
      item_count: 100,
      is_active: true,
      category: "lifestyle",
      difficulty_level: "all",
      content_rating: "adult",
    },
    {
      pack_name: "AI Coaching Sessions",
      pack_type: "bundle",
      description: "Personalized AI-powered coaching and recommendations",
      price: 19.99,
      currency: "USD",
      item_count: 1,
      is_subscription: true,
      subscription_duration_days: 30,
      is_active: true,
      is_featured: true,
      category: "coaching",
      content_rating: "adult",
    },
    {
      pack_name: "Video Tutorial Library",
      pack_type: "videos",
      description: "Professional video guides for techniques and methods",
      price: 24.99,
      currency: "USD",
      item_count: 40,
      is_active: true,
      category: "education",
      difficulty_level: "all",
      content_rating: "adult",
    },
    {
      pack_name: "Expert Q&A Access",
      pack_type: "premium_content",
      description: "Direct access to expert answers and consultations",
      price: 12.99,
      currency: "USD",
      item_count: 1,
      is_subscription: true,
      subscription_duration_days: 30,
      is_active: true,
      category: "support",
      content_rating: "adult",
    },
  ];

  const { error } = await supabase.from("dlc_packs").upsert(packs, { onConflict: "pack_name" });
  if (error) console.error("Error seeding DLC packs:", error.message);
  else console.log(`✅ Seeded ${packs.length} DLC packs`);
}

export async function seedDLCBundles() {
  const bundles = [
    {
      bundle_name: "Starter Bundle",
      description: "Perfect introduction pack with positions and basic routines",
      bundle_price: 19.99,
      original_price: 24.98,
      discount_percentage: 20,
      pack_ids: [],
      pack_count: 2,
      is_active: true,
      is_featured: true,
    },
    {
      bundle_name: "Complete Collection",
      description: "Everything included - all packs at a massive discount",
      bundle_price: 59.99,
      original_price: 89.94,
      discount_percentage: 33,
      pack_ids: [],
      pack_count: 6,
      is_active: true,
      is_featured: true,
    },
    {
      bundle_name: "Education Bundle",
      description: "All educational content including videos and routines",
      bundle_price: 34.99,
      original_price: 39.98,
      discount_percentage: 12,
      pack_ids: [],
      pack_count: 2,
      is_active: true,
    },
    {
      bundle_name: "Premium Experience",
      description: "AI coaching plus expert access subscription bundle",
      bundle_price: 29.99,
      original_price: 32.98,
      discount_percentage: 9,
      pack_ids: [],
      pack_count: 2,
      is_active: true,
    },
  ];

  const { error } = await supabase
    .from("dlc_bundles")
    .upsert(bundles, { onConflict: "bundle_name" });
  if (error) console.error("Error seeding DLC bundles:", error.message);
  else console.log(`✅ Seeded ${bundles.length} DLC bundles`);
}
