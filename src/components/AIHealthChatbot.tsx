/**
 * AI Health Chatbot
 * Interactive AI-powered health assistant
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, Bot, User, Square } from "lucide-react";
import { toast } from "sonner";
import { invokeAiHealthChat, type AiHealthChatMessage } from "@/lib/edge/aiHealthChat";
import { logger } from "@/lib/logger";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export const AIHealthChatbot = ({ compact = false }: { compact?: boolean }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your AI health assistant. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  const canSend = useMemo(() => input.trim().length > 0 && !isSending, [input, isSending]);
  const suggestedQuestions = [
    "What are common symptoms I should watch for?",
    "How can I improve my overall health routine?",
    "When should I consult a healthcare professional?",
  ];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const buildEdgeMessages = (history: Message[]): AiHealthChatMessage[] => {
    // Exclude the UI-only welcome message and any empty assistant placeholders.
    const filtered = history
      .filter(m => m.id !== "1")
      .filter(m => m.content.trim().length > 0)
      .map(m => ({ role: m.role, content: m.content })) satisfies AiHealthChatMessage[];

    // Keep a bounded context window.
    const windowed = filtered.slice(-18);
    return windowed;
  };

  const handleCancel = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsSending(false);
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const userMsg: Message = { id: `user-${Date.now()}`, role: "user", content: trimmed };
    const assistantId = `assistant-${Date.now()}`;
    const assistantPlaceholder: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      isStreaming: true,
    };

    const historyForRequest = buildEdgeMessages([...messages, userMsg]);

    setMessages(prev => [...prev, userMsg, assistantPlaceholder]);
    setInput("");
    setIsSending(true);

    const result = await invokeAiHealthChat({
      messages: historyForRequest,
      signal: controller.signal,
      onDelta: (_delta, aggregate) => {
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId ? { ...m, content: aggregate, isStreaming: true } : m,
          ),
        );
      },
    });

    setIsSending(false);
    abortRef.current = null;

    if (result.ok) {
      const finalText = result.text || "I couldn’t generate a response. Please try again.";
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId ? { ...m, content: finalText, isStreaming: false } : m,
        ),
      );
      return;
    }

    // Remove streaming placeholder and show a clear (non-mock) error.
    setMessages(prev => prev.filter(m => m.id !== assistantId));
    if (result.status === 404) {
      toast.message("AI chat isn’t available in this build.");
      setMessages(prev => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content:
            "AI chat is not enabled for this deployment. If you’re running a direct build, enable it by setting Edge Function secrets: CONTENT_POLICY=direct and ENABLE_MEDICAL_AI_CHAT=true.",
        },
      ]);
      return;
    }

    logger.warn("AIHealthChatbot: AI request failed", {
      status: result.status,
      error: result.error,
    });
    toast.error(result.error || "Failed to get AI response");
  };

  return (
    <Card className={`${compact ? "h-[360px]" : "h-[500px]"} flex flex-col`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          AI Health Assistant
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Medical Disclaimer: This assistant provides general information and is not a substitute
          for professional medical advice.
        </p>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 pr-4 mb-4">
          <div className="space-y-4">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.role === "user" ? "justify-end" : ""}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  {msg.role === "assistant" && msg.isStreaming && (
                    <p className="text-[10px] text-muted-foreground mt-2">Streaming…</p>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
            <div ref={endRef} />
          </div>
        </ScrollArea>
        <div className="flex flex-wrap gap-2 mb-3">
          {suggestedQuestions.map(question => (
            <Button
              key={question}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setInput(question)}
              disabled={isSending}
            >
              {question}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Ask about health..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && void handleSend()}
            aria-label="Health question"
            disabled={isSending}
          />
          {isSending ? (
            <Button
              onClick={handleCancel}
              size="icon"
              variant="outline"
              aria-label="Cancel request"
              title="Cancel"
            >
              <Square className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={() => void handleSend()}
              size="icon"
              disabled={!canSend}
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AIHealthChatbot;
