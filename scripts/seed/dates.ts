import { supabase } from "./supabase";

export async function seedDateTemplates() {
  const templates = [
    {
      template_name: "Romantic Evening",
      template_category: "romantic",
      default_activities: { items: ["Candlelit dinner", "Massage", "Intimate conversation"] },
      default_duration_minutes: 180,
      default_location_type: "home",
      is_public: true,
      usage_count: 0,
    },
    {
      template_name: "Spontaneous Quickie",
      template_category: "spontaneous",
      default_activities: { items: ["Quick connection", "Passionate encounter"] },
      default_duration_minutes: 30,
      default_location_type: "anywhere",
      is_public: true,
      usage_count: 0,
    },
    {
      template_name: "Weekend Getaway",
      template_category: "adventure",
      default_activities: { items: ["Hotel stay", "Room service", "Uninterrupted time"] },
      default_duration_minutes: 1440,
      default_location_type: "hotel",
      is_public: true,
      usage_count: 0,
    },
    {
      template_name: "Morning Delight",
      template_category: "romantic",
      default_activities: { items: ["Breakfast in bed", "Lazy morning", "Cuddles"] },
      default_duration_minutes: 120,
      default_location_type: "home",
      is_public: true,
      usage_count: 0,
    },
    {
      template_name: "Spa Day",
      template_category: "relaxation",
      default_activities: { items: ["Couples massage", "Hot tub", "Relaxation"] },
      default_duration_minutes: 240,
      default_location_type: "spa",
      is_public: true,
      usage_count: 0,
    },
    {
      template_name: "Netflix & Chill",
      template_category: "casual",
      default_activities: { items: ["Movie watching", "Cuddling", "Snacks"] },
      default_duration_minutes: 180,
      default_location_type: "home",
      is_public: true,
      usage_count: 0,
    },
    {
      template_name: "Anniversary Special",
      template_category: "celebration",
      default_activities: {
        items: ["Fancy dinner", "Champagne", "Special lingerie", "Full night"],
      },
      default_duration_minutes: 300,
      default_location_type: "hotel",
      is_public: true,
      usage_count: 0,
    },
    {
      template_name: "Outdoor Adventure",
      template_category: "adventure",
      default_activities: { items: ["Hiking", "Secluded spot", "Nature connection"] },
      default_duration_minutes: 240,
      default_location_type: "outdoors",
      is_public: true,
      usage_count: 0,
    },
    {
      template_name: "Game Night",
      template_category: "playful",
      default_activities: { items: ["Strip poker", "Truth or dare", "Playful competition"] },
      default_duration_minutes: 180,
      default_location_type: "home",
      is_public: true,
      usage_count: 0,
    },
    {
      template_name: "Roleplay Evening",
      template_category: "fantasy",
      default_activities: { items: ["Costumes", "Scenario", "Character play"] },
      default_duration_minutes: 180,
      default_location_type: "home",
      is_public: true,
      usage_count: 0,
    },
  ];

  const { error } = await supabase
    .from("intimate_date_templates")
    .upsert(templates, { onConflict: "template_name" });
  if (error) console.error("Error seeding date templates:", error.message);
  else console.log(`✅ Seeded ${templates.length} date templates`);
}
