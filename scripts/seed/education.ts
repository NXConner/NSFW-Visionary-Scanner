import { supabase } from "./supabase";

type ModuleSeed = {
  title: string;
  description: string;
  category:
    | "anatomy"
    | "function"
    | "conditions"
    | "treatment"
    | "prevention"
    | "wellness"
    | "relationships"
    | "myths";
  difficulty_level: "beginner" | "intermediate" | "advanced";
  estimated_duration_minutes: number;
  content_type: "article";
  content_text: string;
  author: string;
  expert_reviewed: boolean;
  order_index: number;
  is_featured?: boolean;
  is_premium?: boolean;
};

const modules: ModuleSeed[] = [
  {
    title: "Male reproductive anatomy overview",
    description: "A clear, educational overview of penile anatomy and supporting structures.",
    category: "anatomy",
    difficulty_level: "beginner",
    estimated_duration_minutes: 18,
    content_type: "article",
    content_text: [
      "The penis is supported by the corpora cavernosa and corpus spongiosum.",
      "The tunica albuginea provides structural support and elasticity.",
      "Healthy blood flow and nerve function are central to erection quality.",
      "This module is educational and not a substitute for medical advice.",
    ].join("\n"),
    author: "MorphoScan Pro Clinical Advisory Team",
    expert_reviewed: true,
    order_index: 1,
    is_featured: true,
  },
  {
    title: "Erection physiology basics",
    description: "Understand arousal, blood flow, and the role of the nervous system.",
    category: "function",
    difficulty_level: "beginner",
    estimated_duration_minutes: 20,
    content_type: "article",
    content_text: [
      "Erections rely on blood inflow, smooth muscle relaxation, and nerve signaling.",
      "Stress, sleep, and cardiovascular health influence erectile function.",
      "Temporary changes are common; persistent issues warrant medical review.",
    ].join("\n"),
    author: "MorphoScan Pro Clinical Advisory Team",
    expert_reviewed: true,
    order_index: 2,
  },
  {
    title: "Peyronie's disease overview",
    description: "Learn the basics of curvature, plaques, and progression patterns.",
    category: "conditions",
    difficulty_level: "beginner",
    estimated_duration_minutes: 22,
    content_type: "article",
    content_text: [
      "Peyronie's involves scar tissue that can change curvature or cause pain.",
      "Early tracking helps document changes over time.",
      "Seek medical guidance if curvature increases or pain persists.",
    ].join("\n"),
    author: "MorphoScan Pro Clinical Advisory Team",
    expert_reviewed: true,
    order_index: 3,
  },
  {
    title: "Erectile dysfunction basics",
    description: "Common causes, risk factors, and when to seek support.",
    category: "conditions",
    difficulty_level: "beginner",
    estimated_duration_minutes: 20,
    content_type: "article",
    content_text: [
      "ED can be influenced by stress, hormones, medications, or vascular health.",
      "Track patterns and lifestyle factors to support clinician discussions.",
      "Avoid self-diagnosis; professional guidance is recommended for persistent ED.",
    ].join("\n"),
    author: "MorphoScan Pro Clinical Advisory Team",
    expert_reviewed: true,
    order_index: 4,
  },
  {
    title: "Treatment pathways and when to seek care",
    description: "Overview of professional care pathways and supportive options.",
    category: "treatment",
    difficulty_level: "intermediate",
    estimated_duration_minutes: 24,
    content_type: "article",
    content_text: [
      "Treatment plans vary by condition and individual history.",
      "Bring measurement logs and symptom notes to clinician visits.",
      "Avoid aggressive self-treatment during acute pain or injury.",
    ].join("\n"),
    author: "MorphoScan Pro Clinical Advisory Team",
    expert_reviewed: true,
    order_index: 5,
  },
  {
    title: "Injury prevention and safe practice",
    description: "Reduce risk with warm-ups, gentle intensity, and recovery.",
    category: "prevention",
    difficulty_level: "beginner",
    estimated_duration_minutes: 16,
    content_type: "article",
    content_text: [
      "Use warm-up routines before any PE technique.",
      "Do not train through pain, numbness, or bruising.",
      "Rest and recovery are required for safe progress.",
    ].join("\n"),
    author: "MorphoScan Pro Clinical Advisory Team",
    expert_reviewed: true,
    order_index: 6,
  },
  {
    title: "Pelvic floor wellness",
    description: "Build foundational pelvic floor strength and relaxation.",
    category: "wellness",
    difficulty_level: "intermediate",
    estimated_duration_minutes: 20,
    content_type: "article",
    content_text: [
      "Pelvic floor training supports control, comfort, and circulation.",
      "Balance contraction with full relaxation to avoid tension.",
      "Consider pelvic health professionals for personalized guidance.",
    ].join("\n"),
    author: "MorphoScan Pro Clinical Advisory Team",
    expert_reviewed: true,
    order_index: 7,
  },
  {
    title: "Communication and consent basics",
    description: "Improve trust and comfort through clear communication.",
    category: "relationships",
    difficulty_level: "beginner",
    estimated_duration_minutes: 15,
    content_type: "article",
    content_text: [
      "Open communication builds trust and reduces anxiety.",
      "Agree on boundaries and check-ins with partners.",
      "Consent is ongoing and can be updated at any time.",
    ].join("\n"),
    author: "MorphoScan Pro Clinical Advisory Team",
    expert_reviewed: true,
    order_index: 8,
  },
  {
    title: "Myths about size and performance",
    description: "Separate common misconceptions from evidence-based guidance.",
    category: "myths",
    difficulty_level: "beginner",
    estimated_duration_minutes: 12,
    content_type: "article",
    content_text: [
      "Size myths often increase anxiety without improving health outcomes.",
      "Focus on comfort, function, and confidence rather than comparisons.",
      "Progress should be measured safely and realistically.",
    ].join("\n"),
    author: "MorphoScan Pro Clinical Advisory Team",
    expert_reviewed: true,
    order_index: 9,
  },
];

const qaItems = [
  {
    question: "How often should I measure progress?",
    answer:
      "Monthly measurements are usually enough to track trends without adding anxiety. Use consistent conditions and record notes about recovery.",
    category: "wellness",
    answered_by: "MorphoScan Pro Clinical Advisory Team",
    expert_verified: true,
    tags: ["tracking", "measurements"],
  },
  {
    question: "What should I do if curvature changes quickly?",
    answer:
      "Rapid curvature changes or pain warrant professional medical guidance. Document your symptoms and seek a clinician for evaluation.",
    category: "conditions",
    answered_by: "MorphoScan Pro Clinical Advisory Team",
    expert_verified: true,
    tags: ["peyronies", "curvature"],
  },
  {
    question: "Can stress affect erection quality?",
    answer:
      "Yes. Stress impacts nervous system response, sleep, and circulation. Tracking stress and recovery can help identify patterns.",
    category: "function",
    answered_by: "MorphoScan Pro Clinical Advisory Team",
    expert_verified: true,
    tags: ["stress", "erection"],
  },
  {
    question: "Is pelvic floor training safe for beginners?",
    answer:
      "Yes when performed gently with rest days. Avoid straining and stop if you feel pain or spasms.",
    category: "wellness",
    answered_by: "MorphoScan Pro Clinical Advisory Team",
    expert_verified: true,
    tags: ["pelvic floor", "training"],
  },
  {
    question: "When should I stop a PE session?",
    answer:
      "Stop if you feel sharp pain, numbness, bruising, or significant discoloration. Rest and seek professional guidance if symptoms persist.",
    category: "prevention",
    answered_by: "MorphoScan Pro Clinical Advisory Team",
    expert_verified: true,
    tags: ["safety", "injury"],
  },
  {
    question: "How do I talk with a partner about goals or concerns?",
    answer:
      "Use clear, respectful language and agree on boundaries. Consent and comfort should guide every conversation.",
    category: "relationships",
    answered_by: "MorphoScan Pro Clinical Advisory Team",
    expert_verified: true,
    tags: ["communication", "consent"],
  },
];

const expertContent = [
  {
    expert_name: "MorphoScan Pro Clinical Advisory Team",
    expert_title: "Men's Sexual Health Advisory",
    expert_credentials: "Clinical advisory panel",
    expert_bio:
      "Our advisory team focuses on evidence-informed education for sexual wellness and safe practices.",
    content_type: "interview",
    title: "How to build a safe, sustainable routine",
    description: "A short guide to pacing, recovery, and safe intensity.",
    content_text:
      "Start slowly, prioritize warm-ups, and track recovery signals. Consistency and safety matter more than intensity. If pain or new curvature appears, pause and seek professional guidance.",
    duration_minutes: 10,
    topics: ["safety", "routine", "recovery"],
    tags: ["pe", "safety"],
    is_premium: false,
  },
  {
    expert_name: "MorphoScan Pro Clinical Advisory Team",
    expert_title: "Pelvic Floor Wellness",
    expert_credentials: "Pelvic health guidance",
    expert_bio:
      "Focused on pelvic floor education, breathing coordination, and healthy training habits.",
    content_type: "article",
    title: "Pelvic floor training essentials",
    description: "Simple steps to build control without overtraining.",
    content_text:
      "Gentle contractions paired with steady breathing can improve control and comfort. Balance work with full relaxation and avoid straining or pain.",
    duration_minutes: 8,
    topics: ["pelvic floor", "wellness"],
    tags: ["training", "breathing"],
    is_premium: false,
  },
];

const researchUpdates = [
  {
    title: "AUA Guideline: Peyronie's Disease",
    summary:
      "The American Urological Association outlines evaluation and management pathways for Peyronie's disease.",
    full_article:
      "The guideline emphasizes clinical evaluation, documentation of curvature, and individualized treatment. It highlights shared decision-making and appropriate referrals.",
    source_url: "https://www.auanet.org/guidelines/peyronies-disease",
    source_name: "American Urological Association",
    category: "guideline",
    tags: ["peyronies", "urology", "guideline"],
    published_date: new Date().toISOString().slice(0, 10),
    relevance_score: 92,
  },
  {
    title: "Mayo Clinic: Erectile dysfunction overview",
    summary: "Mayo Clinic describes common causes of ED and when to seek medical care.",
    full_article:
      "The overview emphasizes physical and psychological contributors to ED, lifestyle factors, and the value of professional assessment for persistent concerns.",
    source_url:
      "https://www.mayoclinic.org/diseases-conditions/erectile-dysfunction/symptoms-causes/syc-20355776",
    source_name: "Mayo Clinic",
    category: "research",
    tags: ["ed", "health", "lifestyle"],
    published_date: new Date().toISOString().slice(0, 10),
    relevance_score: 88,
  },
  {
    title: "Cleveland Clinic: Pelvic floor therapy",
    summary: "Cleveland Clinic outlines pelvic floor therapy basics and benefits.",
    full_article:
      "Pelvic floor therapy can improve control and comfort when guided by qualified clinicians. The resource stresses proper assessment and personalized plans.",
    source_url: "https://my.clevelandclinic.org/health/treatments/21765-pelvic-floor-therapy",
    source_name: "Cleveland Clinic",
    category: "study",
    tags: ["pelvic floor", "therapy", "wellness"],
    published_date: new Date().toISOString().slice(0, 10),
    relevance_score: 85,
  },
];

export async function seedEducationContent() {
  const moduleTitles = modules.map(m => m.title);
  const { data: existingModules } = await supabase
    .from("sexual_health_education_modules")
    .select("id, title")
    .in("title", moduleTitles);
  const moduleMap = new Map((existingModules || []).map(m => [String(m.title), String(m.id)]));

  const moduleRows = modules.map(m => ({
    id: moduleMap.get(m.title),
    title: m.title,
    description: m.description,
    category: m.category,
    difficulty_level: m.difficulty_level,
    estimated_duration_minutes: m.estimated_duration_minutes,
    content_type: m.content_type,
    content_text: m.content_text,
    author: m.author,
    expert_reviewed: m.expert_reviewed,
    order_index: m.order_index,
    is_featured: Boolean(m.is_featured),
    is_premium: Boolean(m.is_premium),
    last_updated: new Date().toISOString(),
  }));

  const { error: moduleError } = await supabase
    .from("sexual_health_education_modules")
    .upsert(moduleRows, { onConflict: "id" });
  if (moduleError) {
    console.error("Error seeding education modules:", moduleError.message);
    return;
  }

  const qaQuestions = qaItems.map(q => q.question);
  const { data: existingQa } = await supabase
    .from("education_qa")
    .select("id, question")
    .in("question", qaQuestions);
  const qaMap = new Map((existingQa || []).map(q => [String(q.question), String(q.id)]));

  const qaRows = qaItems.map(q => ({
    id: qaMap.get(q.question),
    question: q.question,
    answer: q.answer,
    category: q.category,
    answered_by: q.answered_by,
    expert_verified: q.expert_verified,
    tags: q.tags,
  }));

  const { error: qaError } = await supabase
    .from("education_qa")
    .upsert(qaRows, { onConflict: "id" });
  if (qaError) console.error("Error seeding education QA:", qaError.message);

  const expertTitles = expertContent.map(c => c.title);
  const { data: existingExpertContent } = await supabase
    .from("education_expert_content")
    .select("id, title")
    .in("title", expertTitles);
  const expertMap = new Map(
    (existingExpertContent || []).map(c => [String(c.title), String(c.id)]),
  );

  const expertRows = expertContent.map(content => ({
    id: expertMap.get(content.title),
    expert_name: content.expert_name,
    expert_title: content.expert_title,
    expert_credentials: content.expert_credentials,
    expert_bio: content.expert_bio,
    content_type: content.content_type,
    title: content.title,
    description: content.description,
    content_text: content.content_text,
    duration_minutes: content.duration_minutes,
    topics: content.topics,
    tags: content.tags,
    is_premium: content.is_premium,
    published_at: new Date().toISOString(),
  }));

  const { error: expertError } = await supabase
    .from("education_expert_content")
    .upsert(expertRows, { onConflict: "id" });
  if (expertError) console.error("Error seeding education expert content:", expertError.message);

  const researchTitles = researchUpdates.map(r => r.title);
  const { data: existingResearch } = await supabase
    .from("education_research_updates")
    .select("id, title")
    .in("title", researchTitles);
  const researchMap = new Map((existingResearch || []).map(r => [String(r.title), String(r.id)]));

  const researchRows = researchUpdates.map(r => ({
    id: researchMap.get(r.title),
    title: r.title,
    summary: r.summary,
    full_article: r.full_article,
    source_url: r.source_url,
    source_name: r.source_name,
    category: r.category,
    tags: r.tags,
    published_date: r.published_date,
    relevance_score: r.relevance_score,
  }));

  const { error: researchError } = await supabase
    .from("education_research_updates")
    .upsert(researchRows, { onConflict: "id" });
  if (researchError) console.error("Error seeding research updates:", researchError.message);

  console.log(`✅ Seeded ${modules.length} education modules`);
  console.log(`✅ Seeded ${qaItems.length} education Q&A items`);
  console.log(`✅ Seeded ${expertContent.length} education expert content items`);
  console.log(`✅ Seeded ${researchUpdates.length} education research updates`);
}
