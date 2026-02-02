import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import {
  closeSupportChatSession,
  createSupportChatSession,
  escalateToHuman,
  getActiveSupportChatSession,
  getQuickResponses,
  getSupportChatMessages,
  getSupportChatSessions,
  markMessagesAsRead,
  sendSupportChatMessage,
  submitChatFeedback,
  type QuickResponse,
  type SupportChatMessage,
  type SupportChatSession,
} from "@/lib/liveSupportChat";
import { ChatFeedback } from "./ChatFeedback";
import { ChatPanel } from "./ChatPanel";
import { Landing } from "./Landing";

export const LiveSupportChat = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<SupportChatSession | null>(null);
  const [messages, setMessages] = useState<SupportChatMessage[]>([]);
  const [sessions, setSessions] = useState<SupportChatSession[]>([]);
  const [quickResponses, setQuickResponses] = useState<QuickResponse[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackSessionId, setFeedbackSessionId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState({ rating: 0, text: "" });
  const [showSessions, setShowSessions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      void loadActiveSession();
      void loadQuickResponses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!session) return;
    void loadMessages();
    const interval = setInterval(() => {
      void loadMessages();
    }, 2000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadActiveSession = async () => {
    setLoading(true);
    try {
      const activeSession = await getActiveSupportChatSession();
      if (activeSession) setSession(activeSession);
    } catch {
      toast.error("Failed to load chat session");
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!session) return;
    try {
      const sessionMessages = await getSupportChatMessages(session.id);
      setMessages(sessionMessages);
      await markMessagesAsRead(session.id);
    } catch {
      // silent for polling
    }
  };

  const loadQuickResponses = async () => {
    try {
      const responses = await getQuickResponses();
      setQuickResponses(responses);
    } catch {
      // silent
    }
  };

  const loadSessions = async () => {
    setLoading(true);
    try {
      const allSessions = await getSupportChatSessions();
      setSessions(allSessions);
    } catch {
      toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async () => {
    setLoading(true);
    try {
      const newSession = await createSupportChatSession();
      if (newSession) {
        setSession(newSession);
        setShowFeedback(false);
        setFeedbackSessionId(null);
        toast.success("Chat started!");
      }
    } catch {
      toast.error("Failed to start chat");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!session || !newMessage.trim()) return;
    setLoading(true);
    try {
      const success = await sendSupportChatMessage(session.id, newMessage);
      if (success) {
        setNewMessage("");
        setTimeout(() => void loadMessages(), 1000);
      }
    } catch {
      toast.error("Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const handleEscalate = async () => {
    if (!session) return;
    if (!confirm("Are you sure you want to escalate to human support?")) return;
    setLoading(true);
    try {
      const success = await escalateToHuman(session.id, "User requested human support");
      if (success) await loadActiveSession();
    } catch {
      toast.error("Failed to escalate");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseChat = async () => {
    if (!session) return;
    if (!confirm("Are you sure you want to close this chat?")) return;
    setLoading(true);
    try {
      const closingId = session.id;
      const success = await closeSupportChatSession(closingId);
      if (success) {
        setSession(null);
        setMessages([]);
        setFeedbackSessionId(closingId);
        setShowFeedback(true);
      }
    } catch {
      toast.error("Failed to close chat");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackSessionId || feedback.rating === 0) {
      toast.error("Please provide a rating");
      return;
    }
    setLoading(true);
    try {
      const success = await submitChatFeedback(feedbackSessionId, feedback.rating, feedback.text);
      if (success) {
        setShowFeedback(false);
        setFeedback({ rating: 0, text: "" });
        setFeedbackSessionId(null);
      }
    } catch {
      toast.error("Failed to submit feedback");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Please sign in to use support chat</p>
        </CardContent>
      </Card>
    );
  }

  if (showFeedback && feedbackSessionId) {
    return (
      <ChatFeedback
        loading={loading}
        sessionId={feedbackSessionId}
        rating={feedback.rating}
        text={feedback.text}
        onSet={setFeedback}
        onSubmit={handleSubmitFeedback}
        onSkip={() => {
          setShowFeedback(false);
          setFeedback({ rating: 0, text: "" });
          setFeedbackSessionId(null);
        }}
      />
    );
  }

  if (!session) {
    return (
      <Landing
        loading={loading}
        showSessions={showSessions}
        onToggleSessions={() => setShowSessions(v => !v)}
        sessions={sessions}
        onLoadSessions={() => void loadSessions()}
        onPickSession={s => {
          setSession(s);
          setShowSessions(false);
        }}
        onStartChat={handleStartChat}
      />
    );
  }

  return (
    <ChatPanel
      session={session}
      messages={messages}
      quickResponses={quickResponses}
      loading={loading}
      newMessage={newMessage}
      setNewMessage={setNewMessage}
      messagesEndRef={messagesEndRef}
      onEscalate={handleEscalate}
      onClose={handleCloseChat}
      onSend={handleSendMessage}
      onStartNew={handleStartChat}
    />
  );
};

export default LiveSupportChat;
