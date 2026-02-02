import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MessageSquare } from "lucide-react";
import {
  askExpertQuestion,
  getExpertQA,
  type ExpertProfile,
  type ExpertQA,
} from "@/lib/expertContentConsultations";

export function QATab({
  isActive,
  expert,
}: {
  isActive: boolean;
  expert: ExpertProfile | null;
}): JSX.Element {
  const [loading, setLoading] = useState(false);
  const [qa, setQa] = useState<ExpertQA[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [questionCategory, setQuestionCategory] = useState("");

  const load = useCallback(async () => {
    if (!expert) return;
    setLoading(true);
    try {
      const qaData = await getExpertQA(expert.id);
      setQa(qaData);
    } catch {
      toast.error("Failed to load Q&A");
    } finally {
      setLoading(false);
    }
  }, [expert]);

  useEffect(() => {
    if (!isActive) return;
    void load();
  }, [isActive, load]);

  const handleAskQuestion = useCallback(async () => {
    if (!expert || !newQuestion.trim()) {
      toast.error("Please select an expert and enter a question");
      return;
    }

    setLoading(true);
    try {
      const result = await askExpertQuestion(
        expert.id,
        newQuestion.trim(),
        questionCategory || undefined,
      );
      if (result) {
        setNewQuestion("");
        setQuestionCategory("");
        await load();
      }
    } finally {
      setLoading(false);
    }
  }, [expert, load, newQuestion, questionCategory]);

  return (
    <div className="space-y-4">
      {expert && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ask {expert.display_name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="expert-question">Your Question</Label>
              <Textarea
                id="expert-question"
                placeholder="What would you like to ask?"
                value={newQuestion}
                onChange={e => setNewQuestion(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expert-question-category">Category (optional)</Label>
              <Input
                id="expert-question-category"
                placeholder="e.g., General, Health, Wellness"
                value={questionCategory}
                onChange={e => setQuestionCategory(e.target.value)}
              />
            </div>
            <Button onClick={handleAskQuestion} disabled={!newQuestion.trim() || loading}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Submit Question
            </Button>
          </CardContent>
        </Card>
      )}

      <div>
        <h3 className="font-semibold mb-4">Q&amp;A</h3>
        {loading && qa.length === 0 ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : qa.length === 0 ? (
          <p className="text-muted-foreground text-sm">No Q&amp;A available yet</p>
        ) : (
          <div className="space-y-4">
            {qa.map(item => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <p className="font-medium">Q: {item.question}</p>
                  {item.answer && <p className="text-muted-foreground mt-2">A: {item.answer}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
