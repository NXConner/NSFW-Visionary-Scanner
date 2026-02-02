import { Star } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export function ChatFeedback(props: {
  loading: boolean;
  sessionId: string;
  rating: number;
  text: string;
  onSet: (next: { rating: number; text: string }) => void;
  onSubmit: () => Promise<void>;
  onSkip: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Chat Feedback</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="mb-2">How would you rate your experience?</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(r => (
              <Button
                key={r}
                variant={props.rating >= r ? "default" : "outline"}
                size="sm"
                onClick={() => props.onSet({ rating: r, text: props.text })}
              >
                <Star className={`w-4 h-4 ${props.rating >= r ? "fill-yellow-400" : ""}`} />
              </Button>
            ))}
          </div>
        </div>
        <Textarea
          placeholder="Additional feedback (optional)"
          value={props.text}
          onChange={e => props.onSet({ rating: props.rating, text: e.target.value })}
          rows={3}
        />
        <div className="flex gap-2">
          <Button
            onClick={async () => {
              if (props.rating === 0) {
                toast.error("Please provide a rating");
                return;
              }
              await props.onSubmit();
            }}
            disabled={props.loading || props.rating === 0}
          >
            Submit Feedback
          </Button>
          <Button variant="outline" onClick={props.onSkip}>
            Skip
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
