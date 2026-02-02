import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { useAuditLog } from "@/hooks/useAuditLog";
import { triggerHaptic } from "@/lib/haptics";
import { logger } from "@/lib/logger";
import {
  clearLocalFeedbackQueue,
  loadLocalFeedbackQueue,
  removeLocalFeedbackQueueItem,
  submitFeedback,
  type FeedbackDraftInput,
  type FeedbackKind,
} from "@/lib/feedback";
import { splitTags } from "./utils";

export function useFeedbackHub() {
  const { user } = useAuth();
  const offline = useOfflineSync();
  const audit = useAuditLog();

  const [activeKind, setActiveKind] = useState<FeedbackKind>("feature_request");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rating, setRating] = useState(8);
  const [sentiment, setSentiment] = useState<"love" | "like" | "neutral" | "dislike" | "hate">(
    "like",
  );
  const [severity, setSeverity] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [frequency, setFrequency] = useState<"once" | "sometimes" | "often" | "always">(
    "sometimes",
  );
  const [stepsToReproduce, setStepsToReproduce] = useState("");
  const [expected, setExpected] = useState("");
  const [actual, setActual] = useState("");
  const [tagsRaw, setTagsRaw] = useState("");
  const [allowContact, setAllowContact] = useState(false);
  const [contactEmail, setContactEmail] = useState("");
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true);
  const [includeRecentAudit, setIncludeRecentAudit] = useState(true);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const isBugLike = activeKind === "bug" || activeKind === "glitch" || activeKind === "error";

  const [localQueue, setLocalQueue] = useState(() => loadLocalFeedbackQueue());
  useEffect(() => {
    // Refresh local saved feedback whenever auth changes or a submit cycle completes.
    if (submitting) return;
    setLocalQueue(loadLocalFeedbackQueue());
  }, [submitting, user?.id]);
  const offlineStatus = useMemo(() => offline.getQueueStatus(), [offline]);
  const feedbackPending = Number(offlineStatus.byTable?.user_feedback ?? 0);

  useEffect(() => {
    if (user?.email && !contactEmail) setContactEmail(user.email);
  }, [user?.email, contactEmail]);

  useEffect(() => {
    if (rating >= 9) setSentiment("love");
    else if (rating >= 7) setSentiment("like");
    else if (rating >= 5) setSentiment("neutral");
    else if (rating >= 3) setSentiment("dislike");
    else setSentiment("hate");
  }, [rating]);

  const draft: FeedbackDraftInput = useMemo(
    () => ({
      kind: activeKind,
      title,
      description,
      rating,
      sentiment,
      severity: isBugLike ? severity : undefined,
      frequency: isBugLike ? frequency : undefined,
      stepsToReproduce: isBugLike ? stepsToReproduce : undefined,
      expected: isBugLike ? expected : undefined,
      actual: isBugLike ? actual : undefined,
      tags: splitTags(tagsRaw),
      allowContact,
      contactEmail: allowContact ? contactEmail : undefined,
      includeDiagnostics,
      includeRecentAudit,
      attachments: attachments.slice(0, 5).map(f => ({ name: f.name, type: f.type, size: f.size })),
    }),
    [
      activeKind,
      title,
      description,
      rating,
      sentiment,
      isBugLike,
      severity,
      frequency,
      stepsToReproduce,
      expected,
      actual,
      tagsRaw,
      allowContact,
      contactEmail,
      includeDiagnostics,
      includeRecentAudit,
      attachments,
    ],
  );

  const buildExtraMetadata = () => {
    const extra: Record<string, unknown> = {};
    if (includeRecentAudit) {
      extra.audit_snapshot = (audit.logs ?? []).slice(0, 25).map(l => ({
        ts: l.timestamp,
        action: l.action,
        category: l.category,
        details: l.details,
      }));
    }
    return extra;
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setRating(8);
    setTagsRaw("");
    setStepsToReproduce("");
    setExpected("");
    setActual("");
    setAllowContact(false);
    setAttachments([]);
    setFieldErrors({});
  };

  const copyDiagnostics = async () => {
    try {
      const payload = {
        draft,
        online: offline.isOnline,
        offlineQueue: offlineStatus,
        recentAudit: includeRecentAudit ? (audit.logs ?? []).slice(0, 25) : [],
      };
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      toast.success("Copied diagnostics to clipboard");
      triggerHaptic("success");
    } catch {
      toast.error("Failed to copy diagnostics");
    }
  };

  const trySendLocalQueue = async () => {
    if (!user) {
      toast.info("Sign in to send saved feedback");
      return { sent: 0, queued: 0 };
    }
    const items = loadLocalFeedbackQueue();
    if (items.length === 0) {
      toast.info("No saved feedback to send");
      return { sent: 0, queued: 0 };
    }
    setSubmitting(true);
    let sent = 0;
    let queued = 0;
    try {
      for (const item of items) {
        const res = await submitFeedback({
          draft: item.draft,
          userId: user.id,
          queueOperation: offline.queueOperation,
          extraMetadata: buildExtraMetadata(),
        });
        if (res.outcome === "sent" || res.outcome === "queued") {
          removeLocalFeedbackQueueItem(item.id);
          if (res.outcome === "sent") sent++;
          else queued++;
        }
      }
      if (sent || queued) toast.success(`Processed saved feedback: ${sent} sent, ${queued} queued`);
      return { sent, queued };
    } finally {
      setSubmitting(false);
    }
  };

  const clearLocalSaved = () => {
    clearLocalFeedbackQueue();
    toast.success("Cleared local saved feedback");
  };

  const submit = async () => {
    setFieldErrors({});
    setSubmitting(true);
    try {
      const res = await submitFeedback({
        draft,
        userId: user?.id ?? null,
        queueOperation: offline.queueOperation,
        extraMetadata: buildExtraMetadata(),
      });

      if (res.outcome === "invalid") {
        setFieldErrors(res.fieldErrors);
        toast.error("Please fix the highlighted fields");
        return { ok: false as const, outcome: res.outcome };
      }

      if (res.outcome === "sent") {
        toast.success("Feedback sent — thank you!");
        triggerHaptic("success");
        resetForm();
        return { ok: true as const, outcome: res.outcome, id: res.id };
      }

      if (res.outcome === "queued") {
        toast.success("Saved offline — will sync when connected");
        triggerHaptic("selection");
        resetForm();
        return { ok: true as const, outcome: res.outcome, localId: res.localId };
      }

      if (res.outcome === "saved_local") {
        toast.info("Saved locally — sign in and send when ready");
        triggerHaptic("selection");
        resetForm();
        return { ok: true as const, outcome: res.outcome, localId: res.localId };
      }

      toast.error(res.outcome === "error" ? res.message : "Failed to submit feedback");
      return { ok: false as const, outcome: res.outcome };
    } finally {
      setSubmitting(false);
    }
  };

  const requestSync = () => {
    void offline.syncAll();
    toast.info("Sync requested");
  };

  const logRefresh = () => {
    logger.userAction("feedback_refresh", user?.id, {});
  };

  return {
    user,
    audit,
    offline,
    offlineStatus,
    feedbackPending,
    localQueue,

    activeKind,
    setActiveKind,
    title,
    setTitle,
    description,
    setDescription,
    rating,
    setRating,
    sentiment,
    severity,
    setSeverity,
    frequency,
    setFrequency,
    stepsToReproduce,
    setStepsToReproduce,
    expected,
    setExpected,
    actual,
    setActual,
    tagsRaw,
    setTagsRaw,
    allowContact,
    setAllowContact,
    contactEmail,
    setContactEmail,
    includeDiagnostics,
    setIncludeDiagnostics,
    includeRecentAudit,
    setIncludeRecentAudit,
    attachments,
    setAttachments,
    isBugLike,

    draft,
    fieldErrors,
    submitting,

    resetForm,
    submit,
    copyDiagnostics,
    trySendLocalQueue,
    clearLocalSaved,
    requestSync,
    logRefresh,
  };
}
