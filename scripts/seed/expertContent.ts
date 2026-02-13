import { supabase } from "./supabase";
import { ADMIN_EMAIL } from "./config";

type ExpertProfileSeed = {
  key: string;
  expert_name: string;
  expert_title: string;
  bio: string;
  specialties: string[];
  credentials: string[];
  years_experience: number;
  consultation_rate_per_hour: number;
  workshop_rate_per_person: number;
  group_workshop_rate: number;
  currency: string;
  is_verified: boolean;
  is_active: boolean;
  is_featured: boolean;
  availability_schedule: Record<string, { start: string; end: string }>;
};

type ArticleSeed = {
  profileKey: string;
  article_title: string;
  article_content: string;
  excerpt: string;
  category: string;
  tags: string[];
  is_featured?: boolean;
  is_premium?: boolean;
};

type VideoSeed = {
  profileKey: string;
  video_title: string;
  video_description: string;
  category: string;
  tags: string[];
  duration_seconds: number;
  is_featured?: boolean;
  is_premium?: boolean;
  price?: number;
  urlIndex: number;
};

const profileTemplates: ExpertProfileSeed[] = [
  {
    key: "clinical-advisor",
    expert_name: "Clinical Advisory Team",
    expert_title: "Men's Sexual Health Advisor",
    bio: "Provides evidence-informed guidance on sexual wellness, safe practices, and progress tracking.",
    specialties: ["PE safety", "Erection health", "Progress tracking"],
    credentials: ["Clinical advisory panel"],
    years_experience: 10,
    consultation_rate_per_hour: 130,
    workshop_rate_per_person: 40,
    group_workshop_rate: 225,
    currency: "USD",
    is_verified: true,
    is_active: true,
    is_featured: true,
    availability_schedule: {
      monday: { start: "09:00", end: "17:00" },
      tuesday: { start: "09:00", end: "17:00" },
      wednesday: { start: "09:00", end: "17:00" },
      thursday: { start: "09:00", end: "17:00" },
      friday: { start: "09:00", end: "15:00" },
    },
  },
  {
    key: "pelvic-floor-specialist",
    expert_name: "Pelvic Floor Specialist",
    expert_title: "Pelvic Health Educator",
    bio: "Focuses on pelvic floor coordination, safe training habits, and comfort-focused routines.",
    specialties: ["Pelvic floor", "Breathing coordination", "Recovery"],
    credentials: ["Pelvic health training"],
    years_experience: 8,
    consultation_rate_per_hour: 115,
    workshop_rate_per_person: 35,
    group_workshop_rate: 180,
    currency: "USD",
    is_verified: true,
    is_active: true,
    is_featured: false,
    availability_schedule: {
      monday: { start: "10:00", end: "17:00" },
      tuesday: { start: "10:00", end: "17:00" },
      wednesday: { start: "10:00", end: "17:00" },
      thursday: { start: "10:00", end: "17:00" },
      friday: { start: "10:00", end: "14:00" },
    },
  },
  {
    key: "wellness-educator",
    expert_name: "Sexual Wellness Educator",
    expert_title: "Communication & Wellness Coach",
    bio: "Supports healthy communication, realistic expectations, and confidence-centered wellness goals.",
    specialties: ["Communication", "Confidence", "Lifestyle support"],
    credentials: ["Wellness education"],
    years_experience: 6,
    consultation_rate_per_hour: 90,
    workshop_rate_per_person: 30,
    group_workshop_rate: 150,
    currency: "USD",
    is_verified: true,
    is_active: true,
    is_featured: false,
    availability_schedule: {
      monday: { start: "11:00", end: "18:00" },
      tuesday: { start: "11:00", end: "18:00" },
      wednesday: { start: "11:00", end: "18:00" },
      thursday: { start: "11:00", end: "18:00" },
      friday: { start: "11:00", end: "15:30" },
    },
  },
];

const articleSeeds: ArticleSeed[] = [
  {
    profileKey: "clinical-advisor",
    article_title: "Safe pacing for PE routines",
    article_content:
      "Start with low intensity, track recovery signals, and avoid training through pain. Consistency and recovery are more important than pushing intensity. If you notice new pain or curvature, pause and seek professional guidance.",
    excerpt: "A safety-first approach to pacing, recovery, and long-term progress.",
    category: "safety",
    tags: ["pe", "safety", "recovery"],
    is_featured: true,
  },
  {
    profileKey: "pelvic-floor-specialist",
    article_title: "Pelvic floor training for beginners",
    article_content:
      "Begin with gentle contractions coordinated with breathing. Focus on full relaxation between reps and avoid straining. Track comfort and reduce frequency if you feel tension or pain.",
    excerpt: "Simple steps to build pelvic floor control without overtraining.",
    category: "wellness",
    tags: ["pelvic floor", "breathing"],
  },
  {
    profileKey: "wellness-educator",
    article_title: "Communication and confidence in sexual wellness",
    article_content:
      "Open communication and clear boundaries support confidence. Focus on comfort, consent, and realistic expectations rather than comparison. Use journaling to identify stress patterns and build healthier routines.",
    excerpt: "How communication and mindset support sustainable wellness goals.",
    category: "relationships",
    tags: ["communication", "confidence"],
  },
];

const videoSeeds: VideoSeed[] = [
  {
    profileKey: "pelvic-floor-specialist",
    video_title: "Pelvic floor breathing basics",
    video_description: "Guided breathing to coordinate pelvic floor relaxation and lift.",
    category: "wellness",
    tags: ["pelvic floor", "breathing"],
    duration_seconds: 420,
    is_featured: true,
    urlIndex: 0,
  },
  {
    profileKey: "clinical-advisor",
    video_title: "Measurement consistency walkthrough",
    video_description: "How to capture consistent measurements and notes safely.",
    category: "tracking",
    tags: ["measurements", "tracking"],
    duration_seconds: 480,
    urlIndex: 1,
  },
];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function getUserIdByEmail(email: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.auth.admin.getUserByEmail(email);
    if (error || !data?.user) return null;
    return data.user.id;
  } catch {
    return null;
  }
}

export async function seedExpertContent() {
  const adminUserId = await getUserIdByEmail(ADMIN_EMAIL);
  if (!adminUserId) {
    console.error("Missing admin user for expert profiles. Create the user first.");
    return;
  }

  const extraUserIds = (process.env.EXPERT_PROFILE_USER_IDS || "")
    .split(",")
    .map(v => v.trim())
    .filter(Boolean);
  const userIds = [adminUserId, ...extraUserIds].filter(
    (value, index, self) => self.indexOf(value) === index,
  );

  const profilesToSeed = profileTemplates.slice(0, userIds.length).map((profile, index) => ({
    user_id: userIds[index],
    ...profile,
  }));

  const existingProfiles = await supabase
    .from("expert_profiles")
    .select("id, user_id")
    .in("user_id", userIds);
  const profileMap = new Map(
    (existingProfiles.data || []).map(p => [String(p.user_id), String(p.id)]),
  );

  const profileRows = profilesToSeed.map(profile => ({
    id: profileMap.get(profile.user_id),
    user_id: profile.user_id,
    expert_name: profile.expert_name,
    expert_title: profile.expert_title,
    bio: profile.bio,
    specialties: profile.specialties,
    credentials: profile.credentials,
    years_experience: profile.years_experience,
    consultation_rate_per_hour: profile.consultation_rate_per_hour,
    workshop_rate_per_person: profile.workshop_rate_per_person,
    group_workshop_rate: profile.group_workshop_rate,
    currency: profile.currency,
    is_verified: profile.is_verified,
    is_active: profile.is_active,
    is_featured: profile.is_featured,
    availability_schedule: profile.availability_schedule,
    timezone: "America/New_York",
  }));

  const { data: upsertedProfiles, error: profileError } = await supabase
    .from("expert_profiles")
    .upsert(profileRows, { onConflict: "id" })
    .select("id, user_id, expert_name");

  if (profileError || !upsertedProfiles) {
    console.error("Error seeding expert profiles:", profileError?.message);
    return;
  }

  const expertIdByKey = new Map<string, string>();
  profilesToSeed.forEach(profile => {
    const match = upsertedProfiles.find(p => p.user_id === profile.user_id);
    if (match?.id) expertIdByKey.set(profile.key, match.id);
  });

  const existingArticles = await supabase
    .from("expert_articles")
    .select("id, article_title")
    .in(
      "article_title",
      articleSeeds.map(a => a.article_title),
    );
  const articleMap = new Map(
    (existingArticles.data || []).map(a => [String(a.article_title), String(a.id)]),
  );

  const articleRows = articleSeeds
    .map(article => {
      const expertId = expertIdByKey.get(article.profileKey);
      if (!expertId) return null;
      return {
        id: articleMap.get(article.article_title),
        expert_id: expertId,
        article_title: article.article_title,
        article_slug: slugify(article.article_title),
        article_content: article.article_content,
        excerpt: article.excerpt,
        category: article.category,
        tags: article.tags,
        is_published: true,
        is_featured: Boolean(article.is_featured),
        is_premium: Boolean(article.is_premium),
        published_at: new Date().toISOString(),
      };
    })
    .filter(Boolean);

  const { error: articleError } = await supabase
    .from("expert_articles")
    .upsert(articleRows, { onConflict: "id" });
  if (articleError) console.error("Error seeding expert articles:", articleError.message);

  const videoUrls = (process.env.EXPERT_VIDEO_URLS || "")
    .split(",")
    .map(v => v.trim())
    .filter(Boolean);

  const existingVideos = await supabase
    .from("expert_videos")
    .select("id, video_title")
    .in(
      "video_title",
      videoSeeds.map(v => v.video_title),
    );
  const videoMap = new Map(
    (existingVideos.data || []).map(v => [String(v.video_title), String(v.id)]),
  );

  const videoRows = videoSeeds
    .map(video => {
      const expertId = expertIdByKey.get(video.profileKey);
      const videoUrl = videoUrls[video.urlIndex];
      if (!expertId || !videoUrl) return null;
      return {
        id: videoMap.get(video.video_title),
        expert_id: expertId,
        video_title: video.video_title,
        video_description: video.video_description,
        video_url: videoUrl,
        category: video.category,
        tags: video.tags,
        duration_seconds: video.duration_seconds,
        is_published: true,
        is_featured: Boolean(video.is_featured),
        is_premium: Boolean(video.is_premium),
        price: video.price ?? null,
        currency: "USD",
        published_at: new Date().toISOString(),
      };
    })
    .filter(Boolean);

  if (videoRows.length > 0) {
    const { error: videoError } = await supabase
      .from("expert_videos")
      .upsert(videoRows, { onConflict: "id" });
    if (videoError) console.error("Error seeding expert videos:", videoError.message);
  } else {
    console.warn("No expert videos seeded. Set EXPERT_VIDEO_URLS to enable video seeds.");
  }

  const qaRows = [
    {
      expert_id: expertIdByKey.get("clinical-advisor"),
      user_id: adminUserId,
      question_text: "How do I know if a session was too intense?",
      question_category: "safety",
      answer_text:
        "Signs include sharp pain, bruising, numbness, or a drop in EQ. If these appear, pause training and allow recovery.",
      answered_at: new Date().toISOString(),
      is_answered: true,
      is_public: true,
    },
    {
      expert_id: expertIdByKey.get("pelvic-floor-specialist"),
      user_id: adminUserId,
      question_text: "How often should I do pelvic floor training?",
      question_category: "wellness",
      answer_text:
        "Most beginners do well with 2-3 short sessions per week. Focus on quality and relaxation between reps.",
      answered_at: new Date().toISOString(),
      is_answered: true,
      is_public: true,
    },
    {
      expert_id: expertIdByKey.get("wellness-educator"),
      user_id: adminUserId,
      question_text: "How can I reduce anxiety about progress?",
      question_category: "mindset",
      answer_text:
        "Track monthly, focus on health markers, and avoid daily comparisons. Consistency matters more than short-term changes.",
      answered_at: new Date().toISOString(),
      is_answered: true,
      is_public: true,
    },
  ].filter(q => q.expert_id);

  if (qaRows.length > 0) {
    const { data: existingQa } = await supabase
      .from("expert_qa")
      .select("id, question_text")
      .in(
        "question_text",
        qaRows.map(q => q.question_text),
      );
    const qaMap = new Map((existingQa || []).map(q => [String(q.question_text), String(q.id)]));
    const qaUpserts = qaRows.map(q => ({
      id: qaMap.get(q.question_text),
      ...q,
    }));
    const { error: qaError } = await supabase
      .from("expert_qa")
      .upsert(qaUpserts, { onConflict: "id" });
    if (qaError) console.error("Error seeding expert Q&A:", qaError.message);
  }

  const questionRows = [
    {
      expert_id: expertIdByKey.get("clinical-advisor"),
      user_id: adminUserId,
      question: "What should I do if curvature increases quickly?",
      category: "conditions",
      status: "answered",
      answer:
        "Pause any intense routines, document changes, and consult a clinician. Rapid changes should be evaluated professionally.",
      answered_at: new Date().toISOString(),
    },
  ].filter(q => q.expert_id);

  if (questionRows.length > 0) {
    const { data: existingQuestions } = await supabase
      .from("expert_questions")
      .select("id, question")
      .in(
        "question",
        questionRows.map(q => q.question),
      );
    const questionMap = new Map(
      (existingQuestions || []).map(q => [String(q.question), String(q.id)]),
    );
    const questionUpserts = questionRows.map(q => ({
      id: questionMap.get(q.question),
      ...q,
    }));
    const { error: questionError } = await supabase
      .from("expert_questions")
      .upsert(questionUpserts, { onConflict: "id" });
    if (questionError) console.error("Error seeding expert questions:", questionError.message);
  }

  console.log(`✅ Seeded ${profilesToSeed.length} expert profiles`);
  console.log(`✅ Seeded ${articleRows.length} expert articles`);
  console.log(`✅ Seeded ${videoRows.length} expert videos`);
  console.log(`✅ Seeded ${qaRows.length} expert Q&A items`);
  console.log(`✅ Seeded ${questionRows.length} expert questions`);
}
