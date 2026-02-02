import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

import type { SupportChatSession } from "@/lib/liveSupportChat";
import { StatusBadge } from "./statusBadge";

export function Landing(props: {
  loading: boolean;
  showSessions: boolean;
  onToggleSessions: () => void;
  sessions: SupportChatSession[];
  onLoadSessions: () => void;
  onPickSession: (s: SupportChatSession) => void;
  onStartChat: () => void;
}) {
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Live Support Chat</CardTitle>
          <p className="text-muted-foreground">
            Get instant help with AI-powered responses. Escalate to human support anytime.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={props.onStartChat} disabled={props.loading} className="flex-1">
              <MessageSquare className="w-4 h-4 mr-2" />
              Start New Chat
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                props.onToggleSessions();
                if (!props.showSessions) props.onLoadSessions();
              }}
            >
              View History
            </Button>
          </div>

          {props.showSessions && (
            <div className="mt-4 space-y-2">
              <h3 className="font-semibold">Previous Sessions</h3>
              {props.sessions.length === 0 ? (
                <p className="text-muted-foreground text-sm">No previous sessions</p>
              ) : (
                props.sessions.map(s => (
                  <Card key={s.id} className="p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={s.status} />
                          {s.is_premium_user && <Badge variant="outline">Premium</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(s.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          props.onPickSession(s);
                        }}
                      >
                        View
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Features:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>AI-powered instant responses</li>
              <li>24/7 availability</li>
              <li>Escalate to human support anytime</li>
              <li>Priority support for Premium users</li>
              <li>Multi-language support</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
