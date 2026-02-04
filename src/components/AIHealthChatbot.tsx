/**
 * AI Health Chatbot
 * Interactive AI-powered health assistant
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, Bot, User } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
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
  const canSend = input.trim().length > 0;
  const suggestedQuestions = [
    "What are common symptoms I should watch for?",
    "How can I improve my overall health routine?",
    "When should I consult a healthcare professional?",
  ];

  const handleSend = () => {
    if (!canSend) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    // Mock response
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "Thank you for your question. I'm here to help with health-related queries. Please note that I provide general information and am not a substitute for professional medical advice.",
        },
      ]);
    }, 1000);
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
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
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
            onKeyDown={e => e.key === "Enter" && handleSend()}
            aria-label="Health question"
          />
          <Button onClick={handleSend} size="icon" disabled={!canSend} aria-label="Send message">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIHealthChatbot;
