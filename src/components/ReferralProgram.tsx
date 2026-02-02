/**
 * Referral Program Component
 * Displays referral code, sharing options, statistics, and leaderboard
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Reveal, AnimatedNumber, TiltCard, LiquidProgress } from "@/components/premium";
import {
  Share2,
  Copy,
  Gift,
  TrendingUp,
  Users,
  Award,
  ExternalLink,
  Loader2,
  CheckCircle2,
  BarChart3,
} from "lucide-react";
import {
  getOrCreateReferralCode,
  applyReferralCode,
  getReferralStats,
  getReferralTracking,
  shareReferralCode,
  getReferralLeaderboard,
  type ReferralCode,
  type ReferralAnalytics,
  type ReferralTracking,
} from "@/lib/referral";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

export const ReferralProgram = () => {
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
  const [stats, setStats] = useState<ReferralAnalytics | null>(null);
  const [tracking, setTracking] = useState<ReferralTracking[]>([]);
  const [leaderboard, setLeaderboard] = useState<
    Array<{ display_name: string; referral_count: number; rank: number }>
  >([]);
  const [inputCode, setInputCode] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [code, statsData, trackingData, leaderboardData] = await Promise.all([
      getOrCreateReferralCode(),
      getReferralStats(),
      getReferralTracking(),
      getReferralLeaderboard(10),
    ]);
    setReferralCode(code);
    setStats(statsData);
    setTracking(trackingData || []);
    setLeaderboard(leaderboardData || []);
    setIsLoading(false);
  };

  const handleShare = () => {
    if (referralCode) {
      shareReferralCode(referralCode.code);
    }
  };

  const handleCopy = () => {
    if (referralCode) {
      const url = `${window.location.origin}?ref=${referralCode.code}`;
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        toast.success("Referral link copied!");
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleApplyCode = async () => {
    if (!inputCode.trim()) {
      toast.error("Please enter a referral code");
      return;
    }

    setIsApplying(true);
    const success = await applyReferralCode(inputCode.trim());
    if (success) {
      setInputCode("");
      await loadData();
    }
    setIsApplying(false);
  };

  const referralUrl = referralCode ? `${window.location.origin}?ref=${referralCode.code}` : "";

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Reveal variant="fade-up">
        <TiltCard variant="glass" maxTilt={6}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              Your Referral Code
            </CardTitle>
            <CardDescription>Share your code and earn rewards when friends join!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {referralCode && (
              <>
                <div className="flex items-center gap-2">
                  <Input
                    value={referralCode.code}
                    readOnly
                    className="font-mono text-lg font-bold text-center"
                  />
                  <Button variant="outline" size="icon" onClick={handleCopy} className="shrink-0">
                    {copied ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleShare} className="flex-1">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  <Button variant="outline" onClick={handleCopy} className="flex-1">
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </Button>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>
                    Share this link:{" "}
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">{referralUrl}</code>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      <AnimatedNumber value={referralCode.usage_count} />
                    </div>
                    <div className="text-sm text-muted-foreground">Total Referrals</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {referralCode.max_uses ? (
                        <>
                          <AnimatedNumber
                            value={referralCode.max_uses - referralCode.usage_count}
                          />{" "}
                          left
                        </>
                      ) : (
                        "∞"
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">Remaining Uses</div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </TiltCard>
      </Reveal>

      <Reveal variant="fade-up" delay={0.1}>
        <TiltCard variant="glass" maxTilt={6}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Your Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-primary/10">
                    <div className="text-2xl font-bold">
                      <AnimatedNumber value={stats.total_referrals} />
                    </div>
                    <div className="text-sm text-muted-foreground">Total Referrals</div>
                  </div>
                  <div className="p-4 rounded-lg bg-green-500/10">
                    <div className="text-2xl font-bold">
                      <AnimatedNumber value={stats.completed_referrals} />
                    </div>
                    <div className="text-sm text-muted-foreground">Completed</div>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-500/10">
                    <div className="text-2xl font-bold">
                      <AnimatedNumber value={stats.conversion_rate} decimals={1} />%
                    </div>
                    <div className="text-sm text-muted-foreground">Conversion Rate</div>
                  </div>
                  <div className="p-4 rounded-lg bg-purple-500/10">
                    <div className="text-2xl font-bold">
                      $<AnimatedNumber value={stats.total_rewards_earned} decimals={2} />
                    </div>
                    <div className="text-sm text-muted-foreground">Rewards Earned</div>
                  </div>
                </div>

                {stats.total_referrals > 0 && (
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Completion Rate</span>
                      <span>
                        <AnimatedNumber value={stats.conversion_rate} decimals={1} />%
                      </span>
                    </div>
                    <LiquidProgress value={stats.conversion_rate} height={10} />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </TiltCard>
      </Reveal>

      <Reveal variant="fade-up" delay={0.15}>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Use a Referral Code
            </CardTitle>
            <CardDescription>Enter a friend's referral code to get started</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter referral code"
                value={inputCode}
                onChange={e => setInputCode(e.target.value.toUpperCase())}
                className="flex-1"
                maxLength={8}
              />
              <Button onClick={handleApplyCode} disabled={isApplying || !inputCode.trim()}>
                {isApplying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </Reveal>

      <Tabs defaultValue="tracking" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tracking">Referral Tracking</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="tracking" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Your Referrals</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {tracking.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No referrals yet. Share your code to get started!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tracking.map(ref => (
                      <div
                        key={ref.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                ref.status === "rewarded"
                                  ? "default"
                                  : ref.status === "completed"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {ref.status}
                            </Badge>
                            {ref.referred_subscribed && (
                              <Badge variant="outline" className="text-green-500">
                                Subscribed
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {new Date(ref.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        {ref.reward_type && (
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {ref.reward_type === "discount" && `$${ref.reward_value} off`}
                              {ref.reward_type === "free_month" && "1 Free Month"}
                              {ref.reward_type === "credit" && `$${ref.reward_value} credit`}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Top Referrers
              </CardTitle>
              <CardDescription>Anonymous leaderboard (opt-in)</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {leaderboard.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No leaderboard data yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {leaderboard.map(entry => (
                      <div
                        key={entry.rank}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold">
                            {entry.rank}
                          </div>
                          <div>
                            <div className="font-medium">{entry.display_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {entry.referral_count} referrals
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline">
                          <Award className="w-3 h-3 mr-1" />
                          Top {entry.rank}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
