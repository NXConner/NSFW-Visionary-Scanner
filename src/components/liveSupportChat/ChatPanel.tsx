import { AlertCircle, Bot, Headphones, MessageSquare, Send, User, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

import type { QuickResponse, SupportChatMessage, SupportChatSession } from "@/lib/liveSupportChat";
import { StatusBadge } from "./statusBadge";

export function ChatPanel(props: {
  session: SupportChatSession;
  messages: SupportChatMessage[];
  quickResponses: QuickResponse[];
  loading: boolean;
  newMessage: string;
  setNewMessage: (v: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onEscalate: () => void;
  onClose: () => void;
  onSend: () => void;
  onStartNew: () => void;
}) {
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Support Chat
              </CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <StatusBadge status={props.session.status} />
                {props.session.is_premium_user && <Badge variant="outline">Premium Priority</Badge>}
                {props.session.escalated_to_human && <Badge variant="default">Human Support</Badge>}
              </div>
            </div>
            <div className="flex gap-2">
              {props.session.status === "active" && !props.session.escalated_to_human && (
                <Button size="sm" variant="outline" onClick={props.onEscalate}>
                  <Headphones className="w-4 h-4 mr-2" />
                  Escalate
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={props.onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-4 max-h-96 overflow-y-auto p-4 bg-muted rounded-lg">
            {props.messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Start the conversation! I&apos;m here to help.</p>
              </div>
            ) : (
              props.messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_type === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] flex gap-2 ${message.sender_type === "user" ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.sender_type === "user"
                          ? "bg-primary text-primary-foreground"
                          : message.sender_type === "ai"
                            ? "bg-blue-500 text-white"
                            : "bg-green-500 text-white"
                      }`}
                    >
                      {message.sender_type === "user" ? (
                        <User className="w-4 h-4" />
                      ) : message.sender_type === "ai" ? (
                        <Bot className="w-4 h-4" />
                      ) : (
                        <Headphones className="w-4 h-4" />
                      )}
                    </div>
                    <div
                      className={`flex flex-col ${message.sender_type === "user" ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`p-3 rounded-lg ${
                          message.sender_type === "user"
                            ? "bg-primary text-primary-foreground"
                            : message.sender_type === "ai"
                              ? "bg-white border"
                              : "bg-green-100 border border-green-300"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        {message.is_ai_generated && message.ai_confidence != null && (
                          <p className="text-xs opacity-70 mt-1">
                            AI Confidence: {Math.round(message.ai_confidence * 100)}%
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground mt-1">
                        {new Date(message.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={props.messagesEndRef} />
          </div>

          {props.quickResponses.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2">Quick Responses:</p>
              <div className="flex flex-wrap gap-2">
                {props.quickResponses.slice(0, 5).map(response => (
                  <Button
                    key={response.id}
                    size="sm"
                    variant="outline"
                    onClick={() => props.setNewMessage(response.content)}
                  >
                    {response.title}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {props.session.status === "closed" ? (
            <div className="text-center text-muted-foreground py-4">
              <p>This chat has been closed.</p>
              <Button variant="outline" className="mt-2" onClick={props.onStartNew}>
                Start New Chat
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Textarea
                placeholder="Type your message..."
                value={props.newMessage}
                onChange={e => props.setNewMessage(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    props.onSend();
                  }
                }}
                rows={2}
                disabled={props.loading || props.session.status !== "active"}
              />
              <Button
                onClick={props.onSend}
                disabled={
                  props.loading || !props.newMessage.trim() || props.session.status !== "active"
                }
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          )}

          {props.session.escalated_to_human && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <p className="text-sm text-blue-900">
                  Your chat has been escalated to human support. A support agent will respond
                  shortly.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
