import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  createSeductiveAISession,
  sendSeductiveAIMessage,
  type SeductiveAISession,
} from "@/lib/nsfwAdvancedFeatures";
import type { AiIntensity, AiMessage, AiPersonality } from "../types";
import { Send } from "lucide-react";

export function AIChatTab({ isActive }: { isActive: boolean }): JSX.Element {
  const [loading, setLoading] = useState(false);
  const [aiSession, setAiSession] = useState<SeductiveAISession | null>(null);
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiPersonality, setAiPersonality] = useState<AiPersonality>("seductive");
  const [aiIntensity, setAiIntensity] = useState<AiIntensity>("medium");

  useEffect(() => {
    if (!isActive) return;
    // no-op for now: session resume can be added once backed by listing APIs
  }, [isActive]);

  const handleStartAIChat = useCallback(async () => {
    setLoading(true);
    try {
      const session = await createSeductiveAISession(aiPersonality, aiIntensity);
      if (session) {
        setAiSession(session);
        setAiMessages([]);
      }
    } catch {
      toast.error("Failed to start AI chat");
    } finally {
      setLoading(false);
    }
  }, [aiIntensity, aiPersonality]);

  const canSend = useMemo(() => Boolean(aiInput.trim() && aiSession), [aiInput, aiSession]);

  const handleSendAIMessage = useCallback(async () => {
    if (!aiSession) return;
    const content = aiInput.trim();
    if (!content) return;

    setLoading(true);
    try {
      const result = await sendSeductiveAIMessage(aiSession.id, content);
      if (result) {
        setAiMessages(prev => [...prev, result.userMessage, result.aiResponse]);
        setAiInput("");
      }
    } catch {
      toast.error("Failed to send message");
    } finally {
      setLoading(false);
    }
  }, [aiInput, aiSession]);

  return (
    <Card className="glass-card border-border/50">
      <CardHeader>
        <CardTitle>Seductive AI Chat</CardTitle>
        <CardDescription>Chat with an AI specialized in intimate conversations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!aiSession ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>AI Personality</Label>
                <Select
                  value={aiPersonality}
                  onValueChange={(v: AiPersonality) => setAiPersonality(v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seductive">Seductive</SelectItem>
                    <SelectItem value="flirty">Flirty</SelectItem>
                    <SelectItem value="dirty">Dirty</SelectItem>
                    <SelectItem value="nasty">Nasty</SelectItem>
                    <SelectItem value="romantic">Romantic</SelectItem>
                    <SelectItem value="kinky">Kinky</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Intensity</Label>
                <Select value={aiIntensity} onValueChange={(v: AiIntensity) => setAiIntensity(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="strong">Strong</SelectItem>
                    <SelectItem value="extreme">Extreme</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleStartAIChat} className="w-full" disabled={loading}>
              Start AI Chat Session
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="h-96 overflow-y-auto border rounded p-4 space-y-2">
              {aiMessages.length === 0 ? (
                <div className="text-sm text-muted-foreground">Say hi to get started.</div>
              ) : (
                aiMessages.map(msg => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded ${
                      msg.message_type === "user"
                        ? "bg-primary/20 ml-auto max-w-[80%]"
                        : "bg-muted mr-auto max-w-[80%]"
                    }`}
                  >
                    <p>{msg.message_content}</p>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") void handleSendAIMessage();
                }}
                placeholder="Type your message..."
                aria-label="AI chat message"
              />
              <Button
                onClick={handleSendAIMessage}
                disabled={!canSend || loading}
                aria-label="Send AI message"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
