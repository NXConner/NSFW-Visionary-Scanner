/**
 * AI Intimacy Chat Module
 * NSFW DLC content for AI-powered intimacy coaching
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FeatureGate } from "../components/FeatureGate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Sparkles, History, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  name: string;
  messageCount: number;
  lastMessageAt: Date;
}

interface AIIntimacyChatProps {
  /**
   * Optional override to gate access by a specific DLC package ID.
   * Prefer gating by `featureId` so bundles/subscription unlock correctly.
   */
  dlcPackageId?: string;
}

export function AIIntimacyChat({ dlcPackageId }: AIIntimacyChatProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadSessions = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("nsfw_ai_chat_sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("last_message_at", { ascending: false });

      if (error) throw error;

      setSessions(
        (data || []).map(s => ({
          id: s.id,
          name: s.session_name || "New Chat",
          messageCount: s.message_count || 0,
          lastMessageAt: new Date(s.last_message_at || s.created_at || Date.now()),
        })),
      );

      // Set first session as active if exists
      if (data && data.length > 0 && !activeSessionId) {
        setActiveSessionId(data[0].id);
      }
    } catch (error) {
      // Error silently handled
    } finally {
      setIsLoading(false);
    }
  }, [activeSessionId]);

  const loadMessages = useCallback(async (sessionId: string) => {
    const { data, error } = await supabase
      .from("nsfw_ai_chat_sessions")
      .select("messages")
      .eq("id", sessionId)
      .single();

    if (error) {
      return;
    }

    const messagesData =
      (data?.messages as Array<{ role: string; content: string; timestamp: string }>) || [];
    setMessages(
      messagesData.map((m, i) => ({
        id: `${sessionId}-${i}`,
        role: m.role as "user" | "assistant",
        content: m.content,
        timestamp: new Date(m.timestamp),
      })),
    );
  }, []);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (!activeSessionId) return;
    void loadMessages(activeSessionId);
  }, [activeSessionId, loadMessages]);

  const createNewSession = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("nsfw_ai_chat_sessions")
        .insert({
          user_id: user.id,
          session_name: `Chat ${sessions.length + 1}`,
          chat_type: "intimacy_coaching",
          messages: [],
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      setSessions(prev => [
        {
          id: data.id,
          name: data.session_name || "New Chat",
          messageCount: 0,
          lastMessageAt: new Date(),
        },
        ...prev,
      ]);

      setActiveSessionId(data.id);
      setMessages([]);
      toast.success("New chat session created");
    } catch (error) {
      toast.error("Failed to create session");
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      await supabase.from("nsfw_ai_chat_sessions").update({ is_active: false }).eq("id", sessionId);

      setSessions(prev => prev.filter(s => s.id !== sessionId));

      if (activeSessionId === sessionId) {
        const remaining = sessions.filter(s => s.id !== sessionId);
        setActiveSessionId(remaining[0]?.id || null);
      }

      toast.success("Session deleted");
    } catch (error) {
      toast.error("Failed to delete session");
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || !activeSessionId || isSending) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsSending(true);

    try {
      // Call AI edge function
      const { data, error } = await supabase.functions.invoke("ai-health-chat", {
        body: {
          message: userMessage.content,
          context: "intimacy_coaching",
          sessionId: activeSessionId,
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.response || "I apologize, but I encountered an issue. Please try again.",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Update session in database
      const allMessages = [...messages, userMessage, assistantMessage].map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp.toISOString(),
      }));

      await supabase
        .from("nsfw_ai_chat_sessions")
        .update({
          messages: allMessages,
          message_count: allMessages.length,
          last_message_at: new Date().toISOString(),
        })
        .eq("id", activeSessionId);
    } catch (error) {
      toast.error("Failed to get response");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <FeatureGate
      packageId={dlcPackageId}
      featureId={!dlcPackageId ? "ai_companion" : undefined}
      fallbackTitle="AI Intimacy Coach"
      fallbackDescription="Get personalized intimacy coaching and advice from our AI assistant"
    >
      <div className="flex h-[600px] gap-4">
        {/* Sessions Sidebar */}
        <Card className="w-64 flex-shrink-0">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="w-4 h-4" />
                Sessions
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={createNewSession}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-2">
            <ScrollArea className="h-[500px]">
              {sessions.map(session => (
                <div
                  key={session.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors mb-2 ${
                    activeSessionId === session.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => setActiveSessionId(session.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setActiveSessionId(session.id);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{session.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={e => {
                        e.stopPropagation();
                        deleteSession(session.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="text-xs opacity-70">{session.messageCount} messages</div>
                </div>
              ))}

              {sessions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No sessions yet</p>
                  <Button variant="link" size="sm" onClick={createNewSession}>
                    Start a new chat
                  </Button>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="flex-1 flex flex-col">
          <CardHeader className="pb-2 border-b">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">AI Intimacy Coach</CardTitle>
                <p className="text-xs text-muted-foreground">Private, judgment-free advice</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1 p-4">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <Bot className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">Start a Conversation</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Ask me anything about intimacy, relationships, techniques, or wellness. All
                    conversations are private and confidential.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center mt-4">
                    {["Communication tips", "Intimacy advice", "Wellness guidance"].map(topic => (
                      <Badge
                        key={topic}
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                        onClick={() => setInputValue(`Tell me about ${topic.toLowerCase()}`)}
                      >
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-gradient-to-br from-pink-500 to-purple-600 text-white"
                        }`}
                      >
                        {message.role === "user" ? (
                          <User className="w-4 h-4" />
                        ) : (
                          <Bot className="w-4 h-4" />
                        )}
                      </div>
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <span className="text-xs opacity-50 mt-1 block">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div ref={scrollRef} />
                </div>
              )}
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isSending || !activeSessionId}
                />
                <Button
                  onClick={sendMessage}
                  disabled={isSending || !inputValue.trim() || !activeSessionId}
                >
                  {isSending ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                AI responses are for informational purposes only. Consult a professional for medical
                advice.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </FeatureGate>
  );
}

export default AIIntimacyChat;
