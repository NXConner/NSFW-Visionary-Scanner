import type { HealthTopic } from "@/components/educationCenter/types";

export const healthTopicsPart2: HealthTopic[] = [
  {
    id: "balanitis",
    title: "Balanitis",
    category: "skin",
    severity: "mild",
    overview:
      "Balanitis is inflammation of the head (glans) of the penis. It's common in uncircumcised men and can be caused by infections, skin conditions, or poor hygiene. Most cases are easily treated.",
    causes: [
      "Poor hygiene (not cleaning under foreskin)",
      "Yeast (candida) infections",
      "Bacterial infections",
      "Skin irritation from soaps, detergents",
      "Diabetes (increases risk)",
      "Tight foreskin (phimosis)",
    ],
    symptoms: [
      "Redness and swelling of the glans",
      "Itching or burning",
      "Discharge or smegma buildup",
      "Pain during urination",
      "Difficulty retracting foreskin",
      "Unpleasant smell",
    ],
    diagnosis:
      "Usually diagnosed by visual examination. Swabs may be taken to identify infection type. Blood glucose test if diabetes suspected.",
    treatment: [
      "Improved hygiene - gentle daily cleaning",
      "Antifungal creams for yeast infections",
      "Antibiotics for bacterial infections",
      "Steroid creams for inflammation",
      "Circumcision for recurrent cases",
    ],
    prevention: [
      "Daily cleaning under foreskin with warm water",
      "Dry thoroughly after washing",
      "Avoid harsh soaps on genital area",
      "Manage diabetes if present",
      "Use condoms with new partners",
    ],
    whenToSeeDoctor: [
      "Symptoms don't improve with hygiene",
      "Severe pain or swelling",
      "Unable to retract foreskin",
      "Recurring episodes",
      "Signs of spreading infection",
    ],
    faqs: [
      {
        question: "Is balanitis an STI?",
        answer:
          "No, balanitis itself is not an STI, though it can sometimes be caused by STIs. Most cases are due to hygiene or yeast infections.",
      },
      {
        question: "Can balanitis be prevented?",
        answer:
          "Yes, most cases are preventable with good hygiene - gently cleaning under the foreskin daily and keeping the area dry.",
      },
    ],
  },
  {
    id: "yeast-infection",
    title: "Male Yeast Infection (Candidiasis)",
    category: "infection",
    severity: "mild",
    overview:
      "While often associated with women, men can also develop yeast infections caused by Candida fungus. It typically affects the head of the penis and can cause itching, redness, and discharge.",
    causes: [
      "Overgrowth of Candida yeast",
      "Unprotected sex with infected partner",
      "Poor hygiene",
      "Antibiotics (kill good bacteria)",
      "Diabetes or weakened immune system",
      "Being uncircumcised",
    ],
    symptoms: [
      "Redness, itching, or burning on penis head",
      "White, cottage cheese-like discharge",
      "Shiny patches on the penis",
      "Small red spots",
      "Burning during urination or sex",
    ],
    diagnosis:
      "Usually diagnosed by examination. Swab culture confirms Candida presence if needed.",
    treatment: [
      "Over-the-counter antifungal creams (miconazole, clotrimazole)",
      "Prescription oral fluconazole for severe cases",
      "Keep area clean and dry",
      "Partner treatment may be needed",
    ],
    prevention: [
      "Good genital hygiene",
      "Wear cotton, breathable underwear",
      "Change out of wet clothes promptly",
      "Limit sugar intake (feeds yeast)",
      "Use condoms with new partners",
    ],
    whenToSeeDoctor: [
      "First-time symptoms",
      "OTC treatment doesn't work after a week",
      "Symptoms are severe",
      "Recurring infections",
    ],
    faqs: [
      {
        question: "Can men get yeast infections from women?",
        answer:
          "Yes, yeast infections can be passed between sexual partners, though they're not classified as STIs.",
      },
      {
        question: "Do I need to treat my partner?",
        answer:
          "If your partner has symptoms, they should be treated. Treating partners may help prevent reinfection.",
      },
    ],
  },
  {
    id: "jock-itch",
    title: "Jock Itch (Tinea Cruris)",
    category: "infection",
    severity: "mild",
    overview:
      "Jock itch is a fungal infection affecting the groin, inner thighs, and buttocks. It causes an itchy, red, ring-shaped rash. While uncomfortable, it's generally harmless and responds well to treatment.",
    causes: [
      "Fungi that thrive in warm, moist environments",
      "Sweating heavily",
      "Wearing tight clothing",
      "Sharing towels or athletic equipment",
      "Having athlete's foot (can spread to groin)",
      "Obesity (skin folds trap moisture)",
    ],
    symptoms: [
      "Red, ring-shaped rash",
      "Itching and burning",
      "Flaking, peeling, or cracking skin",
      "Rash may spread to inner thighs",
      "Edges of rash are raised and scaly",
    ],
    diagnosis:
      "Usually diagnosed by visual examination of the characteristic rash. Skin scraping may confirm fungal presence.",
    treatment: [
      "Antifungal creams (terbinafine, clotrimazole)",
      "Keep area clean and dry",
      "Wear loose, breathable clothing",
      "Apply powder to reduce moisture",
      "Treat athlete's foot if present",
    ],
    prevention: [
      "Dry groin area thoroughly after showering",
      "Wear clean, dry underwear daily",
      "Change out of wet workout clothes",
      "Don't share towels or personal items",
      "Treat athlete's foot to prevent spreading",
    ],
    whenToSeeDoctor: [
      "Rash doesn't improve after 2 weeks of treatment",
      "Rash spreads or worsens",
      "Signs of bacterial infection (pus, fever)",
      "Recurring infections",
    ],
    faqs: [
      {
        question: "Is jock itch contagious?",
        answer:
          "Yes, the fungus can spread through direct contact or sharing towels and clothing. It can also spread from your own athlete's foot.",
      },
      {
        question: "How long does jock itch take to heal?",
        answer:
          "With treatment, jock itch usually clears up in 2-4 weeks. Continue treatment for the full recommended time to prevent recurrence.",
      },
    ],
  },
  {
    id: "phimosis",
    title: "Phimosis",
    category: "skin",
    severity: "moderate",
    overview:
      "Phimosis is a condition where the foreskin is too tight to be pulled back over the head of the penis. It's normal in young children but can cause problems in older boys and men.",
    causes: [
      "Natural variation (foreskin hasn't stretched)",
      "Scarring from infections or injuries",
      "Repeated balanitis",
      "Skin conditions (lichen sclerosus)",
      "Forced retraction in childhood",
    ],
    symptoms: [
      "Inability to retract foreskin",
      "Ballooning of foreskin during urination",
      "Pain during erections or sex",
      "Recurrent infections",
      "Difficulty cleaning under foreskin",
    ],
    diagnosis:
      "Diagnosed by physical examination. Doctor will assess severity and look for underlying causes.",
    treatment: [
      "Steroid cream application (loosens foreskin)",
      "Gentle stretching exercises",
      "Preputioplasty (surgical widening)",
      "Circumcision (for severe cases)",
      "Treat underlying infections first",
    ],
    prevention: [
      "Gentle, gradual foreskin retraction (not forced)",
      "Good hygiene to prevent scarring infections",
      "Early treatment of balanitis",
      "Avoid forcing foreskin back in children",
    ],
    whenToSeeDoctor: [
      "Unable to urinate properly",
      "Severe pain with erections",
      "Recurrent infections",
      "Foreskin trapped behind glans (paraphimosis - emergency)",
      "Conservative treatments haven't worked",
    ],
    faqs: [
      {
        question: "Can phimosis be treated without surgery?",
        answer:
          "Yes, most cases respond to steroid creams and gentle stretching. Surgery is reserved for cases that don't respond to conservative treatment.",
      },
      {
        question: "Is phimosis dangerous?",
        answer:
          "Phimosis itself isn't dangerous, but it can lead to infections and hygiene problems. Paraphimosis (foreskin stuck behind glans) is a medical emergency.",
      },
    ],
  },
  {
    id: "erectile-dysfunction",
    title: "Erectile Dysfunction",
    category: "general",
    severity: "moderate",
    overview:
      "Erectile dysfunction (ED) is the inability to get or maintain an erection firm enough for sex. Occasional ED is common, but frequent problems may indicate underlying health conditions requiring treatment.",
    causes: [
      "Cardiovascular disease",
      "Diabetes",
      "High blood pressure",
      "Low testosterone",
      "Psychological factors (stress, anxiety, depression)",
      "Medications (antidepressants, blood pressure drugs)",
      "Obesity and sedentary lifestyle",
      "Smoking and alcohol use",
      "Peyronie's disease",
    ],
    symptoms: [
      "Difficulty getting an erection",
      "Difficulty maintaining an erection",
      "Reduced sexual desire",
      "Erections that are less firm than before",
    ],
    diagnosis:
      "Physical exam, blood tests (testosterone, blood sugar, cholesterol), and questionnaires about symptoms. Ultrasound or injection tests may assess blood flow.",
    treatment: [
      "PDE5 inhibitors (sildenafil, tadalafil, vardenafil)",
      "Testosterone therapy if levels are low",
      "Vacuum erection devices",
      "Penile injections or suppositories",
      "Penile implants for severe cases",
      "Counseling for psychological factors",
      "Lifestyle modifications",
    ],
    prevention: [
      "Regular exercise",
      "Maintain healthy weight",
      "Manage chronic conditions (diabetes, hypertension)",
      "Quit smoking",
      "Limit alcohol",
      "Reduce stress",
      "Regular health check-ups",
    ],
    whenToSeeDoctor: [
      "ED is causing relationship problems",
      "You have concerns about erections",
      "You have diabetes or heart disease",
      "Other symptoms accompany ED",
      "ED began after starting new medication",
    ],
    faqs: [
      {
        question: "Is ED a normal part of aging?",
        answer:
          "While ED becomes more common with age, it's not an inevitable part of aging. Many underlying causes are treatable at any age.",
      },
      {
        question: "Can ED be a sign of heart disease?",
        answer:
          "Yes, ED can be an early warning sign of cardiovascular disease. The blood vessels in the penis are smaller and may show damage before larger vessels.",
      },
    ],
  },
];
