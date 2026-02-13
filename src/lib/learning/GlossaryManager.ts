// Glossary Manager with AI Q&A
import { v4 as uuidv4 } from "uuid";
import { invokeAiHealthChat } from "@/lib/edge/aiHealthChat";
import { isLovablePolicyBuild } from "@/lib/featureFlags";

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  category: "anatomy" | "measurement" | "technology" | "medical" | "general";
  aliases?: string[];
  relatedTerms?: string[];
  pronunciation?: string;
  examples?: string[];
  sources?: string[];
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: "usage" | "troubleshooting" | "features" | "privacy" | "general";
  tags: string[];
  helpful: number;
  notHelpful: number;
}

export interface AIQuestion {
  id: string;
  question: string;
  answer: string;
  timestamp: string;
  helpful?: boolean;
}

export interface GlossarySearchResult {
  type: "term" | "faq";
  item: GlossaryTerm | FAQItem;
  relevance: number;
}

const BUILT_IN_TERMS: GlossaryTerm[] = [
  {
    id: "t-1",
    term: "AR Overlay",
    definition:
      "Augmented Reality visual overlay that provides real-time guidance during scanning by showing measurement guides, reference points, and quality indicators.",
    category: "technology",
    aliases: ["augmented reality overlay", "measurement overlay"],
    relatedTerms: ["Reference Point", "Quality Indicator"],
  },
  {
    id: "t-2",
    term: "Reference Point",
    definition:
      "A detected landmark or feature used as an anchor for measurements. Reference points are shown as colored circles on the AR overlay.",
    category: "measurement",
    relatedTerms: ["AR Overlay", "Landmark Detection"],
  },
  {
    id: "t-3",
    term: "Quality Score",
    definition:
      "A numerical value (0-100%) indicating the reliability of a measurement based on factors like lighting, stability, angle, and distance.",
    category: "measurement",
    examples: ["A quality score of 85% indicates good measurement conditions"],
    relatedTerms: ["Confidence Level"],
  },
  {
    id: "t-4",
    term: "Trend Analysis",
    definition:
      "Statistical analysis of measurement data over time to identify patterns, changes, and predict future values using moving averages and regression.",
    category: "medical",
    relatedTerms: ["Health Prediction", "Risk Assessment"],
  },
  {
    id: "t-5",
    term: "Confidence Level",
    definition:
      "The degree of certainty in a measurement or prediction, typically expressed as a percentage. Higher confidence indicates more reliable results.",
    category: "measurement",
    examples: ["A confidence level of 95% means the measurement is highly reliable"],
  },
  {
    id: "t-6",
    term: "Landmark Detection",
    definition:
      "The process of identifying and locating specific anatomical or reference features in an image using computer vision algorithms.",
    category: "technology",
    relatedTerms: ["Reference Point", "Computer Vision"],
  },
  {
    id: "t-7",
    term: "Health Prediction",
    definition:
      "AI-powered forecasting of health metrics based on historical measurement data and trend analysis.",
    category: "medical",
    relatedTerms: ["Trend Analysis", "Risk Assessment"],
  },
  {
    id: "t-8",
    term: "Offline Mode",
    definition:
      "A feature that allows the app to function without an internet connection by storing data locally and syncing when connectivity is restored.",
    category: "technology",
    relatedTerms: ["Sync Queue", "Local Storage"],
  },
];

const BUILT_IN_FAQS: FAQItem[] = [
  {
    id: "f-1",
    question: "How do I get accurate measurements?",
    answer:
      "For accurate measurements: 1) Ensure good lighting, 2) Hold the device steady, 3) Follow the AR positioning guides, 4) Wait for the quality indicator to show 80%+ before capturing.",
    category: "usage",
    tags: ["accuracy", "measurement", "tips"],
    helpful: 45,
    notHelpful: 3,
  },
  {
    id: "f-2",
    question: "Why is my quality score low?",
    answer:
      "Low quality scores are usually caused by: poor lighting (increase ambient light), camera shake (use a stable surface or hold steadier), incorrect angle (follow the positioning prompts), or being too close/far from the subject.",
    category: "troubleshooting",
    tags: ["quality", "troubleshooting", "accuracy"],
    helpful: 32,
    notHelpful: 5,
  },
  {
    id: "f-3",
    question: "Is my data secure?",
    answer:
      "Yes, your data is encrypted and stored securely. All measurements are saved locally on your device by default. If you enable cloud sync, data is encrypted in transit and at rest. You can also enable PIN protection for additional security.",
    category: "privacy",
    tags: ["privacy", "security", "data"],
    helpful: 67,
    notHelpful: 2,
  },
  {
    id: "f-4",
    question: "How does health prediction work?",
    answer:
      "The health prediction feature analyzes your measurement history using machine learning algorithms. It identifies trends, calculates moving averages, and uses regression analysis to forecast future values. Predictions are accompanied by confidence intervals to indicate reliability.",
    category: "features",
    tags: ["prediction", "ai", "health"],
    helpful: 28,
    notHelpful: 4,
  },
  {
    id: "f-5",
    question: "Can I use the app offline?",
    answer:
      "Yes! The app works fully offline. All scans and measurements are saved locally. When you reconnect to the internet, your data will automatically sync if you have cloud sync enabled.",
    category: "features",
    tags: ["offline", "sync", "connectivity"],
    helpful: 41,
    notHelpful: 1,
  },
];

const AI_HISTORY_KEY = "ai_questions_history";
const FEEDBACK_KEY = "glossary_feedback";

export class GlossaryManager {
  private terms: Map<string, GlossaryTerm> = new Map();
  private faqs: Map<string, FAQItem> = new Map();
  private aiHistory: AIQuestion[] = [];
  private feedback: Map<string, { helpful: number; notHelpful: number }> = new Map();

  constructor() {
    BUILT_IN_TERMS.forEach(t => this.terms.set(t.id, t));
    BUILT_IN_FAQS.forEach(f => this.faqs.set(f.id, f));
    this.loadHistory();
    this.loadFeedback();
  }

  private loadHistory(): void {
    try {
      const data = localStorage.getItem(AI_HISTORY_KEY);
      if (data) this.aiHistory = JSON.parse(data);
    } catch (e) {
      console.error("Failed to load AI history:", e);
    }
  }

  private saveHistory(): void {
    try {
      localStorage.setItem(AI_HISTORY_KEY, JSON.stringify(this.aiHistory.slice(-50)));
    } catch (e) {
      console.error("Failed to save AI history:", e);
    }
  }

  private loadFeedback(): void {
    try {
      const data = localStorage.getItem(FEEDBACK_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        Object.entries(parsed).forEach(([id, fb]) => this.feedback.set(id, fb as any));
      }
    } catch (e) {
      console.error("Failed to load feedback:", e);
    }
  }

  private saveFeedback(): void {
    try {
      const obj: Record<string, any> = {};
      this.feedback.forEach((v, k) => (obj[k] = v));
      localStorage.setItem(FEEDBACK_KEY, JSON.stringify(obj));
    } catch (e) {
      console.error("Failed to save feedback:", e);
    }
  }

  // Glossary Terms
  getTerms(): GlossaryTerm[] {
    return Array.from(this.terms.values());
  }

  getTerm(id: string): GlossaryTerm | undefined {
    return this.terms.get(id);
  }

  getTermsByCategory(category: GlossaryTerm["category"]): GlossaryTerm[] {
    return this.getTerms().filter(t => t.category === category);
  }

  searchTerms(query: string): GlossaryTerm[] {
    const q = query.toLowerCase();
    return this.getTerms().filter(
      t =>
        t.term.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q) ||
        t.aliases?.some(a => a.toLowerCase().includes(q)) ||
        t.relatedTerms?.some(r => r.toLowerCase().includes(q)),
    );
  }

  // FAQs
  getFAQs(): FAQItem[] {
    return Array.from(this.faqs.values());
  }

  getFAQ(id: string): FAQItem | undefined {
    return this.faqs.get(id);
  }

  getFAQsByCategory(category: FAQItem["category"]): FAQItem[] {
    return this.getFAQs().filter(f => f.category === category);
  }

  searchFAQs(query: string): FAQItem[] {
    const q = query.toLowerCase();
    return this.getFAQs().filter(
      f =>
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q) ||
        f.tags.some(t => t.toLowerCase().includes(q)),
    );
  }

  // Combined Search
  search(query: string): GlossarySearchResult[] {
    const q = query.toLowerCase();
    const results: GlossarySearchResult[] = [];

    this.getTerms().forEach(term => {
      let relevance = 0;
      if (term.term.toLowerCase() === q) relevance = 100;
      else if (term.term.toLowerCase().includes(q)) relevance = 80;
      else if (term.aliases?.some(a => a.toLowerCase().includes(q))) relevance = 70;
      else if (term.definition.toLowerCase().includes(q)) relevance = 50;

      if (relevance > 0) {
        results.push({ type: "term", item: term, relevance });
      }
    });

    this.getFAQs().forEach(faq => {
      let relevance = 0;
      if (faq.question.toLowerCase().includes(q)) relevance = 75;
      else if (faq.tags.some(t => t.toLowerCase().includes(q))) relevance = 60;
      else if (faq.answer.toLowerCase().includes(q)) relevance = 40;

      if (relevance > 0) {
        results.push({ type: "faq", item: faq, relevance });
      }
    });

    return results.sort((a, b) => b.relevance - a.relevance);
  }

  // AI Q&A (Simulated)
  async askQuestion(question: string): Promise<AIQuestion> {
    const q = String(question || "").trim();

    // 1) Try to answer from existing content
    const searchResults = q ? this.search(q) : [];
    const top = searchResults[0];
    const topRelevance = top?.relevance ?? 0;

    let kbAnswer = "";
    if (top) {
      if (top.type === "term") {
        const term = top.item as GlossaryTerm;
        kbAnswer = `${term.term}: ${term.definition}`;
        if (term.examples?.length) {
          kbAnswer += `\n\nExample: ${term.examples[0]}`;
        }
      } else {
        const faq = top.item as FAQItem;
        kbAnswer = faq.answer;
      }
    }

    // 2) Optional: use real AI (Edge Function) for questions not covered by KB
    // This is best-effort and will gracefully fall back in store/lovable builds.
    let answer = kbAnswer;
    const shouldTryAi = Boolean(q) && (!kbAnswer || topRelevance < 70);
    if (shouldTryAi && !isLovablePolicyBuild()) {
      try {
        const contextLines = searchResults.slice(0, 3).map(r => {
          if (r.type === "term") {
            const t = r.item as GlossaryTerm;
            return `- Term: ${t.term} — ${t.definition}`;
          }
          const f = r.item as FAQItem;
          return `- FAQ: ${f.question} — ${f.answer}`;
        });

        const promptParts = [
          "You are the in-app help assistant for MorphoScan Pro / Visionary Scanner Suite.",
          "Answer the user's question about app features and how to use the app. Keep it concise and actionable.",
          "If the question is medical/health-related, provide general educational information and encourage consulting a healthcare professional when appropriate.",
          contextLines.length ? `Relevant in-app knowledge base:\n${contextLines.join("\n")}` : "",
          `User question: ${q}`,
        ].filter(Boolean);

        const ai = await invokeAiHealthChat({
          messages: [{ role: "user", content: promptParts.join("\n\n") }],
        });
        if (ai.ok && ai.text) {
          answer = ai.text;
        }
      } catch {
        // ignore (fallback to kbAnswer or default message)
      }
    }

    if (!answer) {
      answer =
        "I couldn't find that in the in-app knowledge base. Try rephrasing, or search the glossary/FAQ for related terms. If you still can’t find it, describe what screen you’re on and what you’re trying to do.";
    }

    const aiQuestion: AIQuestion = {
      id: uuidv4(),
      question: q,
      answer,
      timestamp: new Date().toISOString(),
    };

    this.aiHistory.push(aiQuestion);
    this.saveHistory();
    return aiQuestion;
  }

  getAIHistory(): AIQuestion[] {
    return [...this.aiHistory].reverse();
  }

  markAIAnswerHelpful(questionId: string, helpful: boolean): void {
    const question = this.aiHistory.find(q => q.id === questionId);
    if (question) {
      question.helpful = helpful;
      this.saveHistory();
    }
  }

  clearAIHistory(): void {
    this.aiHistory = [];
    this.saveHistory();
  }

  // Feedback
  submitFeedback(itemId: string, helpful: boolean): void {
    const current = this.feedback.get(itemId) || { helpful: 0, notHelpful: 0 };
    if (helpful) current.helpful++;
    else current.notHelpful++;
    this.feedback.set(itemId, current);
    this.saveFeedback();
  }

  getFeedback(itemId: string): { helpful: number; notHelpful: number } {
    return this.feedback.get(itemId) || { helpful: 0, notHelpful: 0 };
  }
}

let instance: GlossaryManager | null = null;
export function getGlossaryManager(): GlossaryManager {
  if (!instance) instance = new GlossaryManager();
  return instance;
}
