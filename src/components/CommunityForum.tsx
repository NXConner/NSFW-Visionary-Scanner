import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  getForumCategories,
  getForumThreads,
  getForumThread,
  createForumThread,
  createForumPost,
  interactWithContent,
  getUserReputation,
  searchForumThreads,
  hasUserInteracted,
  type ForumCategory,
  type ForumThread,
  type ForumPost,
  type UserReputation
} from '@/lib/communityForum'
import { MessageSquare, Plus, Search, ThumbsUp, HelpCircle, Pin, Lock, TrendingUp, User, Clock, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

export const CommunityForum = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('threads')
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<ForumCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [threads, setThreads] = useState<ForumThread[]>([])
  const [selectedThread, setSelectedThread] = useState<ForumThread | null>(null)
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [showNewThreadForm, setShowNewThreadForm] = useState(false)
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [userReputation, setUserReputation] = useState<UserReputation | null>(null)

  const [newThread, setNewThread] = useState({
    category_id: '',
    title: '',
    content: '',
    is_anonymous: false,
    is_success_story: false,
  })

  const [newPost, setNewPost] = useState({
    content: '',
    is_anonymous: false,
  })

  useEffect(() => {
    loadCategories()
    if (user) {
      loadUserReputation()
    }
  }, [user])

  useEffect(() => {
    if (selectedCategory || activeTab === 'threads') {
      loadThreads()
    }
  }, [selectedCategory, activeTab])

  const loadCategories = async () => {
    try {
      const data = await getForumCategories()
      setCategories(data)
      if (data.length > 0 && !selectedCategory) {
        setSelectedCategory(data[0].id!)
      }
    } catch (error) {
      toast.error('Failed to load categories')
    }
  }

  const loadThreads = async () => {
    setLoading(true)
    try {
      if (searchQuery) {
        const results = await searchForumThreads(searchQuery, selectedCategory || undefined)
        setThreads(results)
      } else {
        const data = await getForumThreads(selectedCategory || undefined)
        setThreads(data)
      }
    } catch (error) {
      toast.error('Failed to load threads')
    } finally {
      setLoading(false)
    }
  }

  const loadThread = async (threadId: string) => {
    setLoading(true)
    try {
      const { thread, posts: threadPosts } = await getForumThread(threadId)
      if (thread) {
        setSelectedThread(thread)
        setPosts(threadPosts)
      }
    } catch (error) {
      toast.error('Failed to load thread')
    } finally {
      setLoading(false)
    }
  }

  const loadUserReputation = async () => {
    try {
      const reputation = await getUserReputation()
      setUserReputation(reputation)
    } catch (error) {
      // Silent fail
    }
  }

  const handleCreateThread = async () => {
    if (!newThread.title || !newThread.content || !newThread.category_id) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      await createForumThread(newThread)
      toast.success('Thread created!')
      setShowNewThreadForm(false)
      setNewThread({ category_id: '', title: '', content: '', is_anonymous: false, is_success_story: false })
      await loadThreads()
    } catch (error) {
      toast.error('Failed to create thread')
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePost = async () => {
    if (!newPost.content || !selectedThread) {
      toast.error('Please enter a reply')
      return
    }

    setLoading(true)
    try {
      await createForumPost({
        thread_id: selectedThread.id!,
        content: newPost.content,
        is_anonymous: newPost.is_anonymous,
      })
      toast.success('Reply posted!')
      setShowReplyForm(false)
      setNewPost({ content: '', is_anonymous: false })
      await loadThread(selectedThread.id!)
    } catch (error) {
      toast.error('Failed to post reply')
    } finally {
      setLoading(false)
    }
  }

  const handleInteract = async (
    contentType: 'thread' | 'post',
    contentId: string,
    type: 'like' | 'helpful'
  ) => {
    try {
      await interactWithContent(contentType, contentId, type)
      if (selectedThread) {
        await loadThread(selectedThread.id!)
      } else {
        await loadThreads()
      }
    } catch (error) {
      toast.error('Failed to update interaction')
    }
  }

  if (selectedThread) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => {
          setSelectedThread(null)
          setPosts([])
          setShowReplyForm(false)
        }}>
          ← Back to Threads
        </Button>

        <Card variant="glass">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {selectedThread.is_pinned && <Pin className="w-4 h-4 text-primary" />}
                  {selectedThread.is_locked && <Lock className="w-4 h-4 text-muted-foreground" />}
                  <CardTitle className="text-2xl">{selectedThread.title}</CardTitle>
                </div>
                <div className="flex gap-2">
                  {selectedThread.is_success_story && (
                    <Badge className="bg-green-500">Success Story</Badge>
                  )}
                  {selectedThread.is_expert_qa && (
                    <Badge className="bg-blue-500">Expert Q&A</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-invert max-w-none mb-6 whitespace-pre-wrap">
              {selectedThread.content}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground pt-4 border-t">
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {selectedThread.view_count || 0} views
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                {selectedThread.reply_count || 0} replies
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {new Date(selectedThread.created_at!).toLocaleDateString()}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Posts/Replies */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Replies ({posts.length})</h3>
          {posts.map(post => (
            <Card key={post.id} variant="glass">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="prose prose-invert max-w-none whitespace-pre-wrap">
                    {post.content}
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {post.is_expert_answer && (
                        <Badge className="bg-blue-500">Expert Answer</Badge>
                      )}
                      <span>{new Date(post.created_at!).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleInteract('post', post.id!, 'like')}
                      >
                        <ThumbsUp className="w-4 h-4 mr-1" />
                        {post.like_count || 0}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleInteract('post', post.id!, 'helpful')}
                      >
                        <HelpCircle className="w-4 h-4 mr-1" />
                        Helpful ({post.helpful_count || 0})
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Reply Form */}
        {!selectedThread.is_locked && (
          <Card variant="glass">
            <CardHeader>
              <CardTitle>Post a Reply</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Write your reply..."
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                rows={6}
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
                <Button onClick={handleCreatePost} disabled={loading || !newPost.content}>
                  {loading ? 'Posting...' : 'Post Reply'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
          <MessageSquare className="w-4 h-4 text-primary" />
          <span className="text-sm text-primary font-medium">Community</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          <span className="gradient-text">Community</span> Forum
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Connect with others, share experiences, ask questions, and get support.
        </p>
        {userReputation && (
          <div className="mt-4 flex items-center justify-center gap-4">
            <Badge variant="outline">
              <TrendingUp className="w-3 h-3 mr-1" />
              {userReputation.reputation_points || 0} Reputation
            </Badge>
            <Badge variant="outline">
              Level {userReputation.level || 1}
            </Badge>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="threads">Threads</TabsTrigger>
          <TabsTrigger value="new">New Thread</TabsTrigger>
        </TabsList>

        {/* Threads Tab */}
        <TabsContent value="threads" className="space-y-6">
          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Button>
            {categories.map(cat => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat.id!)}
              >
                {cat.name}
              </Button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search threads..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                if (e.target.value) {
                  loadThreads()
                }
              }}
              className="pl-10"
            />
          </div>

          {/* Threads List */}
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : threads.length > 0 ? (
            <div className="space-y-4">
              {threads.map(thread => (
                <Card
                  key={thread.id}
                  variant="glass"
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => loadThread(thread.id!)}
                >
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {thread.is_pinned && <Pin className="w-4 h-4 text-primary" />}
                            <h3 className="font-semibold text-lg">{thread.title}</h3>
                          </div>
                          <p className="text-muted-foreground line-clamp-2">{thread.content}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            {thread.reply_count || 0}
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {thread.view_count || 0}
                          </div>
                          <div className="flex items-center gap-1">
                            <ThumbsUp className="w-4 h-4" />
                            {thread.like_count || 0}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {thread.last_reply_at
                              ? new Date(thread.last_reply_at).toLocaleDateString()
                              : new Date(thread.created_at!).toLocaleDateString()}
                          </div>
                        </div>
                        {thread.is_success_story && (
                          <Badge className="bg-green-500">Success Story</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No threads found. Be the first to start a discussion!</p>
            </div>
          )}
        </TabsContent>

        {/* New Thread Tab */}
        <TabsContent value="new">
          <Card variant="glass">
            <CardHeader>
              <CardTitle>Create New Thread</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <select
                  value={newThread.category_id}
                  onChange={(e) => setNewThread({ ...newThread, category_id: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Title</label>
                <Input
                  value={newThread.title}
                  onChange={(e) => setNewThread({ ...newThread, title: e.target.value })}
                  placeholder="Enter thread title..."
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Content</label>
                <Textarea
                  value={newThread.content}
                  onChange={(e) => setNewThread({ ...newThread, content: e.target.value })}
                  placeholder="Write your post..."
                  rows={8}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-2">
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
                      checked={newThread.is_success_story}
                      onChange={(e) => setNewThread({ ...newThread, is_success_story: e.target.checked })}
                    />
                    This is a success story
                  </label>
                </div>
                <Button onClick={handleCreateThread} disabled={loading} variant="gradient">
                  {loading ? 'Creating...' : 'Create Thread'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
