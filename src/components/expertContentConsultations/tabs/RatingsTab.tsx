import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Star } from "lucide-react";
import {
  getExpertRatings,
  rateExpert,
  type ExpertProfile,
  type ExpertRating,
} from "@/lib/expertContentConsultations";

type RatingState = {
  overallRating: number;
  reviewTitle: string;
  reviewText: string;
};

function renderStars(rating: number): JSX.Element[] {
  return Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      className={`h-4 w-4 ${i < rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`}
    />
  ));
}

export function RatingsTab({
  isActive,
  expert,
}: {
  isActive: boolean;
  expert: ExpertProfile | null;
}): JSX.Element {
  const [loading, setLoading] = useState(false);
  const [ratings, setRatings] = useState<ExpertRating[]>([]);
  const [newRating, setNewRating] = useState<RatingState>({
    overallRating: 5,
    reviewTitle: "",
    reviewText: "",
  });

  const load = useCallback(async () => {
    if (!expert) return;
    setLoading(true);
    try {
      const ratingsData = await getExpertRatings(expert.id);
      setRatings(ratingsData);
    } catch {
      toast.error("Failed to load ratings");
    } finally {
      setLoading(false);
    }
  }, [expert]);

  useEffect(() => {
    if (!isActive) return;
    void load();
  }, [isActive, load]);

  const canSubmit = useMemo(
    () => Boolean(expert && newRating.overallRating >= 1 && newRating.overallRating <= 5),
    [expert, newRating.overallRating],
  );

  const handleSubmitRating = useCallback(async () => {
    if (!expert) {
      toast.error("Please select an expert first");
      return;
    }

    setLoading(true);
    try {
      const result = await rateExpert(expert.id, {
        overallRating: newRating.overallRating,
        reviewTitle: newRating.reviewTitle || undefined,
        reviewText: newRating.reviewText || undefined,
      });

      if (result) {
        setNewRating({ overallRating: 5, reviewTitle: "", reviewText: "" });
        await load();
      }
    } finally {
      setLoading(false);
    }
  }, [expert, load, newRating]);

  return (
    <div className="space-y-4">
      {expert && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rate {expert.display_name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Overall Rating</Label>
              <div className="flex gap-1" aria-label="Overall rating">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewRating(r => ({ ...r, overallRating: star }))}
                    className="p-1 hover:scale-110 transition-transform"
                    aria-label={`Set rating ${star}`}
                    aria-pressed={newRating.overallRating === star}
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= newRating.overallRating
                          ? "text-yellow-500 fill-yellow-500"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="review-title">Review Title (optional)</Label>
              <Input
                id="review-title"
                placeholder="Summary of your experience"
                value={newRating.reviewTitle}
                onChange={e => setNewRating(r => ({ ...r, reviewTitle: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="review-text">Review (optional)</Label>
              <Textarea
                id="review-text"
                placeholder="Share your experience..."
                value={newRating.reviewText}
                onChange={e => setNewRating(r => ({ ...r, reviewText: e.target.value }))}
              />
            </div>
            <Button onClick={handleSubmitRating} disabled={!canSubmit || loading}>
              <Star className="mr-2 h-4 w-4" />
              Submit Rating
            </Button>
          </CardContent>
        </Card>
      )}

      <div>
        <h3 className="font-semibold mb-4">Ratings</h3>
        {loading && ratings.length === 0 ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : ratings.length === 0 ? (
          <p className="text-muted-foreground text-sm">No ratings yet</p>
        ) : (
          <div className="space-y-3">
            {ratings.map(r => (
              <Card key={r.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex">{renderStars(r.rating || 0)}</div>
                      <Badge variant="secondary">{(r.rating || 0).toFixed(1)}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  {r.review_title && <div className="font-medium">{r.review_title}</div>}
                  {r.review_text && (
                    <div className="text-sm text-muted-foreground">{r.review_text}</div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
