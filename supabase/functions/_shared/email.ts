export function sanitizeNotificationText(input: unknown): string {
  const s = typeof input === "string" ? input : input == null ? "" : String(input);
  return s
    .replace(/\b(nsfw|explicit|porn|sexual|sex|adult(-only)?|18\+)\b/gi, "private")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export async function sendResendEmail(params: {
  to: string;
  subject: string;
  html: string;
  from: string;
  apiKey: string;
}) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: params.from,
      to: [params.to],
      subject: params.subject,
      html: params.html,
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Resend error ${res.status}: ${txt}`);
  }

  const json = await res.json();
  return { id: String(json?.id ?? "") };
}

export function resolveEmailFromEnv(): string {
  return Deno.env.get("EMAIL_FROM") ?? "Visionary Scanner Suite <n8ter8@gmail.com>";
}
