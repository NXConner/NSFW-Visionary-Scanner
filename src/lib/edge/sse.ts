export type SseDeltaHandler = (delta: string, aggregate: string) => void;

type ExtractDelta = (payload: unknown) => string | null;

function defaultExtractDelta(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;

  // OpenAI-compatible streaming: { choices: [{ delta: { content: "..." } }] }
  const anyPayload = payload as any;
  const choices = Array.isArray(anyPayload.choices) ? anyPayload.choices : null;
  const first = choices?.[0];

  const deltaContent = first?.delta?.content;
  if (typeof deltaContent === "string" && deltaContent.length > 0) return deltaContent;

  const deltaText = first?.delta?.text;
  if (typeof deltaText === "string" && deltaText.length > 0) return deltaText;

  const messageContent = first?.message?.content;
  if (typeof messageContent === "string" && messageContent.length > 0) return messageContent;

  // Some providers return { text: "..." } or { content: "..." } events.
  const text = anyPayload.text;
  if (typeof text === "string" && text.length > 0) return text;
  const content = anyPayload.content;
  if (typeof content === "string" && content.length > 0) return content;

  return null;
}

function extractDataFields(eventBlock: string): string[] {
  const lines = eventBlock.split(/\r?\n/);
  const data: string[] = [];
  for (const line of lines) {
    if (!line.startsWith("data:")) continue;
    // SSE spec: allow "data:<space>..."
    data.push(line.slice(5).replace(/^\s/, ""));
  }
  if (data.length === 0) return [];
  return [data.join("\n")];
}

/**
 * Read an SSE response and aggregate streamed text.
 *
 * Designed for OpenAI-compatible `text/event-stream` payloads, but includes defensive fallbacks.
 */
export async function readTextFromSseResponse(
  response: Response,
  opts?: {
    onDelta?: SseDeltaHandler;
    extractDelta?: ExtractDelta;
    stopOnDone?: boolean;
  },
): Promise<string> {
  const reader = response.body?.getReader?.();
  if (!reader) return "";

  const onDelta = opts?.onDelta;
  const extractDelta = opts?.extractDelta ?? defaultExtractDelta;
  const stopOnDone = opts?.stopOnDone ?? true;

  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let aggregate = "";

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // Process complete SSE events separated by blank lines.
    for (;;) {
      const idx = buffer.indexOf("\n\n");
      if (idx === -1) break;
      const eventBlock = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);

      const dataPayloads = extractDataFields(eventBlock);
      for (const raw of dataPayloads) {
        const trimmed = raw.trim();
        if (!trimmed) continue;
        if (trimmed === "[DONE]") {
          if (stopOnDone) return aggregate;
          continue;
        }

        let payload: unknown = trimmed;
        try {
          payload = JSON.parse(trimmed) as unknown;
        } catch {
          // keep as string
        }

        const delta = extractDelta(payload);
        if (delta) {
          aggregate += delta;
          onDelta?.(delta, aggregate);
        }
      }
    }
  }

  // Flush remaining buffer (best-effort; handles streams that end without trailing "\n\n")
  if (buffer.trim()) {
    const dataPayloads = extractDataFields(buffer);
    for (const raw of dataPayloads) {
      const trimmed = raw.trim();
      if (!trimmed || trimmed === "[DONE]") continue;
      let payload: unknown = trimmed;
      try {
        payload = JSON.parse(trimmed) as unknown;
      } catch {
        // keep as string
      }
      const delta = extractDelta(payload);
      if (delta) {
        aggregate += delta;
        onDelta?.(delta, aggregate);
      }
    }
  }

  return aggregate;
}
