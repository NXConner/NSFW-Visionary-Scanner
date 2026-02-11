import { nsfwPositionImagesAll } from "./generated";
import type {
  NSFWPosition,
  PositionDifficulty,
  PositionFlexibility,
  PositionIntimacy,
} from "./types";

function normalizeCategory(value?: string): string {
  const v = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return v || "misc";
}

// Position-specific data with descriptions and how-to instructions
const positionMetadata: Record<
  string,
  {
    description?: string;
    howTo?: string[];
    difficulty?: PositionDifficulty;
    flexibility?: PositionFlexibility;
    intimacy?: PositionIntimacy;
    category?: string;
  }
> = {
  cowgirl: {
    description:
      "A classic position where one partner sits on top facing forward, allowing them to control the rhythm and depth while maintaining eye contact.",
    howTo: [
      "The receiving partner lies flat on their back on a comfortable surface.",
      "The active partner straddles them, facing forward with knees on either side.",
      "Lower yourself slowly and find a comfortable angle.",
      "Use your hands on their chest or the bed for balance.",
      "Control the rhythm by moving your hips in circular or up-and-down motions.",
    ],
    difficulty: "easy",
    flexibility: "low",
    intimacy: "high",
    category: "partner-on-top",
  },
  "reverse cowboy": {
    description:
      "A variation where the top partner faces away, providing a different angle of stimulation and visual experience.",
    howTo: [
      "Start with one partner lying on their back.",
      "The active partner straddles facing their feet instead of their face.",
      "Lower yourself slowly, using their legs or the bed for support.",
      "Lean forward slightly for balance and comfort.",
      "Move in a steady rhythm, communicating about angle and comfort.",
    ],
    difficulty: "medium",
    flexibility: "medium",
    intimacy: "medium",
    category: "partner-on-top",
  },
  missionary: {
    description:
      "The quintessential face-to-face position promoting intimacy, eye contact, and emotional connection between partners.",
    howTo: [
      "One partner lies on their back with legs slightly apart.",
      "The other partner positions themselves on top, supporting their weight on their arms.",
      "Align your bodies and enter slowly.",
      "Maintain eye contact and communicate about rhythm preferences.",
      "Place a pillow under the lower partner's hips for better angles.",
    ],
    difficulty: "easy",
    flexibility: "low",
    intimacy: "high",
    category: "classic",
  },
  doggy: {
    description:
      "A rear-entry position offering deep penetration and allowing the receiving partner to control arch and angle.",
    howTo: [
      "The receiving partner gets on all fours on a comfortable surface.",
      "Position hands shoulder-width apart and knees hip-width apart.",
      "The other partner kneels behind them.",
      "Enter slowly and establish a comfortable rhythm.",
      "The receiving partner can arch their back to adjust the angle.",
    ],
    difficulty: "easy",
    flexibility: "low",
    intimacy: "medium",
    category: "rear-entry",
  },
  spooning: {
    description:
      "A gentle side-lying position perfect for lazy mornings, promoting closeness and allowing for full-body contact.",
    howTo: [
      "Both partners lie on their sides, facing the same direction.",
      "The receiving partner is in front (little spoon position).",
      "The partner behind wraps their arm around for closeness.",
      "Lift the top leg slightly to allow entry from behind.",
      "Move gently together in a slow, synchronized rhythm.",
    ],
    difficulty: "easy",
    flexibility: "low",
    intimacy: "high",
    category: "side-by-side",
  },
  "69": {
    description:
      "A mutual oral position where both partners give and receive simultaneously, requiring coordination and communication.",
    howTo: [
      "One partner lies on their back.",
      "The other partner positions themselves on top, facing the opposite direction.",
      "Align your bodies so each can comfortably reach their partner.",
      "Communicate about pressure and rhythm preferences.",
      "Take turns focusing on giving and receiving.",
    ],
    difficulty: "medium",
    flexibility: "medium",
    intimacy: "high",
    category: "oral",
  },
  chair: {
    description:
      "A furniture-assisted position using a sturdy chair for support, allowing for face-to-face intimacy with unique angles.",
    howTo: [
      "Sit in a sturdy, armless chair without wheels.",
      "Your partner straddles your lap, facing you.",
      "They can place their feet on the floor for leverage.",
      "Hold their hips to help guide the rhythm.",
      "Lean back in the chair for different angles.",
    ],
    difficulty: "easy",
    flexibility: "low",
    intimacy: "high",
    category: "sitting",
  },
  lotus: {
    description:
      "An intimate seated position inspired by tantric practices, promoting deep connection and synchronized breathing.",
    howTo: [
      "One partner sits cross-legged or with legs extended.",
      "The other partner sits in their lap, wrapping legs around their waist.",
      "Face each other and maintain eye contact.",
      "Rock gently together rather than thrusting.",
      "Synchronize your breathing for deeper connection.",
    ],
    difficulty: "medium",
    flexibility: "medium",
    intimacy: "high",
    category: "tantric",
  },
  standing: {
    description:
      "A vertical position that can happen anywhere, adding spontaneity and excitement to intimate moments.",
    howTo: [
      "Face each other while standing.",
      "One partner may need to lift a leg, resting it on the other's hip.",
      "Use a wall for support and stability.",
      "The taller partner may need to bend their knees.",
      "Hold onto each other for balance and intimacy.",
    ],
    difficulty: "hard",
    flexibility: "medium",
    intimacy: "medium",
    category: "standing",
  },
  "pretzel dip": {
    description:
      "A side-lying twist offering deep penetration while allowing for eye contact and intimate touching.",
    howTo: [
      "Lie on your side with your partner kneeling beside you.",
      "Drape your top leg over their hip while keeping the bottom leg straight.",
      "Your partner straddles your bottom leg.",
      "This creates a twisted, pretzel-like shape.",
      "The angle allows for deep connection while maintaining eye contact.",
    ],
    difficulty: "medium",
    flexibility: "medium",
    intimacy: "high",
    category: "side-entry",
  },
  anvil: {
    description:
      "A variation of missionary with the receiving partner's legs raised, allowing for deeper penetration.",
    howTo: [
      "The receiving partner lies on their back.",
      "Raise your legs up toward your chest or over your partner's shoulders.",
      "Your partner enters from a kneeling or lying position.",
      "The raised legs change the angle significantly.",
      "Communicate about comfort—this requires some flexibility.",
    ],
    difficulty: "medium",
    flexibility: "high",
    intimacy: "high",
    category: "classic",
  },
  superman: {
    description:
      "A prone position where one partner lies flat while the other enters from behind, offering a unique angle.",
    howTo: [
      "The receiving partner lies flat on their stomach.",
      "Keep legs together or slightly apart for comfort.",
      "The other partner lies on top, supporting their weight.",
      "Entry is from behind at a low angle.",
      "Movement is slow and grinding rather than thrusting.",
    ],
    difficulty: "easy",
    flexibility: "low",
    intimacy: "medium",
    category: "rear-entry",
  },
  wheelbarrow: {
    description:
      "An athletic position requiring strength and coordination, with one partner holding the other's legs.",
    howTo: [
      "One partner gets on all fours, then their partner lifts their legs.",
      "The standing partner holds their legs at hip level.",
      "The person in front supports themselves on their hands.",
      "Move together slowly to maintain balance.",
      "This requires arm and core strength—take breaks as needed.",
    ],
    difficulty: "hard",
    flexibility: "high",
    intimacy: "low",
    category: "athletic",
  },
  bridge: {
    description:
      "The receiving partner creates a bridge with their body while the other kneels between their legs.",
    howTo: [
      "The receiving partner lies on their back.",
      "Push your hips up into a bridge position, supporting yourself on your feet and shoulders.",
      "Your partner kneels between your legs.",
      "Lower back down slowly if your muscles fatigue.",
      "Use pillows for support if needed.",
    ],
    difficulty: "hard",
    flexibility: "high",
    intimacy: "medium",
    category: "athletic",
  },
  scissor: {
    description:
      "Partners interlock their legs like scissors, creating a grinding motion with lots of body contact.",
    howTo: [
      "Both partners lie on their sides, facing each other.",
      "Interlock your legs in a scissoring pattern.",
      "Move closer together until bodies are aligned.",
      "Grind and rock together rather than thrusting.",
      "This allows for lots of full-body contact.",
    ],
    difficulty: "easy",
    flexibility: "low",
    intimacy: "high",
    category: "side-by-side",
  },
  amazon: {
    description:
      "A role-reversal position where the usually-bottom partner takes a more dominant, active top position.",
    howTo: [
      "One partner lies on their back with legs raised to their chest.",
      "The other partner squats over them, facing their feet.",
      "Lower yourself down and find a comfortable angle.",
      "Use squatting motions for movement.",
      "This requires leg strength—communicate about pacing.",
    ],
    difficulty: "hard",
    flexibility: "high",
    intimacy: "medium",
    category: "partner-on-top",
  },
};

function inferDifficulty(name: string, tags: string[]): PositionDifficulty {
  const lowerName = name.toLowerCase();
  const metadata = Object.entries(positionMetadata).find(([key]) =>
    lowerName.includes(key.toLowerCase()),
  );
  if (metadata && metadata[1].difficulty) return metadata[1].difficulty;

  const t = new Set(tags.map(x => x.toLowerCase()));
  if (
    t.has("expert") ||
    t.has("advanced") ||
    t.has("hard") ||
    lowerName.includes("wheelbarrow") ||
    lowerName.includes("amazon") ||
    lowerName.includes("bridge")
  )
    return "hard";
  if (
    t.has("medium") ||
    t.has("intermediate") ||
    lowerName.includes("reverse") ||
    lowerName.includes("pretzel")
  )
    return "medium";
  if (
    t.has("easy") ||
    t.has("beginner") ||
    lowerName.includes("cowgirl") ||
    lowerName.includes("missionary") ||
    lowerName.includes("spooning") ||
    lowerName.includes("doggy")
  )
    return "easy";
  return "medium";
}

function inferFlexibility(name: string, tags: string[]): PositionFlexibility {
  const lowerName = name.toLowerCase();
  const metadata = Object.entries(positionMetadata).find(([key]) =>
    lowerName.includes(key.toLowerCase()),
  );
  if (metadata && metadata[1].flexibility) return metadata[1].flexibility;

  const t = new Set(tags.map(x => x.toLowerCase()));
  if (
    t.has("flexible") ||
    t.has("stretch") ||
    t.has("acrobatic") ||
    lowerName.includes("anvil") ||
    lowerName.includes("bridge") ||
    lowerName.includes("wheelbarrow")
  )
    return "high";
  if (
    t.has("standing") ||
    t.has("squat") ||
    t.has("balance") ||
    lowerName.includes("standing") ||
    lowerName.includes("lotus")
  )
    return "medium";
  return "low";
}

function inferIntimacy(name: string, tags: string[]): PositionIntimacy {
  const lowerName = name.toLowerCase();
  const metadata = Object.entries(positionMetadata).find(([key]) =>
    lowerName.includes(key.toLowerCase()),
  );
  if (metadata && metadata[1].intimacy) return metadata[1].intimacy;

  const t = new Set(tags.map(x => x.toLowerCase()));
  if (
    t.has("romantic") ||
    t.has("close") ||
    t.has("cuddle") ||
    lowerName.includes("spooning") ||
    lowerName.includes("lotus") ||
    lowerName.includes("missionary")
  )
    return "high";
  if (t.has("slow") || t.has("gentle")) return "medium";
  return "medium";
}

function inferCategory(name: string, existingCategory?: string): string {
  const lowerName = name.toLowerCase();
  const metadata = Object.entries(positionMetadata).find(([key]) =>
    lowerName.includes(key.toLowerCase()),
  );
  if (metadata && metadata[1].category) return metadata[1].category;

  if (lowerName.includes("cowgirl") || lowerName.includes("rider") || lowerName.includes("amazon"))
    return "partner-on-top";
  if (lowerName.includes("doggy") || lowerName.includes("behind") || lowerName.includes("prone"))
    return "rear-entry";
  if (lowerName.includes("standing") || lowerName.includes("wall")) return "standing";
  if (lowerName.includes("chair") || lowerName.includes("seat")) return "sitting";
  if (lowerName.includes("spoon") || lowerName.includes("scissor") || lowerName.includes("side"))
    return "side-by-side";
  if (lowerName.includes("oral") || lowerName.includes("69")) return "oral";
  if (lowerName.includes("lotus") || lowerName.includes("tantric") || lowerName.includes("yab"))
    return "tantric";
  if (lowerName.includes("missionary") || lowerName.includes("classic")) return "classic";

  return existingCategory || "misc";
}

function generateDescription(name: string, category: string): string {
  const lowerName = name.toLowerCase();

  // Check for specific position metadata
  const metadata = Object.entries(positionMetadata).find(([key]) =>
    lowerName.includes(key.toLowerCase()),
  );
  if (metadata && metadata[1].description) return metadata[1].description;

  // Generate description based on name and category
  const cleanName = name.replace(/^\d+[-\s]+/, "").trim();

  const categoryDescriptions: Record<string, string[]> = {
    "partner-on-top": [
      `${cleanName} is a partner-on-top variation that allows the active partner to control depth and rhythm.`,
      `The ${cleanName} position features one partner on top, enabling them to set the pace while maintaining intimate connection.`,
    ],
    "rear-entry": [
      `${cleanName} is a rear-entry position offering unique angles and deeper connection.`,
      `The ${cleanName} variation provides an exciting perspective with the receiving partner positioned in front.`,
    ],
    standing: [
      `${cleanName} brings intimacy to a vertical plane, perfect for spontaneous moments.`,
      `This standing variation called ${cleanName} adds excitement and requires good balance and coordination.`,
    ],
    sitting: [
      `${cleanName} utilizes a seated position for comfort and face-to-face intimacy.`,
      `The ${cleanName} is a comfortable seated variation allowing partners to embrace while connected.`,
    ],
    "side-by-side": [
      `${cleanName} is a gentle side-lying position perfect for relaxed, intimate moments.`,
      `This side-by-side variation called ${cleanName} promotes closeness and full-body contact.`,
    ],
    classic: [
      `${cleanName} is a timeless position focusing on face-to-face connection and emotional intimacy.`,
      `The ${cleanName} offers a classic approach to intimacy with emphasis on eye contact and closeness.`,
    ],
    oral: [
      `${cleanName} is a oral variation focusing on mutual pleasure and giving.`,
      `The ${cleanName} position emphasizes oral intimacy with comfortable positioning for both partners.`,
    ],
    tantric: [
      `${cleanName} draws from tantric traditions, emphasizing connection over movement.`,
      `The ${cleanName} is a meditative position that encourages synchronized breathing and presence.`,
    ],
    athletic: [
      `${cleanName} is an athletic position that challenges both partners physically.`,
      `The ${cleanName} requires strength and coordination, rewarding couples with unique sensations.`,
    ],
  };

  const descriptions = categoryDescriptions[category] || [
    `${cleanName} offers a unique approach to intimacy with its distinctive positioning.`,
    `The ${cleanName} position provides variety and new sensations for adventurous couples.`,
  ];

  return descriptions[Math.floor(name.length % descriptions.length)];
}

function generateInstructions(name: string, category: string): string[] {
  const lowerName = name.toLowerCase();

  // Check for specific position metadata
  const metadata = Object.entries(positionMetadata).find(([key]) =>
    lowerName.includes(key.toLowerCase()),
  );
  if (metadata && metadata[1].howTo) return metadata[1].howTo;

  // Generate instructions based on category
  const categoryInstructions: Record<string, string[]> = {
    "partner-on-top": [
      "Ensure mutual consent and establish comfort with this position.",
      "The bottom partner lies flat on a comfortable, stable surface.",
      "The top partner straddles and finds a comfortable position.",
      "Lower slowly and communicate about angle and depth.",
      "The top partner controls the rhythm using hip movements.",
      "Use hands for balance on chest, shoulders, or the bed.",
    ],
    "rear-entry": [
      "Discuss boundaries and establish a safe word before beginning.",
      "The receiving partner positions themselves on hands and knees.",
      "Ensure the surface is comfortable—use padding if needed.",
      "The active partner positions behind and enters slowly.",
      "The receiving partner can arch or flatten their back to adjust angles.",
      "Maintain communication about rhythm and comfort throughout.",
    ],
    standing: [
      "Choose a location with something sturdy to hold onto.",
      "Ensure both partners have good footing and balance.",
      "The shorter partner may need to stand on something or use platforms.",
      "One partner may lift a leg for easier access.",
      "Use a wall for support and stability.",
      "Take breaks if muscles fatigue—safety first.",
    ],
    sitting: [
      "Choose a sturdy chair or surface without wheels.",
      "One partner sits comfortably with feet flat on the floor.",
      "The other partner straddles or sits in their lap.",
      "Face each other for intimacy or face away for variety.",
      "Rock and grind together rather than vigorous thrusting.",
      "Use arm rests or each other for support.",
    ],
    "side-by-side": [
      "Both partners lie on their sides on a comfortable surface.",
      "Arrange pillows for head and knee support.",
      "Face the same direction (spoon style) or toward each other.",
      "Lift the top leg to allow access and entry.",
      "Move gently in synchronized motions.",
      "This is ideal for lazy, intimate sessions.",
    ],
    classic: [
      "Confirm comfort and consent with your partner.",
      "The receiving partner lies on their back, legs comfortably apart.",
      "The active partner positions on top, supporting their weight.",
      "Enter slowly and establish a comfortable rhythm.",
      "Maintain eye contact and kiss for increased intimacy.",
      "Use pillows under hips to change angles as desired.",
    ],
    oral: [
      "Discuss preferences and boundaries beforehand.",
      "Choose a comfortable position for both giving and receiving.",
      "Communicate about pressure, speed, and what feels good.",
      "Take turns or find a mutual position like side-by-side.",
      "Use hands in conjunction with mouth for variety.",
      "Always respect your partner's signals and limits.",
    ],
    tantric: [
      "Create a calm, comfortable environment with low lighting.",
      "Sit facing each other in a comfortable position.",
      "The partner with the smaller frame sits in the other's lap.",
      "Wrap legs around your partner and hold each other close.",
      "Focus on breathing together rather than vigorous movement.",
      "Make eye contact and stay present with each other.",
    ],
    athletic: [
      "Ensure both partners are warmed up and stretched.",
      "Clear the area of hazards—safety is paramount.",
      "Start in a stable base position before transitioning.",
      "The supporting partner should have a strong stance.",
      "Communicate constantly about balance and comfort.",
      "Don't be afraid to laugh and stop if needed—have fun.",
    ],
  };

  return (
    categoryInstructions[category] || [
      "Confirm mutual consent and discuss boundaries before starting.",
      "Choose a comfortable, stable surface with appropriate support.",
      "Start slowly and communicate throughout the experience.",
      "Adjust positions and angles for maximum comfort.",
      "Use pillows, blankets, or furniture for additional support.",
      "Stop immediately if either partner experiences discomfort.",
    ]
  );
}

function generateTips(name: string, tags: string[]): string[] {
  const t = new Set(tags.map(x => x.toLowerCase()));
  const lowerName = name.toLowerCase();

  const tips: string[] = [];

  // Position-specific tips
  if (lowerName.includes("cowgirl") || lowerName.includes("rider")) {
    tips.push("Lean forward or back to change the angle and sensation.");
    tips.push("Use circular hip motions for variety.");
  }
  if (lowerName.includes("doggy") || lowerName.includes("behind")) {
    tips.push("Arching the back changes the sensation significantly.");
    tips.push("A pillow under the hips can provide comfort and better angles.");
  }
  if (lowerName.includes("standing")) {
    tips.push("Use a wall or sturdy furniture for balance and support.");
    tips.push("Wear shoes with grip if the floor is slippery.");
  }
  if (lowerName.includes("spoon")) {
    tips.push("This is perfect for morning intimacy when energy is low.");
    tips.push("The back partner can reach around for additional stimulation.");
  }

  // General tips based on tags
  tips.push("Use controlled movement and keep your core engaged to reduce joint strain.");
  tips.push("Keep a towel and water nearby, especially for longer sessions.");
  tips.push("Consider warm-up stretching for hips and lower back beforehand.");

  if (t.has("standing") || lowerName.includes("standing")) {
    tips.unshift("Have something sturdy to hold onto for balance.");
  }
  if (t.has("floor") || lowerName.includes("floor")) {
    tips.unshift("Use a mat or blanket to protect knees and elbows.");
  }

  return tips.slice(0, 6);
}

function generateBenefits(name: string, tags: string[], category: string): string[] {
  const t = new Set(tags.map(x => x.toLowerCase()));
  const lowerName = name.toLowerCase();

  const benefits: string[] = [];

  // Category-specific benefits
  const categoryBenefits: Record<string, string[]> = {
    "partner-on-top": [
      "Allows the top partner to control depth and pace.",
      "Great for partners with size differences.",
    ],
    "rear-entry": ["Allows for deep penetration.", "Leaves hands free for additional stimulation."],
    standing: [
      "Can happen anywhere, adding spontaneity.",
      "Creates a sense of urgency and excitement.",
    ],
    sitting: [
      "Comfortable and sustainable for longer sessions.",
      "Allows for face-to-face intimacy.",
    ],
    "side-by-side": [
      "Low-energy option perfect for relaxation.",
      "Promotes full-body contact and closeness.",
    ],
    classic: ["Maximizes emotional connection.", "Allows for kissing and eye contact throughout."],
    oral: ["Focuses on one partner's pleasure.", "Can be incredibly intimate and giving."],
    tantric: [
      "Deepens emotional and spiritual connection.",
      "Encourages presence and mindfulness.",
    ],
    athletic: [
      "Provides exciting physical challenge.",
      "Creates memorable and adventurous experiences.",
    ],
  };

  if (categoryBenefits[category]) {
    benefits.push(...categoryBenefits[category]);
  }

  benefits.push("Encourages communication and teamwork between partners.");
  benefits.push("Can be adapted with props for comfort and accessibility.");

  if (t.has("standing") || lowerName.includes("standing")) {
    benefits.push("Offers variation in height and angle without complex setup.");
  }
  if (t.has("cuddle") || t.has("close") || lowerName.includes("spoon")) {
    benefits.push("Supports closeness and emotional bonding.");
  }

  return benefits.slice(0, 6);
}

function deriveStimulationType(name: string, tags: string[]): string[] {
  const t = new Set(tags.map(x => x.toLowerCase()));
  const lowerName = name.toLowerCase();
  const out = new Set<string>();

  out.add("Connection & intimacy");

  if (t.has("standing") || t.has("balance") || lowerName.includes("standing")) {
    out.add("Full-body engagement");
  }
  if (
    t.has("slow") ||
    t.has("gentle") ||
    lowerName.includes("spoon") ||
    lowerName.includes("tantric")
  ) {
    out.add("Relaxation & comfort");
  }
  if (
    t.has("acrobatic") ||
    t.has("flexible") ||
    lowerName.includes("bridge") ||
    lowerName.includes("wheelbarrow")
  ) {
    out.add("Athletic challenge");
  }
  if (
    lowerName.includes("cowgirl") ||
    lowerName.includes("rider") ||
    lowerName.includes("amazon")
  ) {
    out.add("Partner control");
  }
  if (lowerName.includes("doggy") || lowerName.includes("behind") || lowerName.includes("prone")) {
    out.add("Deep penetration");
  }
  if (lowerName.includes("missionary") || lowerName.includes("lotus")) {
    out.add("Eye contact & kissing");
  }

  return Array.from(out).slice(0, 6);
}

export function getGeneratedNsfwPositionsFromGitHubImages(): NSFWPosition[] {
  return nsfwPositionImagesAll.map(img => {
    const tags = Array.isArray(img.tags) ? img.tags : [];
    const name = String(img.name || "Untitled").trim();

    // Infer category from name first, then fall back to existing category
    const category = inferCategory(name, normalizeCategory(img.category));

    // Use name-aware inference for difficulty, flexibility, and intimacy
    const difficulty = inferDifficulty(name, tags);
    const requiredFlexibility = inferFlexibility(name, tags);
    const intimacyLevel = inferIntimacy(name, tags);

    // Generate rich description and instructions based on position name
    const description = generateDescription(name, category);
    const instructions = generateInstructions(name, category);
    const benefits = generateBenefits(name, tags, category);
    const tips = generateTips(name, tags);
    const stimulationType = deriveStimulationType(name, tags);

    const position: NSFWPosition = {
      id: img.key,
      name,
      category,
      difficulty,
      description,
      summary: `Learn the ${name.replace(/^\d+[-\s]+/, "").trim()} position with step-by-step guidance and safety tips.`,
      instructions,
      benefits,
      tips,
      tags: Array.from(new Set([category, ...tags])).slice(0, 24),
      stimulationType,
      requiredFlexibility,
      intimacyLevel,
      images: [img.url],
      source: { kind: "github-images", key: img.key, path: img.path },
    };

    return position;
  });
}
