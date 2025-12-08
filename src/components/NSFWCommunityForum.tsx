/**
 * NSFW Community Forum
 * NSFW-specific discussion forums with anonymous posting, Q&A, success stories, and support groups
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  getNSFWForumCategories,
  getNSFWForumThreads,
  createNSFWForumThread,
  createNSFWForumPost,
  getNSFWForumPosts,
  getNSFWCommunityChallenges,
  createNSFWSupportGroup,
  type NSFWForumCategory,
  type NSFWForumThread,
  type NSFWForumPost,
  type NSFWCommunityChallenge,
  type NSFWSupportGroup
} from '@/lib/nsfwCommunityForum'
import { hasNSFWContent, isSFW } from '@/lib/featureFlags'
import { MessageSquare, Plus, Search, ThumbsUp, HelpCircle, Pin, Lock, TrendingUp, Users, Shield, Loader2, Eye, Clock } from 'lucide-react'
import { toast } from 'sonner'

export const NSFWCommunityForum = () => {
  const [activeTab, setActiveTab] = useState('threads')
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<NSFWForumCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [threads, setThreads] = useState<NSFWForumThread[]>([])
  const [selectedThread, setSelectedThread] = useState<NSFWForumThread | null>(null)
  const [posts, setPosts] = useState<NSFWForumPost[]>([])
  const [challenges, setChallenges] = useState<NSFWCommunityChallenge[]>([])
  const [showNewThreadForm, setShowNewThreadForm] = useState(false)
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [nsfwAvailable, setNsfwAvailable] = useState(false)
  const [isCheckingNsfw, setIsCheckingNsfw] = useState(true)

  const [newThread, setNewThread] = useState({
    category_id: '',
    title: '',
    content: '',
    is_anonymous: false,
    is_qa_thread: false,
    is_success_story: false
  })

  const [newPost, setNewPost] = useState({
    content: '',
    is_anonymous: false
  })

  useEffect(() => {
    const checkNsfw = async () => {
      setIsCheckingNsfw(true)
      const available = await hasNSFWContent()
      setNsfwAvailable(available)
      setIsCheckingNsfw(false)
    }
    checkNsfw()
  }, [])

  useEffect(() => {
    if (nsfwAvailable) {
      loadData()
    }
  }, [activeTab, selectedCategory, nsfwAvailable])

  const loadData = async () => {
    setLoading(true)
    try {
      switch (activeTab) {
        case 'threads': {
          const [categoriesData, threadsData] = await Promise.all([
            getNSFWForumCategories(),
            getNSFWForumThreads(selectedCategory || undefined)
          ])
          setCategories(categoriesData)
          setThreads(threadsData)
          break
        }
        case 'challenges': {
          const challengesData = await getNSFWCommunityChallenges()
          setChallenges(challengesData)
          break
        }
      }
    } catch (error) {
      toast.error('Failed to load forum data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateThread = async () => {
    if (!newThread.category_id || !newThread.title || !newThread.content) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const thread = await createNSFWForumThread(
        newThread.category_id,
        newThread.title,
        newThread.content,
        newThread.is_anonymous,
        newThread.is_qa_thread,
        newThread.is_success_story
      )
      if (thread) {
        setShowNewThreadForm(false)
        setNewThread({ category_id: '', title: '', content: '', is_anonymous: false, is_qa_thread: false, is_success_story: false })
        await loadData()
      }
    } catch (error) {
      toast.error('Failed to create thread')
    }
  }

  const handleLoadThread = async (thread: NSFWForumThread) => {
    setSelectedThread(thread)
    try {
      const postsData = await getNSFWForumPosts(thread.id)
      setPosts(postsData)
    } catch (error) {
      toast.error('Failed to load posts')
    }
  }

  const handleCreatePost = async () => {
    if (!selectedThread || !newPost.content) {
      toast.error('Please enter a reply')
      return
    }

    try {
      const post = await createNSFWForumPost(
        selectedThread.id,
        newPost.content,
        newPost.is_anonymous
      )
      if (post) {
        setShowReplyForm(false)
        setNewPost({ content: '', is_anonymous: false })
        await handleLoadThread(selectedThread)
      }
    } catch (error) {
      toast.error('Failed to create post')
    }
  }

  if (isCheckingNsfw) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="glass-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="w-12 h-12 text-muted-foreground animate-spin mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isSFW() || !nsfwAvailable) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="glass-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-full bg-muted/30 mb-4">
              <Lock className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">NSFW Content Not Available</h3>
            <p className="text-muted-foreground max-w-md mb-4">
              The NSFW community forum is only available in the NSFW version or with a DLC upgrade.
            </p>
            <Badge variant="secondary">Requires NSFW Version or DLC</Badge>
          </CardContent>
        </Card>
      </div>
    )
  }

  const filteredThreads = threads.filter(thread => {
    if (searchQuery === '') return true
    return thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           thread.content.toLowerCase().includes(searchQuery.toLowerCase())
  })

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-6 h-6" />
            NSFW Community Forum
          </CardTitle>
          <CardDescription>
            Connect with others, share experiences, ask questions, and find support
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="threads">Threads</TabsTrigger>
              <TabsTrigger value="challenges">Challenges</TabsTrigger>
              <TabsTrigger value="support">Support Groups</TabsTrigger>
            </TabsList>

            <TabsContent value="threads" className="space-y-4">
              {selectedThread ? (
                <div className="space-y-4">
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedThread(null)}
                    className="mb-4"
                  >
                    ← Back to Threads
                  </Button>
                  <Card className="glass-card border-border/50">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle>{selectedThread.title}</CardTitle>
                            {selectedThread.is_pinned && <Pin className="w-4 h-4 text-yellow-500" />}
                            {selectedThread.is_locked && <Lock className="w-4 h-4 text-muted-foreground" />}
                            {selectedThread.is_qa_thread && <Badge variant="secondary">Q&A</Badge>}
                            {selectedThread.is_success_story && <Badge variant="default">Success Story</Badge>}
                          </div>
                          <CardDescription>
                            {selectedThread.is_anonymous ? 'Anonymous' : `User ${selectedThread.user_id?.substring(0, 8)}`}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap mb-4">{selectedThread.content}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {selectedThread.view_count} views
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          {selectedThread.reply_count} replies
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-4 h-4" />
                          {selectedThread.like_count} likes
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-2">
                    <h3 className="font-semibold">Replies ({posts.length})</h3>
                    <ScrollArea className="h-[400px]">
                      {posts.map(post => (
                        <Card key={post.id} className="glass-card border-border/50 mb-2">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {post.is_anonymous ? (
                                  <span className="text-sm text-muted-foreground">Anonymous</span>
                                ) : (
                                  <span className="text-sm">User {post.user_id?.substring(0, 8)}</span>
                                )}
                                {post.is_expert_answer && (
                                  <Badge variant="default" className="text-xs">
                                    <Shield className="w-3 h-3 mr-1" />
                                    Expert
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(post.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="whitespace-pre-wrap">{post.content}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <Button variant="ghost" size="sm">
                                <ThumbsUp className="w-4 h-4 mr-1" />
                                {post.like_count}
                              </Button>
                              <Button variant="ghost" size="sm">
                                <HelpCircle className="w-4 h-4 mr-1" />
                                {post.helpful_count} helpful
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </ScrollArea>
                    {!selectedThread.is_locked && (
                      <Card className="glass-card border-border/50">
                        <CardContent className="p-4">
                          <Textarea
                            placeholder="Write a reply..."
                            value={newPost.content}
                            onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                            className="mb-2"
                            rows={4}
                          />
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={newPost.is_anonymous}
                                onChange={(e) => setNewPost({ ...newPost, is_anonymous: e.target.checked })}
                              />
                              Post anonymously
                            </label>
                            <Button onClick={handleCreatePost}>Post Reply</Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search threads..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Button onClick={() => setShowNewThreadForm(!showNewThreadForm)}>
                      <Plus className="w-4 h-4 mr-2" />
                      New Thread
                    </Button>
                  </div>

                  {showNewThreadForm && (
                    <Card className="glass-card border-border/50">
                      <CardContent className="p-4 space-y-4">
                        <Input
                          placeholder="Thread title"
                          value={newThread.title}
                          onChange={(e) => setNewThread({ ...newThread, title: e.target.value })}
                        />
                        <Textarea
                          placeholder="Thread content"
                          value={newThread.content}
                          onChange={(e) => setNewThread({ ...newThread, content: e.target.value })}
                          rows={6}
                        />
                        <div className="flex flex-col gap-2">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={newThread.is_anonymous}
                              onChange={(e) => setNewThread({ ...newThread, is_anonymous: e.target.checked })}
                            />
                            Post anonymously
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={newThread.is_qa_thread}
                              onChange={(e) => setNewThread({ ...newThread, is_qa_thread: e.target.checked })}
                            />
                            This is a Q&A thread
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={newThread.is_success_story}
                              onChange={(e) => setNewThread({ ...newThread, is_success_story: e.target.checked })}
                            />
                            This is a success story
                          </label>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleCreateThread} className="flex-1">Create Thread</Button>
                          <Button variant="outline" onClick={() => setShowNewThreadForm(false)}>Cancel</Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="space-y-2">
                    {loading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                      </div>
                    ) : (
                      filteredThreads.map(thread => (
                        <Card
                          key={thread.id}
                          className="glass-card border-border/50 hover:border-primary/50 transition-colors cursor-pointer"
                          onClick={() => handleLoadThread(thread)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold">{thread.title}</h3>
                                  {thread.is_pinned && <Pin className="w-4 h-4 text-yellow-500" />}
                                  {thread.is_qa_thread && <Badge variant="secondary">Q&A</Badge>}
                                  {thread.is_success_story && <Badge variant="default">Success</Badge>}
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{thread.content}</p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span>{thread.is_anonymous ? 'Anonymous' : `User ${thread.user_id?.substring(0, 8)}`}</span>
                                  <span className="flex items-center gap-1">
                                    <Eye className="w-3 h-3" />
                                    {thread.view_count}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MessageSquare className="w-3 h-3" />
                                    {thread.reply_count}
                                  </span>
                                  {thread.last_reply_at && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {new Date(thread.last_reply_at).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="challenges" className="space-y-4">
              <h3 className="text-lg font-semibold">Community Challenges</h3>
              {challenges.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No active challenges
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {challenges.map(challenge => (
                    <Card key={challenge.id} className="glass-card border-border/50">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>{challenge.challenge_name}</CardTitle>
                          {challenge.is_featured && <Badge variant="default">Featured</Badge>}
                        </div>
                        <CardDescription>{challenge.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                          <span>{challenge.participant_count} participants</span>
                          <span>{challenge.completion_count} completed</span>
                        </div>
                        <Button className="w-full">Join Challenge</Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="support" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Support Groups</h3>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Group
                </Button>
              </div>
              <div className="text-center py-12 text-muted-foreground">
                Support groups coming soon
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

