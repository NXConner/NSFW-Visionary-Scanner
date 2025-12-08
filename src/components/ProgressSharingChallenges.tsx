import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  shareProgress,
  getProgressShares,
  interactWithProgressShare,
  getActiveChallenges,
  joinChallenge,
  getUserChallenges,
  submitChallengeCheckin,
  getLeaderboards,
  getLeaderboardEntries,
  type ProgressShare,
  type Challenge,
  type ChallengeParticipant,
  type Leaderboard,
  type LeaderboardEntry
} from '@/lib/progressSharing'
import { Share2, Trophy, Target, TrendingUp, Users, Calendar, ThumbsUp, MessageSquare, Plus, Award } from 'lucide-react'
import { toast } from 'sonner'

export const ProgressSharingChallenges = () => {
  const [activeTab, setActiveTab] = useState('shares')
  const [loading, setLoading] = useState(false)
  const [shares, setShares] = useState<ProgressShare[]>([])
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [userChallenges, setUserChallenges] = useState<ChallengeParticipant[]>([])
  const [leaderboards, setLeaderboards] = useState<Leaderboard[]>([])
  const [selectedLeaderboard, setSelectedLeaderboard] = useState<Leaderboard | null>(null)
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([])
  
  const [newShare, setNewShare] = useState({
    share_type: 'general' as const,
    content_type: 'text' as const,
    title: '',
    description: '',
    is_anonymous: true,
  })

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    setLoading(true)
    try {
      switch (activeTab) {
        case 'shares': {
          const sharesData = await getProgressShares()
          setShares(sharesData)
          break
        }
        case 'challenges': {
          const challengesData = await getActiveChallenges()
          setChallenges(challengesData)
          const userChallengesData = await getUserChallenges()
          setUserChallenges(userChallengesData)
          break
        }
        case 'leaderboards': {
          const leaderboardsData = await getLeaderboards()
          setLeaderboards(leaderboardsData)
          break
        }
      }
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleShareProgress = async () => {
    if (!newShare.title && !newShare.description) {
      toast.error('Please enter a title or description')
      return
    }

    setLoading(true)
    try {
      await shareProgress(newShare)
      toast.success('Progress shared!')
      setNewShare({ share_type: 'general', content_type: 'text', title: '', description: '', is_anonymous: true })
      await loadData()
    } catch (error) {
      toast.error('Failed to share progress')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinChallenge = async (challengeId: string) => {
    setLoading(true)
    try {
      await joinChallenge(challengeId)
      toast.success('Challenge joined!')
      await loadData()
    } catch (error) {
      toast.error('Failed to join challenge')
    } finally {
      setLoading(false)
    }
  }

  const handleViewLeaderboard = async (leaderboard: Leaderboard) => {
    setSelectedLeaderboard(leaderboard)
    try {
      const entries = await getLeaderboardEntries(leaderboard.id!)
      setLeaderboardEntries(entries)
    } catch (error) {
      toast.error('Failed to load leaderboard')
    }
  }

  if (selectedLeaderboard) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setSelectedLeaderboard(null)}>
          ← Back to Leaderboards
        </Button>
        
        <Card variant="glass">
          <CardHeader>
            <CardTitle>{selectedLeaderboard.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leaderboardEntries.map((entry, index) => (
                <div key={entry.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold">
                      {entry.rank || index + 1}
                    </div>
                    <div>
                      <p className="font-semibold">{entry.is_anonymous ? entry.display_name || 'Anonymous' : 'User'}</p>
                      <p className="text-sm text-muted-foreground">{selectedLeaderboard.metric_type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{entry.score?.toFixed(1) || 0}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
          <Share2 className="w-4 h-4 text-primary" />
          <span className="text-sm text-primary font-medium">Community</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          <span className="gradient-text">Progress Sharing</span> & Challenges
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Share your progress, join challenges, and compete on leaderboards.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="shares">Shares</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
          <TabsTrigger value="leaderboards">Leaderboards</TabsTrigger>
        </TabsList>

        {/* Shares Tab */}
        <TabsContent value="shares" className="space-y-6">
          <Card variant="glass">
            <CardHeader>
              <CardTitle>Share Your Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Title (optional)"
                value={newShare.title}
                onChange={(e) => setNewShare({ ...newShare, title: e.target.value })}
              />
              <Textarea
                placeholder="Share your progress, milestone, or achievement..."
                value={newShare.description}
                onChange={(e) => setNewShare({ ...newShare, description: e.target.value })}
                rows={4}
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={newShare.is_anonymous}
                    onChange={(e) => setNewShare({ ...newShare, is_anonymous: e.target.checked })}
                  />
                  Share anonymously
                </label>
                <Button onClick={handleShareProgress} disabled={loading} variant="gradient">
                  {loading ? 'Sharing...' : 'Share'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Recent Shares</h3>
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : shares.length > 0 ? (
              shares.map(share => (
                <Card key={share.id} variant="glass">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {share.title && (
                        <h4 className="font-semibold text-lg">{share.title}</h4>
                      )}
                      <p className="text-muted-foreground">{share.description}</p>
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex gap-2">
                          <Badge variant="outline">{share.share_type}</Badge>
                          {share.is_featured && (
                            <Badge className="bg-yellow-500">Featured</Badge>
                          )}
                        </div>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <Button variant="ghost" size="sm">
                            <ThumbsUp className="w-4 h-4 mr-1" />
                            {share.like_count || 0}
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MessageSquare className="w-4 h-4 mr-1" />
                            {share.comment_count || 0}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Share2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No shares yet. Be the first to share your progress!</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Challenges Tab */}
        <TabsContent value="challenges" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : challenges.length > 0 ? (
              challenges.map(challenge => {
                const userParticipation = userChallenges.find(p => p.challenge_id === challenge.id)
                
                return (
                  <Card key={challenge.id} variant="glass">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg mb-2">{challenge.name}</CardTitle>
                          <CardContent className="p-0">
                            <p className="text-sm text-muted-foreground mb-4">{challenge.description}</p>
                            <div className="flex gap-2 mb-4">
                              <Badge variant="outline">
                                <Calendar className="w-3 h-3 mr-1" />
                                {challenge.duration_days} days
                              </Badge>
                              <Badge variant="outline">
                                <Users className="w-3 h-3 mr-1" />
                                {challenge.participant_count || 0} participants
                              </Badge>
                            </div>
                            {userParticipation && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span>Your Progress</span>
                                  <span className="font-semibold">{userParticipation.progress_percentage?.toFixed(0) || 0}%</span>
                                </div>
                                <Progress value={userParticipation.progress_percentage || 0} />
                                <Badge variant="outline" className="capitalize">
                                  {userParticipation.status}
                                </Badge>
                              </div>
                            )}
                          </CardContent>
                        </div>
                        {challenge.is_featured && (
                          <Badge className="bg-yellow-500">Featured</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {!userParticipation ? (
                        <Button
                          onClick={() => handleJoinChallenge(challenge.id!)}
                          disabled={loading}
                          className="w-full"
                          variant="gradient"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Join Challenge
                        </Button>
                      ) : (
                        <Button variant="outline" className="w-full" disabled>
                          Already Joined
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )
              })
            ) : (
              <div className="text-center py-12 text-muted-foreground col-span-2">
                <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No active challenges. Check back soon!</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Leaderboards Tab */}
        <TabsContent value="leaderboards" className="space-y-6">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : leaderboards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {leaderboards.map(leaderboard => (
                <Card
                  key={leaderboard.id}
                  variant="glass"
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => handleViewLeaderboard(leaderboard)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg mb-2">{leaderboard.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{leaderboard.description}</p>
                      </div>
                      <Trophy className="w-6 h-6 text-yellow-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="capitalize">
                        {leaderboard.leaderboard_type}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {leaderboard.metric_type.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No leaderboards available yet.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}


