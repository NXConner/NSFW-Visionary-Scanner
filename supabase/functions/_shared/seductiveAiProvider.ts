export type ChatMessage = { role: string; content: string };
export type AiProvider = "lovable-gateway" | "openai" | "anthropic" | "custom";

export type ProviderOptions = {
  messages: ChatMessage[];
  model: string;
  temperature: number;
  maxTokens: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
};

export type ProviderResponse = {
  text: string;
  model: string;
  provider: AiProvider;
  latencyMs: number;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
};

export class AiProviderError extends Error {
  status: number;
  details?: string;
  constructor(message: string, status: number, details?: string) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function normalizeProvider(value: string): AiProvider {
  const normalized = String(value || "lovable-gateway").toLowerCase();
  if (normalized === "openai") return "openai";
  if (normalized === "anthropic") return "anthropic";
  if (normalized === "custom") return "custom";
  return "lovable-gateway";
}

export function defaultModelFor(provider: AiProvider): string {
  if (provider === "openai") return "gpt-4o-mini";
  if (provider === "anthropic") return "claude-3-5-sonnet-latest";
  return "openai/gpt-5-mini";
}

async function handleResponse(response: Response, provider: AiProvider, model: string, start: number) {
  if (!response.ok) {
    const details = await response.text();
    throw new AiProviderError("AI provider error", response.status, details);
  }
  const data = await response.json();
  const text =
    data?.choices?.[0]?.message?.content ||
    data?.content?.[0]?.text ||
    "I apologize, I had trouble processing that.";
  const usage = data?.usage
    ? {
        promptTokens: data.usage.prompt_tokens ?? data.usage.input_tokens,
        completionTokens: data.usage.completion_tokens ?? data.usage.output_tokens,
        totalTokens: data.usage.total_tokens,
      }
    : undefined;
  return {
    text: String(text),
    model,
    provider,
    latencyMs: Date.now() - start,
    usage,
  } as ProviderResponse;
}

function splitSystemMessages(messages: ChatMessage[]): { system: string; rest: ChatMessage[] } {
  const systemParts = messages.filter(m => m.role === "system").map(m => m.content);
  const rest = messages.filter(m => m.role !== "system");
  return { system: systemParts.join("\n\n"), rest };
}

export async function callAiProvider(
  provider: AiProvider,
  options: ProviderOptions,
): Promise<ProviderResponse> {
  const start = Date.now();
  const { messages, model, temperature, maxTokens, topP, frequencyPenalty, presencePenalty } = options;

  if (provider === "openai") {
    const apiKey = Deno.env.get("OPENAI_API_KEY") || "";
    if (!apiKey) throw new AiProviderError("OPENAI_API_KEY not configured", 500);
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        top_p: topP,
        frequency_penalty: frequencyPenalty,
        presence_penalty: presencePenalty,
      }),
    });
    return handleResponse(response, provider, model, start);
  }

  if (provider === "anthropic") {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY") || "";
    if (!apiKey) throw new AiProviderError("ANTHROPIC_API_KEY not configured", 500);
    const { system, rest } = splitSystemMessages(messages);
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        system,
        messages: rest.map(m => ({ role: m.role, content: m.content })),
        temperature,
        max_tokens: maxTokens,
        top_p: topP,
      }),
    });
    return handleResponse(response, provider, model, start);
  }

  if (provider === "custom") {
    const endpoint = Deno.env.get("SEDUCTIVE_AI_ENDPOINT") || Deno.env.get("CUSTOM_AI_ENDPOINT") || "";
    if (!endpoint) throw new AiProviderError("SEDUCTIVE_AI_ENDPOINT not configured", 500);
    const apiKey = Deno.env.get("CUSTOM_AI_API_KEY") || "";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        top_p: topP,
        frequency_penalty: frequencyPenalty,
        presence_penalty: presencePenalty,
      }),
    });
    return handleResponse(response, provider, model, start);
  }

  const apiKey = Deno.env.get("LOVABLE_API_KEY") || "";
  const gateway = Deno.env.get("LOVABLE_AI_GATEWAY") || "https://ai.gateway.lovable.dev/v1/chat/completions";
  if (!apiKey) throw new AiProviderError("LOVABLE_API_KEY not configured", 500);
  const response = await fetch(gateway, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      top_p: topP,
      frequency_penalty: frequencyPenalty,
      presence_penalty: presencePenalty,
    }),
  });
  return handleResponse(response, "lovable-gateway", model, start);
}
