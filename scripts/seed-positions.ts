/**
 * Seed Data Script for Sex Positions Library
 * Populates the sex_positions_library table with initial data
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  console.error("Required environment variables:");
  console.error("  - VITE_SUPABASE_URL or SUPABASE_URL");
  console.error("  - SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_SERVICE_ROLE_KEY");
  console.error("");
  console.error("Please check your .env file and ensure these variables are set.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const positions = [
  {
    position_name: "Missionary",
    position_category: "basic",
    difficulty_level: "easy",
    description: "Classic face-to-face position with one partner on top",
    instructions: [
      "Partner on bottom lies flat",
      "Partner on top positions themselves between legs",
      "Maintain eye contact and adjust angle for comfort",
    ],
    tips: ["Use pillows for support", "Adjust leg positions for deeper penetration"],
    popularity_score: 100,
    is_featured: true,
  },
  {
    position_name: "Doggy Style",
    position_category: "basic",
    difficulty_level: "easy",
    description: "Partner on all fours with other partner behind",
    instructions: [
      "One partner gets on hands and knees",
      "Other partner kneels behind",
      "Adjust height with pillows if needed",
    ],
    tips: ["Great for deep penetration", "Allows for hair pulling and spanking"],
    popularity_score: 95,
    is_featured: true,
  },
  {
    position_name: "Cowgirl",
    position_category: "basic",
    difficulty_level: "easy",
    description: "Woman on top facing partner",
    instructions: [
      "Partner lies on back",
      "Woman straddles facing forward",
      "Control rhythm and depth",
    ],
    tips: ["Allows woman to control pace", "Great for clitoral stimulation"],
    popularity_score: 90,
    is_featured: true,
  },
  {
    position_name: "Reverse Cowgirl",
    position_category: "basic",
    difficulty_level: "medium",
    description: "Woman on top facing away from partner",
    instructions: [
      "Partner lies on back",
      "Woman straddles facing away",
      "Lean forward or back for different angles",
    ],
    tips: ["Provides different angle", "Be careful with depth"],
    popularity_score: 85,
    is_featured: false,
  },
  {
    position_name: "69",
    position_category: "advanced",
    difficulty_level: "medium",
    description: "Simultaneous oral pleasure in opposite directions",
    instructions: [
      "Partners position head-to-toe",
      "Both perform oral simultaneously",
      "Coordinate movements",
    ],
    tips: ["Focus on giving and receiving", "Communication is key"],
    popularity_score: 80,
    is_featured: false,
  },
  {
    position_name: "Standing",
    position_category: "adventurous",
    difficulty_level: "hard",
    description: "Standing position with one partner lifted or against wall",
    instructions: [
      "One partner stands",
      "Other partner wraps legs around",
      "Use wall for support if needed",
    ],
    tips: ["Requires strength and balance", "Great for quickies"],
    popularity_score: 75,
    is_featured: false,
  },
  {
    position_name: "Spooning",
    position_category: "romantic",
    difficulty_level: "easy",
    description: "Side-by-side position with partner behind",
    instructions: [
      "Both partners lie on side",
      "Partner behind enters from behind",
      "Gentle, intimate position",
    ],
    tips: ["Very intimate and comfortable", "Great for lazy mornings"],
    popularity_score: 70,
    is_featured: false,
  },
  {
    position_name: "Lotus",
    position_category: "tantric",
    difficulty_level: "expert",
    description: "Sitting position with legs wrapped around partner",
    instructions: [
      "Both partners sit facing each other",
      "Wrap legs around partner",
      "Slow, meditative movements",
    ],
    tips: ["Requires flexibility", "Focus on connection and breathing"],
    popularity_score: 65,
    is_featured: false,
  },
  {
    position_name: "Wheelbarrow",
    position_category: "acrobatic",
    difficulty_level: "expert",
    description: "One partner holds other by legs in standing position",
    instructions: [
      "One partner bends over",
      "Other partner lifts legs",
      "Requires significant strength",
    ],
    tips: ["Very advanced position", "Requires trust and strength"],
    popularity_score: 60,
    is_featured: false,
  },
  {
    position_name: "Butterfly",
    position_category: "romantic",
    difficulty_level: "easy",
    description: "Partner on back with legs up, other partner kneeling",
    instructions: [
      "One partner lies with legs elevated",
      "Other partner kneels between legs",
      "Great angle for penetration",
    ],
    tips: ["Comfortable and intimate", "Allows for deep penetration"],
    popularity_score: 75,
    is_featured: false,
  },
];

async function seedPositions() {
  console.log("Seeding sex positions library...");

  for (const position of positions) {
    const { data, error } = await supabase
      .from("sex_positions_library")
      .upsert(position, {
        onConflict: "position_name",
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      console.error(`Error seeding ${position.position_name}:`, error);
    } else {
      console.log(`✓ Seeded: ${position.position_name}`);
    }
  }

  console.log("Seeding complete!");
}

seedPositions().catch(console.error);
