import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  getNSFWCommunityChallenges,
  joinNSFWCommunityChallenge,
  type NSFWCommunityChallenge,
} from "@/lib/nsfwCommunityForum";

export function ChallengesTab({ isActive }: { isActive: boolean }): JSX.Element {
  const [loading, setLoading] = useState(false);
  const [challenges, setChallenges] = useState<NSFWCommunityChallenge[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const challengesData = await getNSFWCommunityChallenges();
      setChallenges(challengesData);
    } catch {
      toast.error("Failed to load challenges");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isActive) return;
    void load();
  }, [isActive, load]);

  const join = useCallback(
    async (challengeId: string) => {
      setLoading(true);
      try {
        const ok = await joinNSFWCommunityChallenge(challengeId, true);
        if (ok) await load();
      } finally {
        setLoading(false);
      }
    },
    [load],
  );

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Community Challenges</h3>
      {loading && challenges.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
        </div>
      ) : challenges.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No active challenges</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {challenges.map(challenge => (
            <Card key={challenge.id} className="glass-card border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-base">{challenge.challenge_name}</CardTitle>
                  {challenge.is_featured && <Badge variant="default">Featured</Badge>}
                </div>
                <CardDescription>{challenge.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span>{challenge.participant_count} participants</span>
                </div>
                <Button
                  className="w-full"
                  onClick={() => void join(challenge.id)}
                  disabled={loading}
                >
                  Join Challenge
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
