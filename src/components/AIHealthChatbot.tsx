/**
 * AI Health Chatbot
 * Interactive AI-powered assistant backed by the `ai-health-chat` edge function.
 */
import { useCallback, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, Bot, User, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { invokeAiHealthChat, type AiHealthChatMessage } from "@/lib/edge/aiHealthChat";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
  pending?: boolean;
};

const DEFAULT_SUGGESTED_QUESTIONS: string[] = [
  "What do my scan results mean?",
  "Is curvature angle something to worry about?",
  "How often should I track measurements?",
  "What habits support healthy recovery and circulation?",
];

export const AIHealthChatbot = ({ compact = false }: { compact?: boolean }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const aiHistory: AiHealthChatMessage[] = useMemo(
    () =>
      messages
        .map(m => ({
          role: m.role,
          content: m.content,
        }))
        .filter(m => m.content.trim().length > 0),
    [messages],
  );

  const handleSend = useCallback(async () => {
    const message = input.trim();
    if (!message || sending) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: message,
      createdAt: new Date().toISOString(),
    };

    // Clear input immediately for responsive UX (and tests).
    setInput("");
    setSending(true);
    setMessages(prev => [...prev, userMsg]);

    try {
      const nextHistory: AiHealthChatMessage[] = [...aiHistory, { role: "user", content: message }];

      const result = await invokeAiHealthChat({ messages: nextHistory });
      if (!result.ok) {
        toast.error(result.error || "AI request failed");
        return;
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: result.text,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
      // Best-effort scroll to end after response.
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [aiHistory, input, sending]);

  const handleSuggestedQuestion = useCallback((q: string) => {
    setInput(q);
  }, []);

  const canSend = input.trim().length > 0 && !sending;

  return (
    <Card className={cn("h-[520px] flex flex-col", compact && "h-[360px]")}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          AI Health Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 pr-4 mb-4">
          <div className={cn("space-y-4", compact && "space-y-3")}>
            {/* Medical disclaimer */}
            {!compact ? (
              <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm">Medical Disclaimer</div>
                    <div className="text-xs text-muted-foreground">
                      This assistant is for educational purposes only and is not a substitute for
                      professional medical advice, diagnosis, or treatment.
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Empty state */}
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-4 space-y-3">
                <Bot className="w-8 h-8 mx-auto opacity-60" />
                <div className="space-y-1">
                  <div className="font-medium text-foreground">How can I help you today?</div>
                  <div className="text-xs">
                    Ask about scans, symptoms, tracking routines, or interpreting results.
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {DEFAULT_SUGGESTED_QUESTIONS.slice(0, compact ? 2 : 4).map(q => (
                    <Button
                      key={q}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestedQuestion(q)}
                    >
                      {q}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "")}
                  >
                    {msg.role === "assistant" ? (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                    ) : null}

                    <div
                      className={cn(
                        "max-w-[80%] p-3 rounded-lg",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground",
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    </div>

                    {msg.role === "user" ? (
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                    ) : null}
                  </div>
                ))}
                <div ref={endRef} />
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="flex gap-2">
          <Input
            aria-label="Ask about health"
            placeholder="Ask about health..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && canSend && handleSend()}
            disabled={sending}
          />
          <Button
            type="button"
            size="icon"
            aria-label="Send message"
            onClick={handleSend}
            disabled={!canSend}
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIHealthChatbot;
