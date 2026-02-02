import { describe, expect, it } from "vitest";
import { feedbackDraftSchema } from "@/lib/feedback/schema";

describe("feedbackDraftSchema", () => {
  it("accepts a basic feature request", () => {
    const res = feedbackDraftSchema.safeParse({
      kind: "feature_request",
      title: "Add export to PDF for reports",
      description: "I'd like to export my reports to PDF with charts and notes.",
      rating: 9,
      sentiment: "love",
      tags: ["reports", "export"],
      includeDiagnostics: true,
      includeRecentAudit: true,
      allowContact: false,
    });
    expect(res.success).toBe(true);
  });

  it("requires severity/frequency for bugs", () => {
    const res = feedbackDraftSchema.safeParse({
      kind: "bug",
      title: "Crash on opening profile",
      description: "App crashes when I open profile after sign-in.",
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      const paths = res.error.issues.map(i => String(i.path[0]));
      expect(paths).toContain("severity");
      expect(paths).toContain("frequency");
    }
  });

  it("requires email when allowContact is true", () => {
    const res = feedbackDraftSchema.safeParse({
      kind: "general",
      title: "Quick note",
      description: "This is some feedback that is long enough.",
      allowContact: true,
    });
    expect(res.success).toBe(false);
  });
});
