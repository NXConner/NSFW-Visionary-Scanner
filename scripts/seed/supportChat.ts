import { supabase } from "./supabase";

const quickResponses = [
  {
    title: "Welcome and next steps",
    content:
      "Thanks for reaching out to MorphoScan Pro Support. Please share what you were trying to do, what you expected, and what happened.",
    category: "greeting",
    is_ai_enabled: true,
  },
  {
    title: "Scanner not capturing",
    content:
      "If the scanner is not capturing, confirm camera permissions, refresh the page, and retry. If the issue persists, restart the device and try again with a stable connection.",
    category: "technical",
    is_ai_enabled: true,
  },
  {
    title: "Upload or sync delay",
    content:
      "If uploads are delayed, check your network and retry from the Sync panel. Large photo sets may take several minutes to process.",
    category: "technical",
    is_ai_enabled: true,
  },
  {
    title: "Invoice request",
    content:
      "For billing receipts or invoices, open Settings > Subscription or share the billing email used for purchase.",
    category: "billing",
    is_ai_enabled: true,
  },
  {
    title: "Subscription change",
    content:
      "To change or cancel a subscription, open Settings > Subscription. If you need help, share the account email and current plan.",
    category: "billing",
    is_ai_enabled: true,
  },
  {
    title: "Account access help",
    content:
      "If you cannot sign in, use the password reset link on the login screen. If the email is not arriving, check spam or confirm the address.",
    category: "account",
    is_ai_enabled: true,
  },
  {
    title: "Invite a team member",
    content:
      "You can invite team members from Settings > Team. Add their email, assign a role, and they will receive a secure invite.",
    category: "account",
    is_ai_enabled: true,
  },
  {
    title: "Generate a progress report",
    content:
      "Open Reports, select the date range, and choose the metrics you want included. Use Export to generate a PDF summary.",
    category: "feature",
    is_ai_enabled: true,
  },
  {
    title: "Measurement questions",
    content:
      "Use the same position and timing for each measurement. If you see unusual pain or sudden changes, pause and consult a clinician.",
    category: "feature",
    is_ai_enabled: true,
  },
  {
    title: "General guidance",
    content:
      "Share the feature you are using, what you expected, and any screenshots. We will guide you to the next best step.",
    category: "general",
    is_ai_enabled: true,
  },
];

export async function seedSupportChatQuickResponses() {
  const titles = quickResponses.map(r => r.title);
  const { data: existing } = await supabase
    .from("support_chat_quick_responses")
    .select("id, title")
    .in("title", titles);

  const existingMap = new Map((existing || []).map(r => [String(r.title), String(r.id)]));

  const rows = quickResponses.map(r => ({
    id: existingMap.get(r.title),
    title: r.title,
    content: r.content,
    category: r.category,
    is_ai_enabled: r.is_ai_enabled,
    is_staff_only: false,
  }));

  const { error } = await supabase
    .from("support_chat_quick_responses")
    .upsert(rows, { onConflict: "id" });

  if (error) {
    console.error("Error seeding support quick responses:", error.message);
    return;
  }

  console.log(`✅ Seeded ${quickResponses.length} support quick responses`);
}
