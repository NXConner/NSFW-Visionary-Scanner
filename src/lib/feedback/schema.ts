import { z } from "zod";
import { feedbackFrequency, feedbackKinds, feedbackSentiments, feedbackSeverity } from "./types";

export const feedbackDraftSchema = z
  .object({
    kind: z.enum(feedbackKinds),
    title: z.string().trim().min(4, "Title is too short").max(120, "Title is too long"),
    description: z
      .string()
      .trim()
      .min(10, "Description is too short")
      .max(4000, "Description is too long"),
    rating: z.number().int().min(0).max(10).optional(),
    sentiment: z.enum(feedbackSentiments).optional(),
    severity: z.enum(feedbackSeverity).optional(),
    frequency: z.enum(feedbackFrequency).optional(),
    stepsToReproduce: z.string().trim().max(4000).optional(),
    expected: z.string().trim().max(4000).optional(),
    actual: z.string().trim().max(4000).optional(),
    tags: z.array(z.string().trim().min(1).max(36)).max(12).optional(),
    allowContact: z.boolean().optional(),
    contactEmail: z.string().trim().email().optional(),
    includeDiagnostics: z.boolean().optional(),
    includeRecentAudit: z.boolean().optional(),
    attachments: z
      .array(
        z.object({
          name: z.string().trim().min(1).max(260),
          type: z.string().trim().max(100).optional(),
          size: z
            .number()
            .int()
            .min(0)
            .max(50 * 1024 * 1024)
            .optional(),
        }),
      )
      .max(5)
      .optional(),
  })
  .superRefine((val, ctx) => {
    const contactProvided = Boolean(val.contactEmail?.trim());
    if (val.allowContact && !contactProvided) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Email is required if you allow contact",
        path: ["contactEmail"],
      });
    }

    const bugLike = val.kind === "bug" || val.kind === "glitch" || val.kind === "error";
    if (bugLike) {
      if (!val.severity) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Severity is required for bug reports",
          path: ["severity"],
        });
      }
      if (!val.frequency) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Frequency is required for bug reports",
          path: ["frequency"],
        });
      }
    }
  });

export type FeedbackDraftInput = z.input<typeof feedbackDraftSchema>;
export type FeedbackDraftParsed = z.output<typeof feedbackDraftSchema>;
