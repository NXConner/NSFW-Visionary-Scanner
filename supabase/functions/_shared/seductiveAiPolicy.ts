export type PolicyMode = "tame" | "explicit";
export type PolicyAction = "allow" | "deescalate" | "block";
export type PolicySeverity = "low" | "medium" | "high" | "critical";

export type PolicyResult = {
  action: PolicyAction;
  category?: string;
  reason?: string;
  severity?: PolicySeverity;
  matched?: string[];
  message?: string;
};

type PolicyRule = {
  id: string;
  category: string;
  severity: PolicySeverity;
  action: PolicyAction;
  terms: string[];
  message: string;
};

const BLOCK_RULES: PolicyRule[] = [
  {
    id: "minor_content",
    category: "minor",
    severity: "critical",
    action: "block",
    terms: [
      "minor",
      "underage",
      "child",
      "kid",
      "preteen",
      "teen",
      "teenager",
      "schoolgirl",
      "schoolboy",
      "barely legal",
      "young girl",
      "young boy",
    ],
    message: "I cannot engage with anything involving minors. Let's keep this adult and consensual.",
  },
  {
    id: "nonconsensual",
    category: "consent",
    severity: "critical",
    action: "block",
    terms: ["rape", "forced", "coerce", "blackmail", "drugged", "without consent", "nonconsensual"],
    message: "I only engage in consensual conversations. Let's focus on consent and boundaries.",
  },
  {
    id: "bestiality",
    category: "illegal",
    severity: "critical",
    action: "block",
    terms: ["bestiality", "animal sex", "sex with animal"],
    message: "I cannot engage with that. Let's keep this adult, consensual, and safe.",
  },
  {
    id: "incest",
    category: "illegal",
    severity: "high",
    action: "block",
    terms: ["incest", "stepdad", "stepmom", "stepsister", "stepbrother"],
    message: "I cannot engage with that. Let's keep this adult, consensual, and safe.",
  },
];

const EXPLICIT_TERMS = [
  "fuck",
  "fucking",
  "pussy",
  "cock",
  "dick",
  "penis",
  "vagina",
  "blowjob",
  "handjob",
  "anal",
  "cum",
  "orgasm",
  "penetration",
];

function normalize(text: string): string {
  return text.toLowerCase();
}

function termMatches(text: string, term: string): boolean {
  if (term.includes(" ")) return text.includes(term);
  return new RegExp(`\\b${term.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, "i").test(text);
}

function findMatchedTerms(text: string, terms: string[]): string[] {
  const matched: string[] = [];
  for (const term of terms) {
    if (termMatches(text, term)) matched.push(term);
  }
  return matched;
}

export function scanForPolicyIssues(text: string, mode: PolicyMode): PolicyResult {
  const normalized = normalize(String(text || ""));
  if (!normalized) return { action: "allow" };

  for (const rule of BLOCK_RULES) {
    const matched = findMatchedTerms(normalized, rule.terms);
    if (matched.length > 0) {
      return {
        action: rule.action,
        category: rule.category,
        reason: rule.id,
        severity: rule.severity,
        matched,
        message: rule.message,
      };
    }
  }

  if (mode === "tame") {
    const matched = findMatchedTerms(normalized, EXPLICIT_TERMS);
    if (matched.length > 0) {
      return {
        action: "deescalate",
        category: "explicit_language",
        reason: "explicit_language_tame_mode",
        severity: "medium",
        matched,
        message: "Let's keep it suggestive and focus on intimacy, consent, and boundaries.",
      };
    }
  }

  return { action: "allow" };
}

export function buildPolicyNote(result: PolicyResult, mode: PolicyMode): string | null {
  if (result.action === "block") {
    return "User attempted disallowed content. Refuse and redirect to consent and boundaries.";
  }
  if (result.action === "deescalate" && mode === "tame") {
    return "Keep content suggestive and avoid explicit language.";
  }
  return null;
}

export function buildPolicyResponse(result: PolicyResult, mode: PolicyMode): string {
  if (result.message) return result.message;
  if (result.action === "deescalate" && mode === "tame") {
    return "Let's keep it suggestive and focus on intimacy, consent, and boundaries.";
  }
  return "I can only engage in adult, consensual, and safe conversations.";
}

export function enforceResponseSafety(text: string, mode: PolicyMode): {
  text: string;
  policy: PolicyResult;
  modified: boolean;
} {
  const policy = scanForPolicyIssues(text, mode);
  if (policy.action === "block") {
    return { text: buildPolicyResponse(policy, mode), policy, modified: true };
  }
  if (policy.action === "deescalate" && mode === "tame") {
    return { text: buildPolicyResponse(policy, mode), policy, modified: true };
  }
  return { text, policy, modified: false };
}
