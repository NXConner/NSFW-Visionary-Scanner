import { supabase } from "./supabase";

type CourseSeed = {
  key: string;
  title: string;
  description: string;
  category: string;
  difficulty_level: "beginner" | "intermediate" | "advanced";
  estimated_duration_minutes: number;
  order_index: number;
  is_featured?: boolean;
};

type ModuleSeed = {
  key: string;
  courseKey: string;
  title: string;
  description: string;
  order_index: number;
  estimated_duration_minutes: number;
};

type LessonSeed = {
  key: string;
  moduleKey: string;
  title: string;
  order_index: number;
  estimated_duration_minutes: number;
  content_type: "text";
  content_data: { text: string; checklist?: string[]; deliverables?: string[] };
};

type QuizSeed = {
  courseKey: string;
  lessonKey: string;
  title: string;
  description: string;
  questions: Array<{
    id: string;
    question_text: string;
    question_type: "multiple_choice";
    options: string[];
    correct_answer: string;
    explanation: string;
    points: number;
  }>;
};

const courses: CourseSeed[] = [
  {
    key: "pe-foundations",
    title: "PE Foundations & Safety",
    description:
      "Build a safe, consistent foundation for PE routines with evidence-informed practices and clear stop rules.",
    category: "foundation",
    difficulty_level: "beginner",
    estimated_duration_minutes: 150,
    order_index: 1,
    is_featured: true,
  },
  {
    key: "peyronies-care",
    title: "Peyronie's & Curvature Care",
    description:
      "Understand curvature, monitor changes, and prepare for professional care with confidence.",
    category: "conditions",
    difficulty_level: "intermediate",
    estimated_duration_minutes: 140,
    order_index: 2,
  },
  {
    key: "pelvic-floor-eq",
    title: "Pelvic Floor & EQ Optimization",
    description:
      "Strengthen pelvic floor control and erection quality with safe, progressive training.",
    category: "wellness",
    difficulty_level: "intermediate",
    estimated_duration_minutes: 130,
    order_index: 3,
  },
  {
    key: "measurement-tracking",
    title: "Measurement & Progress Tracking",
    description:
      "Measure consistently, interpret trends, and maintain private, accurate progress records.",
    category: "tracking",
    difficulty_level: "beginner",
    estimated_duration_minutes: 110,
    order_index: 4,
  },
];

const modules: ModuleSeed[] = [
  {
    key: "pe-safety",
    courseKey: "pe-foundations",
    title: "Safety & Risk Awareness",
    description: "Understand contraindications, safe intensity, and when to pause.",
    order_index: 1,
    estimated_duration_minutes: 50,
  },
  {
    key: "pe-routine",
    courseKey: "pe-foundations",
    title: "Routine Building",
    description: "Create a consistent routine with clear goals and recovery windows.",
    order_index: 2,
    estimated_duration_minutes: 50,
  },
  {
    key: "pe-recovery",
    courseKey: "pe-foundations",
    title: "Recovery & Consistency",
    description: "Track response signals and adjust intensity responsibly.",
    order_index: 3,
    estimated_duration_minutes: 50,
  },
  {
    key: "pd-understanding",
    courseKey: "peyronies-care",
    title: "Understanding Peyronie's",
    description: "What curvature means, common symptoms, and progression patterns.",
    order_index: 1,
    estimated_duration_minutes: 45,
  },
  {
    key: "pd-options",
    courseKey: "peyronies-care",
    title: "Non-surgical Options",
    description: "Evidence-informed options and when to seek clinician support.",
    order_index: 2,
    estimated_duration_minutes: 50,
  },
  {
    key: "pd-monitoring",
    courseKey: "peyronies-care",
    title: "Monitoring & Clinician Prep",
    description: "Track changes, document pain, and prepare for appointments.",
    order_index: 3,
    estimated_duration_minutes: 45,
  },
  {
    key: "pf-basics",
    courseKey: "pelvic-floor-eq",
    title: "Pelvic Floor Basics",
    description: "Identify pelvic floor muscles and coordinate with breathing.",
    order_index: 1,
    estimated_duration_minutes: 40,
  },
  {
    key: "pf-training",
    courseKey: "pelvic-floor-eq",
    title: "Training Protocols",
    description: "Progressive routines that build endurance and control.",
    order_index: 2,
    estimated_duration_minutes: 50,
  },
  {
    key: "pf-integration",
    courseKey: "pelvic-floor-eq",
    title: "Integration & Lifestyle",
    description: "Blend pelvic floor work with recovery, sleep, and stress care.",
    order_index: 3,
    estimated_duration_minutes: 40,
  },
  {
    key: "measure-standards",
    courseKey: "measurement-tracking",
    title: "Measurement Standards",
    description: "Consistent positions, timing, and tools for accurate tracking.",
    order_index: 1,
    estimated_duration_minutes: 40,
  },
  {
    key: "measure-analysis",
    courseKey: "measurement-tracking",
    title: "Progress Interpretation",
    description: "Understand normal variance and interpret trends.",
    order_index: 2,
    estimated_duration_minutes: 40,
  },
  {
    key: "measure-data",
    courseKey: "measurement-tracking",
    title: "Data Hygiene & Exports",
    description: "Protect privacy and prepare summaries for clinicians.",
    order_index: 3,
    estimated_duration_minutes: 30,
  },
];

const lessons: LessonSeed[] = [
  {
    key: "pe-contraindications",
    moduleKey: "pe-safety",
    title: "Contraindications and red flags",
    order_index: 1,
    estimated_duration_minutes: 15,
    content_type: "text",
    content_data: {
      text: [
        "Do not train through sharp pain, bruising, or numbness.",
        "If you have diagnosed Peyronie's or sudden curvature changes, seek medical guidance first.",
        "Stop immediately if you notice discoloration, loss of sensation, or swelling.",
      ].join("\n"),
      checklist: ["Review personal medical history", "Log any current pain or curvature changes"],
      deliverables: ["Safety checklist completed"],
    },
  },
  {
    key: "pe-warmup",
    moduleKey: "pe-safety",
    title: "Warm-up and tissue prep",
    order_index: 2,
    estimated_duration_minutes: 15,
    content_type: "text",
    content_data: {
      text: [
        "Warm tissue with a gentle heat source for 5-8 minutes.",
        "Use light massage to increase circulation before any technique.",
        "Hydrate and avoid rushing into higher intensity.",
      ].join("\n"),
      checklist: ["Heat applied", "Light massage completed", "Hydration check"],
    },
  },
  {
    key: "pe-stop-signals",
    moduleKey: "pe-safety",
    title: "Stop rules and recovery cues",
    order_index: 3,
    estimated_duration_minutes: 20,
    content_type: "text",
    content_data: {
      text: [
        "Treat discomfort as a signal to reduce intensity or stop.",
        "Healthy sessions should not cause persistent pain or bruising.",
        "Prioritize long-term safety over short-term intensity.",
      ].join("\n"),
      deliverables: ["Stop rules recorded in notes"],
    },
  },
  {
    key: "pe-goals",
    moduleKey: "pe-routine",
    title: "Goal setting and expectations",
    order_index: 1,
    estimated_duration_minutes: 15,
    content_type: "text",
    content_data: {
      text: [
        "Define realistic goals focused on health, confidence, and function.",
        "Track progress monthly rather than day-to-day.",
        "Avoid comparing to unrealistic standards.",
      ].join("\n"),
      checklist: ["Goal written", "Baseline measurements captured"],
    },
  },
  {
    key: "pe-technique-selection",
    moduleKey: "pe-routine",
    title: "Choosing low-risk techniques",
    order_index: 2,
    estimated_duration_minutes: 20,
    content_type: "text",
    content_data: {
      text: [
        "Start with gentle stretching and avoid high pressure early on.",
        "Build tolerance slowly and track response in your diary.",
        "If unsure, prioritize pelvic floor work and circulation-based routines.",
      ].join("\n"),
    },
  },
  {
    key: "pe-weekly-schedule",
    moduleKey: "pe-routine",
    title: "Weekly scheduling template",
    order_index: 3,
    estimated_duration_minutes: 15,
    content_type: "text",
    content_data: {
      text: [
        "Use 2-4 sessions per week with rest days between.",
        "Avoid stacking multiple intense techniques in one session.",
        "Log time, intensity, and recovery response.",
      ].join("\n"),
      deliverables: ["Weekly schedule saved in app"],
    },
  },
  {
    key: "pe-recovery-windows",
    moduleKey: "pe-recovery",
    title: "Recovery windows and deloads",
    order_index: 1,
    estimated_duration_minutes: 15,
    content_type: "text",
    content_data: {
      text: [
        "Plan at least one deload week every 4-6 weeks.",
        "Recovery is where adaptation happens; do not skip it.",
        "Sleep, hydration, and stress management support recovery.",
      ].join("\n"),
    },
  },
  {
    key: "pe-eq-check",
    moduleKey: "pe-recovery",
    title: "EQ checks and circulation",
    order_index: 2,
    estimated_duration_minutes: 15,
    content_type: "text",
    content_data: {
      text: [
        "Track morning and situational EQ for baseline comparison.",
        "Note any drop in quality and reduce intensity accordingly.",
        "Use gentle massage and rest if circulation feels reduced.",
      ].join("\n"),
    },
  },
  {
    key: "pe-adjustments",
    moduleKey: "pe-recovery",
    title: "Adjusting intensity safely",
    order_index: 3,
    estimated_duration_minutes: 20,
    content_type: "text",
    content_data: {
      text: [
        "Increase duration or intensity only after consistent recovery.",
        "If pain or discoloration appears, pause and reassess.",
        "Seek professional guidance for persistent symptoms.",
      ].join("\n"),
    },
  },
  {
    key: "pd-overview",
    moduleKey: "pd-understanding",
    title: "What Peyronie's disease is",
    order_index: 1,
    estimated_duration_minutes: 15,
    content_type: "text",
    content_data: {
      text: [
        "Peyronie's involves scar tissue that can cause curvature or pain.",
        "Early detection helps track changes and guide care.",
        "Medical advice is recommended if curvature progresses quickly.",
      ].join("\n"),
    },
  },
  {
    key: "pd-symptoms",
    moduleKey: "pd-understanding",
    title: "Common symptoms and warning signs",
    order_index: 2,
    estimated_duration_minutes: 15,
    content_type: "text",
    content_data: {
      text: [
        "Look for curvature changes, palpable plaques, or persistent pain.",
        "Track changes monthly with consistent photos.",
        "Note any functional impact on erections or comfort.",
      ].join("\n"),
    },
  },
  {
    key: "pd-assessment-basics",
    moduleKey: "pd-understanding",
    title: "Baseline assessment",
    order_index: 3,
    estimated_duration_minutes: 15,
    content_type: "text",
    content_data: {
      text: [
        "Measure length, girth, and curvature angle in a consistent state.",
        "Use the same lighting and angle for documentation photos.",
        "Record pain levels and frequency.",
      ].join("\n"),
    },
  },
  {
    key: "pd-medical-options",
    moduleKey: "pd-options",
    title: "Medical treatment overview",
    order_index: 1,
    estimated_duration_minutes: 20,
    content_type: "text",
    content_data: {
      text: [
        "Discuss medical options with a urologist if symptoms persist.",
        "Treatments vary by stage and severity.",
        "Do not attempt aggressive self-treatment during acute pain.",
      ].join("\n"),
    },
  },
  {
    key: "pd-noninvasive",
    moduleKey: "pd-options",
    title: "Non-invasive support strategies",
    order_index: 2,
    estimated_duration_minutes: 15,
    content_type: "text",
    content_data: {
      text: [
        "Gentle stretching and traction may be recommended by clinicians.",
        "Avoid high pressure or painful techniques.",
        "Log response and pause if discomfort increases.",
      ].join("\n"),
    },
  },
  {
    key: "pd-lifestyle",
    moduleKey: "pd-options",
    title: "Lifestyle factors that help",
    order_index: 3,
    estimated_duration_minutes: 15,
    content_type: "text",
    content_data: {
      text: [
        "Prioritize sleep, reduce smoking, and manage stress.",
        "Address cardiovascular health for better tissue recovery.",
        "Maintain open communication with partners.",
      ].join("\n"),
    },
  },
  {
    key: "pd-curvature-tracking",
    moduleKey: "pd-monitoring",
    title: "Curvature tracking workflow",
    order_index: 1,
    estimated_duration_minutes: 15,
    content_type: "text",
    content_data: {
      text: [
        "Use consistent photo angles and measurement tools.",
        "Record curvature angle monthly, not daily.",
        "Note changes in pain or function.",
      ].join("\n"),
    },
  },
  {
    key: "pd-pain-log",
    moduleKey: "pd-monitoring",
    title: "Pain and symptom log",
    order_index: 2,
    estimated_duration_minutes: 15,
    content_type: "text",
    content_data: {
      text: [
        "Track pain intensity, duration, and triggers.",
        "Use the diary to note medication or therapy changes.",
        "Share logs with your clinician if symptoms persist.",
      ].join("\n"),
    },
  },
  {
    key: "pd-clinician-prep",
    moduleKey: "pd-monitoring",
    title: "Preparing for clinician visits",
    order_index: 3,
    estimated_duration_minutes: 15,
    content_type: "text",
    content_data: {
      text: [
        "Bring measurement data, photos, and symptom notes.",
        "List current treatments and questions in advance.",
        "Ask about next steps and realistic timelines.",
      ].join("\n"),
    },
  },
  {
    key: "pf-identify",
    moduleKey: "pf-basics",
    title: "Identify pelvic floor muscles",
    order_index: 1,
    estimated_duration_minutes: 15,
    content_type: "text",
    content_data: {
      text: [
        "Gently contract as if stopping gas, then fully relax.",
        "Avoid clenching glutes or holding your breath.",
        "If unsure, consult a pelvic health professional.",
      ].join("\n"),
    },
  },
  {
    key: "pf-breath-coordination",
    moduleKey: "pf-basics",
    title: "Breathing coordination",
    order_index: 2,
    estimated_duration_minutes: 15,
    content_type: "text",
    content_data: {
      text: [
        "Inhale to relax, exhale to gently lift.",
        "Keep the abdomen relaxed and shoulders down.",
        "Use slow breathing to reduce tension.",
      ].join("\n"),
    },
  },
  {
    key: "pf-mistakes",
    moduleKey: "pf-basics",
    title: "Common mistakes to avoid",
    order_index: 3,
    estimated_duration_minutes: 10,
    content_type: "text",
    content_data: {
      text: [
        "Do not hold breath or strain.",
        "Avoid overtraining; soreness is a sign to rest.",
        "Balance contraction with full relaxation.",
      ].join("\n"),
    },
  },
  {
    key: "pf-beginner-routine",
    moduleKey: "pf-training",
    title: "Beginner routine",
    order_index: 1,
    estimated_duration_minutes: 15,
    content_type: "text",
    content_data: {
      text: [
        "Start with 5 gentle contractions, 5 seconds each.",
        "Rest 5-10 seconds between reps.",
        "Repeat for 2-3 sets, 3 times per week.",
      ].join("\n"),
    },
  },
  {
    key: "pf-progression",
    moduleKey: "pf-training",
    title: "Progressive overload",
    order_index: 2,
    estimated_duration_minutes: 20,
    content_type: "text",
    content_data: {
      text: [
        "Increase hold time gradually before adding more reps.",
        "Add quick pulses after steady holds for control.",
        "Log fatigue and adjust frequency as needed.",
      ].join("\n"),
    },
  },
  {
    key: "pf-integration-pe",
    moduleKey: "pf-training",
    title: "Integrating with PE routines",
    order_index: 3,
    estimated_duration_minutes: 15,
    content_type: "text",
    content_data: {
      text: [
        "Schedule pelvic floor work on lighter PE days.",
        "Avoid heavy pelvic floor work on the same day as intense sessions.",
        "Focus on quality of contraction rather than volume.",
      ].join("\n"),
    },
  },
  {
    key: "pf-sleep-stress",
    moduleKey: "pf-integration",
    title: "Sleep and stress impact",
    order_index: 1,
    estimated_duration_minutes: 15,
    content_type: "text",
    content_data: {
      text: [
        "Sleep quality directly affects recovery and EQ.",
        "Stress can increase pelvic floor tension and reduce comfort.",
        "Use relaxation routines on high-stress days.",
      ].join("\n"),
    },
  },
  {
    key: "pf-mobility",
    moduleKey: "pf-integration",
    title: "Mobility and hip support",
    order_index: 2,
    estimated_duration_minutes: 15,
    content_type: "text",
    content_data: {
      text: [
        "Stretch hips, glutes, and hamstrings to reduce tension.",
        "Avoid aggressive stretching if you feel pain.",
        "Combine mobility with gentle breathing exercises.",
      ].join("\n"),
    },
  },
  {
    key: "pf-when-to-pause",
    moduleKey: "pf-integration",
    title: "When to pause training",
    order_index: 3,
    estimated_duration_minutes: 10,
    content_type: "text",
    content_data: {
      text: [
        "Pause if you feel pelvic pain, spasms, or urinary discomfort.",
        "Rest for several days and reassess.",
        "Seek professional care if symptoms persist.",
      ].join("\n"),
    },
  },
  {
    key: "measure-positions",
    moduleKey: "measure-standards",
    title: "Standard measurement positions",
    order_index: 1,
    estimated_duration_minutes: 15,
    content_type: "text",
    content_data: {
      text: [
        "Measure in the same body position and arousal state each time.",
        "Record length and girth in consistent units.",
        "Avoid measuring when fatigued or after intense sessions.",
      ].join("\n"),
    },
  },
  {
    key: "measure-tools",
    moduleKey: "measure-standards",
    title: "Tools and consistency",
    order_index: 2,
    estimated_duration_minutes: 15,
    content_type: "text",
    content_data: {
      text: [
        "Use a firm ruler for length and a flexible tape for girth.",
        "Confirm zero points and alignment before recording.",
        "Repeat measurements twice for accuracy.",
      ].join("\n"),
    },
  },
  {
    key: "measure-photos",
    moduleKey: "measure-standards",
    title: "Photo documentation basics",
    order_index: 3,
    estimated_duration_minutes: 10,
    content_type: "text",
    content_data: {
      text: [
        "Use consistent lighting and angles.",
        "Store photos securely with privacy settings enabled.",
        "Capture curvature angles if monitoring Peyronie's.",
      ].join("\n"),
    },
  },
  {
    key: "measure-variance",
    moduleKey: "measure-analysis",
    title: "Normal variance and error",
    order_index: 1,
    estimated_duration_minutes: 15,
    content_type: "text",
    content_data: {
      text: [
        "Small variations are normal; focus on trends.",
        "Track at consistent intervals (monthly or bi-monthly).",
        "Avoid frequent measurements that increase anxiety.",
      ].join("\n"),
    },
  },
  {
    key: "measure-trends",
    moduleKey: "measure-analysis",
    title: "Interpreting trends",
    order_index: 2,
    estimated_duration_minutes: 15,
    content_type: "text",
    content_data: {
      text: [
        "Use the progress charts to visualize changes.",
        "Compare with recovery and routine changes.",
        "Adjust routines only after multiple data points.",
      ].join("\n"),
    },
  },
  {
    key: "measure-goals",
    moduleKey: "measure-analysis",
    title: "Milestones and goals",
    order_index: 3,
    estimated_duration_minutes: 10,
    content_type: "text",
    content_data: {
      text: [
        "Set milestones based on health and function goals.",
        "Celebrate consistency rather than single measurements.",
        "Use goals to maintain safe pacing.",
      ].join("\n"),
    },
  },
  {
    key: "measure-privacy",
    moduleKey: "measure-data",
    title: "Data privacy essentials",
    order_index: 1,
    estimated_duration_minutes: 10,
    content_type: "text",
    content_data: {
      text: [
        "Enable app lock and secure backups.",
        "Avoid sharing sensitive data without consent.",
        "Review privacy settings regularly.",
      ].join("\n"),
    },
  },
  {
    key: "measure-export",
    moduleKey: "measure-data",
    title: "Exporting data for clinicians",
    order_index: 2,
    estimated_duration_minutes: 10,
    content_type: "text",
    content_data: {
      text: [
        "Use the export tool to generate a summary report.",
        "Include measurement history, notes, and symptom logs.",
        "Share only with trusted medical professionals.",
      ].join("\n"),
    },
  },
  {
    key: "measure-backup",
    moduleKey: "measure-data",
    title: "Backup and retention planning",
    order_index: 3,
    estimated_duration_minutes: 10,
    content_type: "text",
    content_data: {
      text: [
        "Schedule regular backups for long-term tracking.",
        "Review retention settings if you want automatic cleanup.",
        "Keep a secure copy before device changes.",
      ].join("\n"),
    },
  },
];

const quizzes: QuizSeed[] = [
  {
    courseKey: "pe-foundations",
    lessonKey: "pe-adjustments",
    title: "PE Foundations Quiz",
    description: "Confirm safety, routine design, and recovery fundamentals.",
    questions: [
      {
        id: "q1",
        question_text: "What is the safest response to sharp pain during a session?",
        question_type: "multiple_choice",
        options: [
          "Push through it",
          "Pause and stop the session",
          "Increase intensity",
          "Ignore it",
        ],
        correct_answer: "Pause and stop the session",
        explanation: "Sharp pain is a stop signal and should not be ignored.",
        points: 1,
      },
      {
        id: "q2",
        question_text: "How often should most beginners measure progress?",
        question_type: "multiple_choice",
        options: ["Daily", "Weekly", "Monthly", "Only once"],
        correct_answer: "Monthly",
        explanation: "Monthly checks reduce anxiety and capture meaningful trends.",
        points: 1,
      },
      {
        id: "q3",
        question_text: "Which choice best supports recovery?",
        question_type: "multiple_choice",
        options: [
          "Skipping sleep",
          "Adding more intensity",
          "Rest days and hydration",
          "Ignoring EQ changes",
        ],
        correct_answer: "Rest days and hydration",
        explanation: "Recovery relies on rest and circulation support.",
        points: 1,
      },
      {
        id: "q4",
        question_text: "What is a reasonable weekly routine structure?",
        question_type: "multiple_choice",
        options: [
          "Daily intense sessions",
          "2-4 sessions with rest days",
          "Only once per month",
          "Never rest",
        ],
        correct_answer: "2-4 sessions with rest days",
        explanation: "Rest days prevent overuse and improve safety.",
        points: 1,
      },
      {
        id: "q5",
        question_text: "When should you seek professional guidance?",
        question_type: "multiple_choice",
        options: ["Persistent pain or new curvature", "Feeling fine", "After one session", "Never"],
        correct_answer: "Persistent pain or new curvature",
        explanation: "Medical guidance is important for persistent symptoms.",
        points: 1,
      },
    ],
  },
  {
    courseKey: "peyronies-care",
    lessonKey: "pd-clinician-prep",
    title: "Peyronie's Care Quiz",
    description: "Validate monitoring, symptom tracking, and care preparation.",
    questions: [
      {
        id: "q1",
        question_text: "What is a common sign of Peyronie's disease?",
        question_type: "multiple_choice",
        options: [
          "Sudden height change",
          "Curvature or plaques",
          "Improved flexibility",
          "Hair loss",
        ],
        correct_answer: "Curvature or plaques",
        explanation: "Curvature and plaques are common indicators.",
        points: 1,
      },
      {
        id: "q2",
        question_text: "How often should curvature be tracked?",
        question_type: "multiple_choice",
        options: ["Daily", "Weekly", "Monthly", "Never"],
        correct_answer: "Monthly",
        explanation: "Monthly tracking avoids overchecking and captures trends.",
        points: 1,
      },
      {
        id: "q3",
        question_text: "What should you bring to a clinician appointment?",
        question_type: "multiple_choice",
        options: [
          "Only questions",
          "Photos and symptom notes",
          "No data",
          "Unrelated medical records",
        ],
        correct_answer: "Photos and symptom notes",
        explanation: "Documentation helps clinicians assess progression.",
        points: 1,
      },
      {
        id: "q4",
        question_text: "What should you avoid during acute pain?",
        question_type: "multiple_choice",
        options: ["Aggressive techniques", "Rest", "Monitoring", "Consulting a clinician"],
        correct_answer: "Aggressive techniques",
        explanation: "Aggressive techniques can worsen symptoms.",
        points: 1,
      },
      {
        id: "q5",
        question_text: "Why track pain levels?",
        question_type: "multiple_choice",
        options: [
          "To ignore them",
          "To monitor progression and triggers",
          "To replace medical care",
          "To avoid rest",
        ],
        correct_answer: "To monitor progression and triggers",
        explanation: "Pain logs support informed care decisions.",
        points: 1,
      },
    ],
  },
  {
    courseKey: "pelvic-floor-eq",
    lessonKey: "pf-when-to-pause",
    title: "Pelvic Floor Essentials Quiz",
    description: "Confirm pelvic floor basics and safe training habits.",
    questions: [
      {
        id: "q1",
        question_text: "What cue helps identify pelvic floor muscles?",
        question_type: "multiple_choice",
        options: [
          "Clench glutes tightly",
          "Stop gas briefly then relax",
          "Hold breath and strain",
          "Lift shoulders",
        ],
        correct_answer: "Stop gas briefly then relax",
        explanation: "This cue helps locate pelvic floor muscles safely.",
        points: 1,
      },
      {
        id: "q2",
        question_text: "How should breathing coordinate with contraction?",
        question_type: "multiple_choice",
        options: [
          "Hold breath",
          "Inhale to relax, exhale to lift",
          "Exhale to relax",
          "No breathing needed",
        ],
        correct_answer: "Inhale to relax, exhale to lift",
        explanation: "Breathing supports controlled contractions.",
        points: 1,
      },
      {
        id: "q3",
        question_text: "What is a sign to pause pelvic floor work?",
        question_type: "multiple_choice",
        options: ["Comfort", "Pelvic pain or spasms", "Better sleep", "Improved EQ"],
        correct_answer: "Pelvic pain or spasms",
        explanation: "Pain signals a need to rest or seek guidance.",
        points: 1,
      },
      {
        id: "q4",
        question_text: "How often should beginners train?",
        question_type: "multiple_choice",
        options: ["Daily intense", "2-3 times per week", "Once per month", "Never"],
        correct_answer: "2-3 times per week",
        explanation: "This frequency allows recovery and adaptation.",
        points: 1,
      },
      {
        id: "q5",
        question_text: "Why include mobility work?",
        question_type: "multiple_choice",
        options: [
          "To replace training",
          "To reduce tension and improve control",
          "To increase strain",
          "No benefit",
        ],
        correct_answer: "To reduce tension and improve control",
        explanation: "Mobility supports pelvic floor function.",
        points: 1,
      },
    ],
  },
  {
    courseKey: "measurement-tracking",
    lessonKey: "measure-backup",
    title: "Measurement & Tracking Quiz",
    description: "Verify consistent measurement and data practices.",
    questions: [
      {
        id: "q1",
        question_text: "When should measurements be taken?",
        question_type: "multiple_choice",
        options: [
          "Randomly",
          "Same position and conditions each time",
          "Only after workouts",
          "Only once",
        ],
        correct_answer: "Same position and conditions each time",
        explanation: "Consistency improves accuracy.",
        points: 1,
      },
      {
        id: "q2",
        question_text: "Why avoid daily measurements?",
        question_type: "multiple_choice",
        options: [
          "They are illegal",
          "They increase anxiety and noise",
          "They are faster",
          "They improve accuracy",
        ],
        correct_answer: "They increase anxiety and noise",
        explanation: "Daily checks show normal variance rather than trends.",
        points: 1,
      },
      {
        id: "q3",
        question_text: "What should be included in clinician exports?",
        question_type: "multiple_choice",
        options: ["Only photos", "Measurements, notes, symptom logs", "Nothing", "Social posts"],
        correct_answer: "Measurements, notes, symptom logs",
        explanation: "Clinicians need full context for assessment.",
        points: 1,
      },
      {
        id: "q4",
        question_text: "What improves data privacy?",
        question_type: "multiple_choice",
        options: [
          "Sharing screenshots",
          "App lock and secure backups",
          "Public cloud links",
          "No passwords",
        ],
        correct_answer: "App lock and secure backups",
        explanation: "Security tools protect sensitive data.",
        points: 1,
      },
      {
        id: "q5",
        question_text: "How should trends be interpreted?",
        question_type: "multiple_choice",
        options: [
          "Single data points",
          "Multiple data points over time",
          "Only the largest value",
          "Ignore context",
        ],
        correct_answer: "Multiple data points over time",
        explanation: "Trends require multiple consistent measurements.",
        points: 1,
      },
    ],
  },
];

export async function seedLearningContent() {
  const courseTitles = courses.map(c => c.title);
  const { data: existingCourses } = await supabase
    .from("learning_courses")
    .select("id, title")
    .in("title", courseTitles);
  const existingCourseMap = new Map(
    (existingCourses || []).map(c => [String(c.title), String(c.id)]),
  );

  const courseRows = courses.map(course => ({
    id: existingCourseMap.get(course.title),
    title: course.title,
    description: course.description,
    category: course.category,
    difficulty_level: course.difficulty_level,
    estimated_duration_minutes: course.estimated_duration_minutes,
    order_index: course.order_index,
    is_featured: Boolean(course.is_featured),
    is_published: true,
  }));

  const { data: upsertedCourses, error: courseError } = await supabase
    .from("learning_courses")
    .upsert(courseRows, { onConflict: "id" })
    .select("id, title");

  if (courseError || !upsertedCourses) {
    console.error("Error seeding courses:", courseError?.message);
    return;
  }

  const courseByKey = new Map<string, string>();
  courses.forEach(course => {
    const match = upsertedCourses.find(c => c.title === course.title);
    if (match?.id) courseByKey.set(course.key, match.id);
  });

  const moduleRows = modules.map(module => ({
    course_id: courseByKey.get(module.courseKey),
    title: module.title,
    description: module.description,
    order_index: module.order_index,
    estimated_duration_minutes: module.estimated_duration_minutes,
  }));

  const moduleCourseIds = moduleRows.map(m => m.course_id).filter(Boolean) as string[];
  const { data: existingModules } = await supabase
    .from("learning_modules")
    .select("id, course_id, title")
    .in("course_id", moduleCourseIds);
  const existingModuleMap = new Map(
    (existingModules || []).map(m => [`${m.course_id}:${m.title}`, String(m.id)]),
  );

  const moduleUpserts = modules.map(module => ({
    id: existingModuleMap.get(`${courseByKey.get(module.courseKey)}:${module.title}`),
    course_id: courseByKey.get(module.courseKey),
    title: module.title,
    description: module.description,
    order_index: module.order_index,
    estimated_duration_minutes: module.estimated_duration_minutes,
  }));

  const { data: upsertedModules, error: moduleError } = await supabase
    .from("learning_modules")
    .upsert(moduleUpserts, { onConflict: "id" })
    .select("id, title, course_id");
  if (moduleError || !upsertedModules) {
    console.error("Error seeding modules:", moduleError?.message);
    return;
  }

  const moduleByKey = new Map<string, string>();
  modules.forEach(module => {
    const moduleId = upsertedModules.find(
      m => m.title === module.title && m.course_id === courseByKey.get(module.courseKey),
    )?.id;
    if (moduleId) moduleByKey.set(module.key, moduleId);
  });

  const lessonModuleIds = lessons
    .map(lesson => moduleByKey.get(lesson.moduleKey))
    .filter(Boolean) as string[];
  const { data: existingLessons } = await supabase
    .from("learning_lessons")
    .select("id, module_id, title")
    .in("module_id", lessonModuleIds);
  const existingLessonMap = new Map(
    (existingLessons || []).map(l => [`${l.module_id}:${l.title}`, String(l.id)]),
  );

  const lessonUpserts = lessons.map(lesson => ({
    id: existingLessonMap.get(`${moduleByKey.get(lesson.moduleKey)}:${lesson.title}`),
    module_id: moduleByKey.get(lesson.moduleKey),
    title: lesson.title,
    content_type: lesson.content_type,
    content_data: lesson.content_data,
    order_index: lesson.order_index,
    estimated_duration_minutes: lesson.estimated_duration_minutes,
  }));

  const { data: upsertedLessons, error: lessonError } = await supabase
    .from("learning_lessons")
    .upsert(lessonUpserts, { onConflict: "id" })
    .select("id, title, module_id");
  if (lessonError || !upsertedLessons) {
    console.error("Error seeding lessons:", lessonError?.message);
    return;
  }

  const lessonByKey = new Map<string, string>();
  lessons.forEach(lesson => {
    const lessonId = upsertedLessons.find(
      l => l.title === lesson.title && l.module_id === moduleByKey.get(lesson.moduleKey),
    )?.id;
    if (lessonId) lessonByKey.set(lesson.key, lessonId);
  });

  const quizLessonIds = quizzes
    .map(quiz => lessonByKey.get(quiz.lessonKey))
    .filter(Boolean) as string[];
  const { data: existingQuizzes } = await supabase
    .from("learning_quizzes")
    .select("id, lesson_id, title")
    .in("lesson_id", quizLessonIds);
  const existingQuizMap = new Map(
    (existingQuizzes || []).map(q => [`${q.lesson_id}:${q.title}`, String(q.id)]),
  );

  const quizUpserts = quizzes.map(quiz => ({
    id: existingQuizMap.get(`${lessonByKey.get(quiz.lessonKey)}:${quiz.title}`),
    lesson_id: lessonByKey.get(quiz.lessonKey),
    course_id: courseByKey.get(quiz.courseKey),
    title: quiz.title,
    description: quiz.description,
    quiz_type: "multiple_choice",
    questions: quiz.questions,
    passing_score: 80,
    show_results_immediately: true,
  }));

  const { error: quizError } = await supabase
    .from("learning_quizzes")
    .upsert(quizUpserts, { onConflict: "id" });
  if (quizError) {
    console.error("Error seeding quizzes:", quizError.message);
  }

  for (const course of courses) {
    const courseId = courseByKey.get(course.key);
    if (!courseId) continue;
    const moduleCount = modules.filter(m => m.courseKey === course.key).length;
    const lessonCount = lessons.filter(l => {
      const mod = modules.find(m => m.key === l.moduleKey);
      return mod?.courseKey === course.key;
    }).length;
    await supabase
      .from("learning_courses")
      .update({ module_count: moduleCount, lesson_count: lessonCount })
      .eq("id", courseId);
  }

  console.log(`✅ Seeded ${courses.length} learning courses`);
  console.log(`✅ Seeded ${modules.length} learning modules`);
  console.log(`✅ Seeded ${lessons.length} learning lessons`);
  console.log(`✅ Seeded ${quizzes.length} learning quizzes`);
}
