import React from "react";
import { Circle, CircleDot } from "lucide-react";

import type { GuideSection } from "@/components/mensHealthGuide/types";

export const cockRingsGuide: GuideSection = {
  title: "Cock Rings (Types & Styles)",
  icon: <Circle className="h-5 w-5" />,
  whatIsIt:
    "Cock rings are worn around the base of the penis (and sometimes including the scrotum) to restrict blood outflow, helping maintain erections and potentially enhancing sensation. They come in various materials and styles for different purposes.",
  howToUse: [
    "BASIC RING: Place on flaccid/semi-erect penis, position at base",
    "WITH SCROTUM: Testicles go through first, then penis",
    "ADJUSTABLE: Start loose and tighten gradually",
    "VIBRATING: Ensure battery is charged, position vibration motor",
    "Remove after 20-30 minutes maximum",
    "Use lubricant for easier removal",
    "Never force a ring that's too small",
  ],
  benefits: [
    "Helps maintain erections",
    "May enhance sensation for both partners",
    "Vibrating versions add stimulation",
    "Non-invasive ED assistance",
    "Many styles and materials available",
    "Relatively safe when used correctly",
  ],
  cons: [
    "Risk if left on too long",
    "Can be uncomfortable if sized wrong",
    "Non-stretchy materials can be dangerous",
    "May take practice to use effectively",
    "Can pinch skin or hair",
  ],
  warnings: [
    "Never use a non-stretchy ring if inexperienced",
    "Remove immediately if any numbness occurs",
    "Do not wear for more than 30 minutes",
    "Avoid if you have blood clotting issues",
    "Metal rings require careful sizing",
  ],
  dangers: [
    "Rings that don't stretch can get stuck (medical emergency)",
    "Prolonged use can cause tissue damage",
    "Can cause priapism in rare cases",
    "Metal rings may require emergency cutting",
  ],
  safetyTips: [
    "Start with stretchy silicone rings",
    "Size properly - snug but not tight",
    "Set a timer for safety",
    "Have lubricant ready for removal",
    "Avoid alcohol when using (reduces awareness)",
    "For metal rings: get professionally sized first",
  ],
  whatToLookFor: [
    "Discoloration beyond the ring",
    "Coldness or numbness",
    "Difficulty removing (use lube, stay calm)",
    "Pain or extreme tightness",
    "Any unusual swelling",
  ],
  experienceLevel: ["beginner", "intermediate", "advanced"],
};

export const ballStretchersGuide: GuideSection = {
  title: "Ball Stretchers & Testicular Health",
  icon: <CircleDot className="h-5 w-5" />,
  whatIsIt:
    "Ball stretchers are rings or weights worn around the scrotum above the testicles. They're used to create a lower-hanging appearance and can be worn during intimacy or daily. They range from leather straps to weighted metal rings. Some men use them for aesthetic preference or sensation enhancement.",
  howToUse: [
    "Start with soft, lightweight stretchers (silicone or leather)",
    "Apply when scrotum is warm and relaxed (after shower)",
    "Position above testicles, below base of penis",
    "Ensure both testicles are below the stretcher",
    "Begin wearing for 30-60 minutes and gradually increase",
    "Remove if any discomfort occurs",
    "Work up to weighted options only after adaptation",
  ],
  benefits: [
    "Creates desired aesthetic (lower hang)",
    "Can enhance sensation during intimacy",
    "Some report improved orgasm intensity",
    "Available in many materials and weights",
    "Non-permanent, removable",
    "Can be worn under clothes for some designs",
  ],
  cons: [
    "Risk of circulation restriction",
    "Can be uncomfortable if fitted wrong",
    "Not suitable for all anatomy types",
    "May cause skin irritation with some materials",
    "Weighted versions require careful progression",
    "Can affect sperm production with prolonged use",
  ],
  warnings: [
    "Never wear while sleeping",
    "Remove immediately if testicles turn cold or blue",
    "Do not use if you have varicocele or hydrocele",
    "Heavy weights can cause serious injury",
    "Prolonged heat can affect sperm production",
    "Do not wear for more than 4-6 hours initially",
  ],
  dangers: [
    "Cutting off blood supply can cause permanent damage",
    "Too tight can cause testicular torsion (emergency)",
    "Heavy weights can stretch skin only, causing injury",
    "Allergic reactions to certain metals",
    "Can cause chronic pain if overused",
  ],
  safetyTips: [
    "Size properly - should be snug, not tight",
    "Start with lightweight, flexible materials",
    "Check circulation frequently",
    "Limit wear time especially when starting",
    "Remove during physical activity",
    "Keep area clean and dry",
    "Never force testicles through an opening",
  ],
  whatToLookFor: [
    "Color change in testicles (blue/purple = emergency)",
    "Cold testicles (remove immediately)",
    "Numbness or tingling",
    "Swelling that doesn't resolve",
    "Skin irritation or breakdown",
    "Any testicular pain",
  ],
  experienceLevel: ["intermediate", "advanced"],
};

