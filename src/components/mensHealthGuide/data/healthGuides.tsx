import React from "react";
import { CheckCircle2, Heart } from "lucide-react";

import type {
  ProstateHealthGuide,
  TesticularHealthGuide,
} from "@/components/mensHealthGuide/types";

export const testicularHealthGuide: TesticularHealthGuide = {
  title: "Testicular Self-Examination",
  icon: <CheckCircle2 className="h-5 w-5" />,
  content: {
    importance:
      "Regular testicular self-exams can help detect testicular cancer early, when it's most treatable. Testicular cancer is most common in men aged 15-35, making regular self-checks crucial. When caught early, testicular cancer has a 95%+ survival rate.",
    howToExam: [
      "Perform monthly, ideally after a warm bath or shower when scrotum is relaxed",
      "Stand in front of a mirror and look for any swelling",
      "Examine each testicle separately using both hands",
      "Roll the testicle gently between thumb and fingers",
      "Feel for any hard lumps, smooth bumps, or changes in size/shape",
      "The epididymis (soft tube behind each testicle) is normal - learn its feel",
      "Compare both testicles - slight size difference is normal",
    ],
    normalFindings: [
      "Testicles should feel firm but not hard",
      "Smooth, oval shape",
      "One testicle slightly larger is normal",
      "One hanging lower is normal (usually left)",
      "Soft, rope-like epididymis behind each testicle",
    ],
    warningSignsRequireDoctor: [
      "Hard lump ON the testicle (not the epididymis)",
      "Testicle significantly enlarged",
      "Heavy feeling in scrotum",
      "Dull ache in lower abdomen or groin",
      "Sudden fluid collection in scrotum",
      "Pain or discomfort in testicle",
      "Change in firmness of testicle",
    ],
    commonConditions: [
      {
        name: "Varicocele",
        description:
          "Enlarged veins in scrotum - feels like 'bag of worms', usually left side. Common, often harmless, but see doctor if new.",
      },
      {
        name: "Hydrocele",
        description:
          "Fluid around testicle causing swelling. Usually painless. Get checked to rule out other causes.",
      },
      {
        name: "Epididymal Cyst",
        description:
          "Fluid-filled cyst on epididymis. Common, usually benign. Monitor for changes.",
      },
      {
        name: "Epididymitis",
        description:
          "Infection/inflammation of epididymis. Painful, may have fever. Requires antibiotics.",
      },
      {
        name: "Testicular Torsion",
        description:
          "EMERGENCY - testicle twists, cutting blood supply. Severe sudden pain. Seek immediate care.",
      },
    ],
  },
};

export const prostateHealthGuide: ProstateHealthGuide = {
  title: "Prostate Health & Massage",
  icon: <Heart className="h-5 w-5" />,
  content: {
    whatIsProstate:
      "The prostate is a walnut-sized gland below the bladder, surrounding the urethra. It produces fluid that nourishes and protects sperm. Prostate health becomes increasingly important as men age, with many experiencing enlargement (BPH) or other issues after age 50.",
    benefits: [
      "May help relieve symptoms of chronic prostatitis",
      "Can help drain prostatic fluid",
      "Some report improved urinary symptoms",
      "May enhance sexual pleasure and orgasm intensity",
      "Used medically for certain prostate conditions",
    ],
    howToSafely: [
      "Ensure bowels are empty and area is clean",
      "Trim fingernails short with no rough edges",
      "Use plenty of water-based lubricant",
      "Insert finger slowly (1-2 inches) toward the belly button",
      "The prostate feels like a firm, rounded bulge",
      "Apply gentle pressure in a 'come hither' motion",
      "Sessions should be gentle and brief (few minutes)",
      "Stop if you experience pain",
    ],
    warnings: [
      "Do NOT massage if you have acute prostatitis (infection with fever)",
      "Avoid if you have hemorrhoids or anal fissures",
      "Do not use if you have prostate cancer",
      "Stop if you experience pain or see blood",
      "Consult doctor if you have any prostate conditions",
    ],
    signsOfProstateProblems: [
      "Frequent urination, especially at night",
      "Difficulty starting or stopping urination",
      "Weak urine stream or dribbling",
      "Painful urination or ejaculation",
      "Blood in urine or semen",
      "Pain in lower back, hips, or pelvis",
      "Erectile dysfunction (can be a symptom)",
    ],
    screeningRecommendations: [
      "Discuss PSA testing with doctor starting at age 50 (earlier if high risk)",
      "High risk: African American men, family history",
      "Digital rectal exam may be recommended",
      "Know your baseline and monitor changes",
      "Report any urinary symptoms to your doctor",
    ],
  },
};
