import { logger } from "@/lib/logger";
import type { EquipmentRecommendation, SupplementRecommendation } from "./types";

// Local storage for recommendations (no database table)
const EQUIPMENT_KEY = "equipment_recommendations";
const SUPPLEMENTS_KEY = "supplement_recommendations";

const DEFAULT_EQUIPMENT: EquipmentRecommendation[] = [
  {
    id: "eq-1",
    equipment_name: "Premium Vacuum Pump",
    equipment_description: "Medical-grade vacuum pump for safe and effective PE therapy",
    equipment_category: "pumps",
    affiliate_url: "#",
    affiliate_provider: null,
    commission_rate: null,
    price_range: "$50-100",
    rating: 4.5,
    review_count: 128,
    image_url: null,
    recommended_for: ["beginners", "intermediate"],
    effectiveness_rating: 4.2,
    is_active: true,
    is_featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const DEFAULT_SUPPLEMENTS: SupplementRecommendation[] = [
  {
    id: "sup-1",
    supplement_name: "L-Arginine",
    supplement_description: "Amino acid that supports blood flow and circulation",
    supplement_type: "amino_acid",
    affiliate_url: "#",
    affiliate_provider: null,
    commission_rate: null,
    price_range: "$15-30",
    rating: 4.3,
    review_count: 256,
    image_url: null,
    health_benefits: ["improved circulation", "enhanced performance"],
    recommended_dosage: "3-6g daily",
    warnings: ["Consult doctor if on blood pressure medication"],
    is_active: true,
    is_featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export async function getEquipmentRecommendations(
  category?: string,
): Promise<EquipmentRecommendation[]> {
  try {
    let recommendations = DEFAULT_EQUIPMENT;
    if (category) {
      recommendations = recommendations.filter(r => r.equipment_category === category);
    }
    return recommendations.filter(r => r.is_active);
  } catch (err) {
    logger.error("Error getting equipment recommendations", { error: err });
    return [];
  }
}

export async function getSupplementRecommendations(
  type?: string,
): Promise<SupplementRecommendation[]> {
  try {
    let recommendations = DEFAULT_SUPPLEMENTS;
    if (type) {
      recommendations = recommendations.filter(r => r.supplement_type === type);
    }
    return recommendations.filter(r => r.is_active);
  } catch (err) {
    logger.error("Error getting supplement recommendations", { error: err });
    return [];
  }
}
