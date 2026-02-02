import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Copy, MailPlus, Send } from "lucide-react";

type DirectMessageRow = {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  read_at?: string | null;
};

type ConversationSummary = {
  otherUserId: string;
  lastMessage: string;
  lastAt: string;
  unreadCount: number;
};

function asRow(v: unknown): DirectMessageRow | null {
  const m = v as any;
  if (!m) return null;
  if (!m.id || !m.sender_id || !m.recipient_id) return null;
  return {
    id: String(m.id),
    sender_id: String(m.sender_id),
    recipient_id: String(m.recipient_id),
    content: String(m.content ?? ""),
    is_read: Boolean(m.is_read),
    created_at: String(m.created_at ?? new Date().toISOString()),
    read_at: m.read_at ? String(m.read_at) : null,
  };
}

export function DirectMessagesTab(props: {
  userId: string;
  loading: boolean;
  directMessages: unknown[];
  selectedConversation: string | null;
  setSelectedConversation: (v: string | null) => void;
  directThread: unknown[];
  directDraft: string;
  setDirectDraft: (v: string) => void;
  newDirectRecipientId: string;
  setNewDirectRecipientId: (v: string) => void;
  showNewDirectMessage: boolean;
  setShowNewDirectMessage: (v: boolean) => void;
  onOpenNew: () => void;
  onStartConversation: () => Promise<void>;
  onSend: () => Promise<void>;
  loadDirectThread: (otherUserId: string) => Promise<void>;
}) {
  const {
    userId,
    loading,
    directMessages,
    selectedConversation,
    setSelectedConversation,
    directThread,
    directDraft,
    setDirectDraft,
    newDirectRecipientId,
    setNewDirectRecipientId,
    showNewDirectMessage,
    setShowNewDirectMessage,
    onOpenNew,
    onStartConversation,
    onSend,
    loadDirectThread,
  } = props;

  const conversationSummaries = useMemo((): ConversationSummary[] => {
    const rows = directMessages.map(asRow).filter(Boolean) as DirectMessageRow[];
    const map = new Map<string, ConversationSummary>();

    for (const r of rows) {
      const other = r.sender_id === userId ? r.recipient_id : r.sender_id;
      const existing = map.get(other);
      const unread = r.recipient_id === userId && !r.is_read ? 1 : 0;
      if (!existing) {
        map.set(other, {
          otherUserId: other,
          lastMessage: r.content,
          lastAt: r.created_at,
          unreadCount: unread,
        });
      } else {
        // rows are newest-first from query, so first seen is the latest.
        existing.unreadCount += unread;
      }
    }

    return Array.from(map.values()).sort((a, b) => (a.lastAt < b.lastAt ? 1 : -1));
  }, [directMessages, userId]);

  const threadRows = useMemo(
    () => directThread.map(asRow).filter(Boolean) as DirectMessageRow[],
    [directThread],
  );

  const copyMyCode = async () => {
    try {
      await navigator.clipboard.writeText(userId);
      toast.success("Copied your contact code");
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-1">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Direct Messages</CardTitle>
            <Button size="sm" onClick={onOpenNew}>
              <MailPlus className="w-4 h-4 mr-2" />
              New
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded border p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-sm font-medium">My contact code</div>
                <div className="text-xs text-muted-foreground">
                  Share this to receive direct messages
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => void copyMyCode()}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <div className="mt-2 font-mono text-xs break-all text-muted-foreground">{userId}</div>
          </div>

          {conversationSummaries.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              No conversations yet
            </div>
          ) : (
            <div className="space-y-2">
              {conversationSummaries.map(c => (
                <button
                  key={c.otherUserId}
                  type="button"
                  className={`w-full text-left rounded border p-3 hover:bg-muted/40 transition ${
                    selectedConversation === c.otherUserId
                      ? "border-primary/60 bg-muted/30"
                      : "border-border"
                  }`}
                  onClick={() => {
                    setSelectedConversation(c.otherUserId);
                    void loadDirectThread(c.otherUserId);
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{c.otherUserId}</div>
                      <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {c.lastMessage}
                      </div>
                    </div>
                    {c.unreadCount > 0 && (
                      <Badge variant="secondary" className="shrink-0">
                        {c.unreadCount}
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>{selectedConversation ? "Conversation" : "Select a conversation"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!selectedConversation ? (
            <div className="text-sm text-muted-foreground text-center py-10">
              Pick a conversation on the left, or start a new one.
            </div>
          ) : (
            <>
              <div className="max-h-[50vh] overflow-auto rounded border p-3 space-y-2">
                {threadRows.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-6">
                    No messages yet
                  </div>
                ) : (
                  threadRows.map(m => {
                    const mine = m.sender_id === userId;
                    return (
                      <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                            mine ? "bg-primary text-primary-foreground" : "bg-muted"
                          }`}
                        >
                          <div className="whitespace-pre-wrap break-words">{m.content}</div>
                          <div
                            className={`mt-1 text-[10px] opacity-70 ${mine ? "text-primary-foreground" : "text-muted-foreground"}`}
                          >
                            {new Date(m.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="flex gap-2">
                <Input
                  value={directDraft}
                  onChange={e => setDirectDraft(e.target.value)}
                  placeholder="Type a message..."
                  disabled={loading}
                />
                <Button onClick={() => void onSend()} disabled={loading || !directDraft.trim()}>
                  <Send className="w-4 h-4 mr-2" />
                  Send
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={showNewDirectMessage} onOpenChange={setShowNewDirectMessage}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New message</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Enter the recipient’s contact code (their user id).
            </div>
            <Input
              value={newDirectRecipientId}
              onChange={e => setNewDirectRecipientId(e.target.value)}
              placeholder="Recipient contact code"
            />

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowNewDirectMessage(false)}
              >
                Cancel
              </Button>
              <Button className="flex-1" onClick={() => void onStartConversation()}>
                Start
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
