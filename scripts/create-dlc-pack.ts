/**
 * DLC Pack Creator Script
 * Utility script to create DLC packs in the database
 *
 * Usage:
 *   tsx scripts/create-dlc-pack.ts
 *
 * Or with parameters:
 *   tsx scripts/create-dlc-pack.ts --name "Pack Name" --type positions --price 9.99
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { readFileSync } from "fs";
import { join } from "path";

// Load environment variables
dotenv.config({ path: ".env" });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in .env file");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface DLCPackInput {
  pack_name: string;
  description: string;
  pack_type: "positions" | "videos" | "education" | "bundle" | "premium_content";
  content_items: any;
  item_count: number;
  price: number;
  currency?: string;
  is_subscription?: boolean;
  subscription_duration_days?: number;
  preview_images?: string[];
  preview_video_url?: string;
  preview_description?: string;
  tags?: string[];
  category?: string;
  difficulty_level?: string;
  content_rating?: string;
  requires_base_pack?: boolean;
  base_pack_id?: string;
  is_standalone?: boolean;
  is_active?: boolean;
  is_featured?: boolean;
  release_date?: string;
}

/**
 * Create a DLC pack
 */
export async function createDLCPack(input: DLCPackInput) {
  try {
    const { data, error } = await supabase
      .from("dlc_packs")
      .insert({
        pack_name: input.pack_name,
        description: input.description,
        pack_type: input.pack_type,
        content_items: input.content_items,
        item_count: input.item_count,
        price: input.price,
        currency: input.currency || "USD",
        is_subscription: input.is_subscription || false,
        subscription_duration_days: input.subscription_duration_days || null,
        preview_images: input.preview_images || [],
        preview_video_url: input.preview_video_url || null,
        preview_description: input.preview_description || null,
        tags: input.tags || [],
        category: input.category || null,
        difficulty_level: input.difficulty_level || null,
        content_rating: input.content_rating || null,
        requires_base_pack: input.requires_base_pack || false,
        base_pack_id: input.base_pack_id || null,
        is_standalone: input.is_standalone !== false,
        is_active: input.is_active !== false,
        is_featured: input.is_featured || false,
        release_date: input.release_date || new Date().toISOString().split("T")[0],
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating DLC pack:", error);
      return null;
    }

    console.log("✅ DLC pack created successfully!");
    console.log("Pack ID:", data.id);
    console.log("Pack Name:", data.pack_name);
    console.log("Price:", `$${data.price}`);

    return data;
  } catch (error) {
    console.error("Error creating DLC pack:", error);
    return null;
  }
}

/**
 * Load content items from JSON file
 */
function loadContentItems(filePath: string): any {
  try {
    const content = readFileSync(filePath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading content file ${filePath}:`, error);
    return [];
  }
}

/**
 * Example: Create a positions pack
 */
async function createPositionsPackExample() {
  // Load positions from JSON file
  const positions = loadContentItems(
    join(process.cwd(), "dlc-content", "positions", "advanced-positions.json"),
  );

  const pack = await createDLCPack({
    pack_name: "Advanced Positions Pack",
    description:
      "A collection of 20 advanced sexual positions with detailed instructions and visual guides.",
    pack_type: "positions",
    content_items: positions,
    item_count: positions.length,
    price: 9.99,
    currency: "USD",
    preview_images: [
      "https://storage.supabase.co/object/public/dlc-previews/advanced-positions-preview-1.jpg",
      "https://storage.supabase.co/object/public/dlc-previews/advanced-positions-preview-2.jpg",
    ],
    preview_video_url:
      "https://storage.supabase.co/object/public/dlc-previews/advanced-positions-preview.mp4",
    preview_description:
      "Watch this preview to see what advanced positions are included in this pack.",
    tags: ["advanced", "positions", "kinky"],
    category: "positions",
    difficulty_level: "advanced",
    is_active: true,
    is_featured: true,
  });

  return pack;
}

/**
 * Example: Create a video pack
 */
async function createVideoPackExample() {
  const videos = loadContentItems(
    join(process.cwd(), "dlc-content", "videos", "tutorial-series.json"),
  );

  const pack = await createDLCPack({
    pack_name: "Tutorial Video Series",
    description: "Comprehensive video tutorials covering advanced techniques and methods.",
    pack_type: "videos",
    content_items: videos,
    item_count: videos.length,
    price: 14.99,
    currency: "USD",
    preview_images: [
      "https://storage.supabase.co/object/public/dlc-previews/tutorial-series-preview.jpg",
    ],
    preview_video_url:
      "https://storage.supabase.co/object/public/dlc-previews/tutorial-series-preview.mp4",
    tags: ["tutorial", "education", "videos"],
    category: "education",
    difficulty_level: "intermediate",
    is_active: true,
    is_featured: true,
  });

  return pack;
}

/**
 * Example: Create an education pack
 */
async function createEducationPackExample() {
  const courses = loadContentItems(join(process.cwd(), "dlc-content", "education", "courses.json"));

  const pack = await createDLCPack({
    pack_name: "Advanced Education Course",
    description: "In-depth educational course with lessons, quizzes, and certificates.",
    pack_type: "education",
    content_items: courses,
    item_count: courses.length,
    price: 19.99,
    currency: "USD",
    preview_images: [
      "https://storage.supabase.co/object/public/dlc-previews/education-course-preview.jpg",
    ],
    tags: ["education", "course", "certificate"],
    category: "education",
    is_active: true,
    is_featured: false,
  });

  return pack;
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("DLC Pack Creator");
    console.log("Usage: tsx scripts/create-dlc-pack.ts [pack-type]");
    console.log("");
    console.log("Pack types:");
    console.log("  positions  - Create a positions pack");
    console.log("  videos     - Create a video pack");
    console.log("  education  - Create an education pack");
    console.log("");
    console.log("Examples:");
    console.log("  tsx scripts/create-dlc-pack.ts positions");
    console.log("  tsx scripts/create-dlc-pack.ts videos");
    console.log("  tsx scripts/create-dlc-pack.ts education");
    process.exit(0);
  }

  const packType = args[0];

  switch (packType) {
    case "positions":
      createPositionsPackExample()
        .then(() => process.exit(0))
        .catch(error => {
          console.error("Error:", error);
          process.exit(1);
        });
      break;

    case "videos":
      createVideoPackExample()
        .then(() => process.exit(0))
        .catch(error => {
          console.error("Error:", error);
          process.exit(1);
        });
      break;

    case "education":
      createEducationPackExample()
        .then(() => process.exit(0))
        .catch(error => {
          console.error("Error:", error);
          process.exit(1);
        });
      break;

    default:
      console.error(`Unknown pack type: ${packType}`);
      console.log("Valid types: positions, videos, education");
      process.exit(1);
  }
}

export { createDLCPack, loadContentItems };
