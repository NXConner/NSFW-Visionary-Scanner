/**
 * AI Health Chatbot
 * Interactive AI-powered assistant backed by Supabase AI sessions
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, Bot, User, Loader2 } from "lucide-react";
import {
  createAIConversationSession,
  getAIConversationMessages,
  getAIConversationSessions,
  sendAIMessage,
  type AIConversationMessage,
} from "@/lib/conversationalAIEnhancement";
import { toast } from "sonner";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
  pending?: boolean;
};

const mapMessages = (rows: AIConversationMessage[]): ChatMessage[] =>
  rows
    .filter(row => (row.content_text ?? "").trim().length > 0)
    .map(row => ({
      id: row.id,
      role: row.sender_type === "user" ? "user" : "assistant",
      content: String(row.content_text ?? ""),
      createdAt: row.created_at,
    }));

export const AIHealthChatbot = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async (id: string) => {
    const rows = await getAIConversationMessages(id);
    setMessages(mapMessages(rows));
  }, []);

  const initSession = useCallback(async () => {
    setLoading(true);
    setInitError(null);
    try {
      const sessions = await getAIConversationSessions();
      const active = sessions[0] ?? (await createAIConversationSession("Field Advisor", "support"));
      if (!active) {
        setInitError("Unable to start AI chat. Please sign in and retry.");
        return;
      }
      setSessionId(active.id);
      await loadMessages(active.id);
    } catch (error) {
      setInitError("Failed to initialize AI chat.");
    } finally {
      setLoading(false);
    }
  }, [loadMessages]);

  useEffect(() => {
    void initSession();
  }, [initSession]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, sending]);

  const handleSend = useCallback(async () => {
    const message = input.trim();
    if (!message || !sessionId || sending) return;
    const tempId = `local-${Date.now()}`;
    setMessages(prev => [
      ...prev,
      {
        id: tempId,
        role: "user",
        content: message,
        createdAt: new Date().toISOString(),
        pending: true,
      },
    ]);
    setInput("");
    setSending(true);
    try {
      const result = await sendAIMessage(sessionId, message, "text");
      if (!result) {
        toast.error("AI assistant could not respond. Please try again.");
      }
      await loadMessages(sessionId);
    } catch {
      toast.error("Failed to send message.");
    } finally {
      setSending(false);
    }
  }, [input, loadMessages, sending, sessionId]);

  return (
    <Card className="h-[520px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          AI Field Advisor
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 pr-4 mb-4">
          {loading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading chat...
            </div>
          ) : initError ? (
            <div className="text-center text-muted-foreground py-6">{initError}</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 space-y-2">
              <Bot className="w-8 h-8 mx-auto opacity-60" />
              <p>Ask about inspections, maintenance, or project planning.</p>
              <p className="text-xs">Your conversation is saved for follow-up recommendations.</p>
            </div>
          ) : (
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
          )}
        </ScrollArea>
        <div className="flex gap-2">
          <Input
            placeholder="Ask about site conditions, repairs, or scheduling..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSend()}
            disabled={loading || !!initError || !sessionId}
          />
          <Button onClick={handleSend} size="icon" disabled={loading || sending || !sessionId}>
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIHealthChatbot;
