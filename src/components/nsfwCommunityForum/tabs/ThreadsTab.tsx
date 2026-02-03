import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  createNSFWForumPost,
  createNSFWForumThread,
  getNSFWForumCategories,
  getNSFWForumPosts,
  getNSFWForumThreads,
  type NSFWForumCategory,
  type NSFWForumPost,
  type NSFWForumThread,
} from "@/lib/nsfwCommunityForum";
import { useNsfwPrivacySettings } from "@/lib/nsfwPrivacySettings";
import {
  Eye,
  HelpCircle,
  Loader2,
  MessageSquare,
  Pin,
  Plus,
  Search,
  ThumbsUp,
  Clock,
  Lock,
} from "lucide-react";

type NewThreadState = {
  category_id: string;
  title: string;
  content: string;
  is_anonymous: boolean;
  is_qa_thread: boolean;
  is_success_story: boolean;
};

type NewPostState = {
  content: string;
  is_anonymous: boolean;
};

export function ThreadsTab({ isActive }: { isActive: boolean }): JSX.Element {
  const { settings: privacy } = useNsfwPrivacySettings();
  const incognito = Boolean(privacy.incognitoMode);
  const defaultAnonymous = useMemo(() => {
    return privacy.privacyTier === "partner" ? false : true;
  }, [privacy.privacyTier]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<NSFWForumCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [threads, setThreads] = useState<NSFWForumThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<NSFWForumThread | null>(null);
  const [posts, setPosts] = useState<NSFWForumPost[]>([]);
  const [showNewThreadForm, setShowNewThreadForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [revealInIncognito, setRevealInIncognito] = useState(false);

  const [newThread, setNewThread] = useState<NewThreadState>(() => ({
    category_id: "",
    title: "",
    content: "",
    is_anonymous: defaultAnonymous,
    is_qa_thread: false,
    is_success_story: false,
  }));

  const [newPost, setNewPost] = useState<NewPostState>(() => ({
    content: "",
    is_anonymous: defaultAnonymous,
  }));

  useEffect(() => {
    setNewThread(prev =>
      prev.title || prev.content ? prev : { ...prev, is_anonymous: defaultAnonymous },
    );
    setNewPost(prev => (prev.content ? prev : { ...prev, is_anonymous: defaultAnonymous }));
  }, [defaultAnonymous]);

  const loadThreads = useCallback(async () => {
    setLoading(true);
    try {
      const [categoriesData, threadsData] = await Promise.all([
        getNSFWForumCategories(),
        getNSFWForumThreads(selectedCategory || undefined),
      ]);
      setCategories(categoriesData);
      setThreads(threadsData);
    } catch {
      toast.error("Failed to load forum data");
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  const loadPosts = useCallback(async (threadId: string) => {
    setLoading(true);
    try {
      const postsData = await getNSFWForumPosts(threadId);
      setPosts(postsData);
    } catch {
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isActive) return;
    void loadThreads();
  }, [isActive, loadThreads]);

  const filteredThreads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter(
      thread => thread.title.toLowerCase().includes(q) || thread.content.toLowerCase().includes(q),
    );
  }, [searchQuery, threads]);

  const handleLoadThread = useCallback(
    async (thread: NSFWForumThread) => {
      setSelectedThread(thread);
      setRevealInIncognito(false);
      await loadPosts(thread.id);
    },
    [loadPosts],
  );

  const handleCreateThread = useCallback(async () => {
    if (!newThread.category_id || !newThread.title || !newThread.content) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const thread = await createNSFWForumThread(
        newThread.category_id,
        newThread.title,
        newThread.content,
        newThread.is_anonymous,
        newThread.is_qa_thread,
        newThread.is_success_story,
      );
      if (thread) {
        setShowNewThreadForm(false);
        setNewThread({
          category_id: "",
          title: "",
          content: "",
          is_anonymous: false,
          is_qa_thread: false,
          is_success_story: false,
        });
        await loadThreads();
      }
    } finally {
      setLoading(false);
    }
  }, [loadThreads, newThread]);

  const handleCreatePost = useCallback(async () => {
    if (!selectedThread || !newPost.content.trim()) {
      toast.error("Please enter a reply");
      return;
    }

    setLoading(true);
    try {
      const post = await createNSFWForumPost(
        selectedThread.id,
        newPost.content,
        newPost.is_anonymous,
      );
      if (post) {
        setNewPost({ content: "", is_anonymous: false });
        await loadPosts(selectedThread.id);
      }
    } finally {
      setLoading(false);
    }
  }, [loadPosts, newPost.content, newPost.is_anonymous, selectedThread]);

  const categoryOptions = useMemo(
    () => [
      { id: "", category_name: "All categories" },
      ...categories.map(c => ({ id: c.id, category_name: c.category_name })),
    ],
    [categories],
  );

  if (selectedThread) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <Button variant="outline" onClick={() => setSelectedThread(null)} className="w-full mb-3">
            Back to Threads
          </Button>
          <Card className="glass-card border-border/50">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold line-clamp-2">
                    {incognito && !revealInIncognito ? "Private Thread" : selectedThread.title}
                  </h3>
                  {selectedThread.is_locked && <Lock className="w-4 h-4 text-muted-foreground" />}
                </div>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {incognito && !revealInIncognito
                  ? "Content hidden in incognito mode. Tap Reveal to view."
                  : selectedThread.content}
              </p>
              {incognito ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setRevealInIncognito(v => !v)}
                >
                  {revealInIncognito ? "Hide" : "Reveal"}
                </Button>
              ) : null}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {selectedThread.view_count}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  {selectedThread.reply_count}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-3">
          <Card className="glass-card border-border/50">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Replies</h3>
              {loading && posts.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                </div>
              ) : (
                <ScrollArea className="h-80 pr-4">
                  <div className="space-y-3">
                    {posts.map(post => (
                      <Card key={post.id} className="glass-card border-border/50">
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">
                                {post.is_anonymous ? "Anonymous" : "Member"}
                              </Badge>
                              {post.is_expert_answer && (
                                <Badge variant="default" className="gap-1">
                                  Expert
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(post.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap">{post.content}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Button variant="ghost" size="sm" aria-label="Like post">
                              <ThumbsUp className="w-4 h-4 mr-1" />
                              {post.like_count}
                            </Button>
                            <Button variant="ghost" size="sm" aria-label="Mark helpful">
                              <HelpCircle className="w-4 h-4 mr-1" />
                              {post.helpful_count} helpful
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {!selectedThread.is_locked && (
            <Card className="glass-card border-border/50">
              <CardContent className="p-4">
                <Textarea
                  placeholder="Write a reply..."
                  value={newPost.content}
                  onChange={e => setNewPost({ ...newPost, content: e.target.value })}
                  className="mb-2"
                  rows={4}
                />
                <div className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={newPost.is_anonymous}
                      onChange={e => setNewPost({ ...newPost, is_anonymous: e.target.checked })}
                      aria-label="Post anonymously"
                    />
                    Post anonymously
                  </label>
                  <Button onClick={handleCreatePost} disabled={loading || !newPost.content.trim()}>
                    Post Reply
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search threads..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setShowNewThreadForm(!showNewThreadForm)}>
          <Plus className="w-4 h-4 mr-2" />
          New Thread
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {categoryOptions.map(c => (
          <Button
            key={c.id || "all"}
            size="sm"
            variant={
              selectedCategory === c.id || (!selectedCategory && !c.id) ? "default" : "outline"
            }
            onClick={() => setSelectedCategory(c.id || null)}
          >
            {c.category_name}
          </Button>
        ))}
      </div>

      {showNewThreadForm && (
        <Card className="glass-card border-border/50">
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              {categories.map(c => (
                <Button
                  key={c.id}
                  size="sm"
                  variant={newThread.category_id === c.id ? "default" : "outline"}
                  onClick={() => setNewThread({ ...newThread, category_id: c.id })}
                >
                  {c.category_name}
                </Button>
              ))}
            </div>
            <Input
              placeholder="Thread title"
              value={newThread.title}
              onChange={e => setNewThread({ ...newThread, title: e.target.value })}
            />
            <Textarea
              placeholder="Thread content"
              value={newThread.content}
              onChange={e => setNewThread({ ...newThread, content: e.target.value })}
              rows={6}
            />
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={newThread.is_anonymous}
                  onChange={e => setNewThread({ ...newThread, is_anonymous: e.target.checked })}
                  aria-label="Post anonymously"
                />
                Post anonymously
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={newThread.is_qa_thread}
                  onChange={e => setNewThread({ ...newThread, is_qa_thread: e.target.checked })}
                  aria-label="Mark as Q&A thread"
                />
                This is a Q&amp;A thread
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={newThread.is_success_story}
                  onChange={e => setNewThread({ ...newThread, is_success_story: e.target.checked })}
                  aria-label="Mark as success story"
                />
                This is a success story
              </label>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateThread} className="flex-1" disabled={loading}>
                Create Thread
              </Button>
              <Button variant="outline" onClick={() => setShowNewThreadForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
          </div>
        ) : filteredThreads.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No threads found</div>
        ) : (
          filteredThreads.map(thread => (
            <button
              key={thread.id}
              type="button"
              className="w-full text-left"
              onClick={() => void handleLoadThread(thread)}
              aria-label={`Open thread ${incognito ? "Private thread" : thread.title}`}
            >
              <Card className="glass-card border-border/50 hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">
                          {incognito ? "Private Thread" : thread.title}
                        </h3>
                        {thread.is_pinned && <Pin className="w-4 h-4 text-yellow-500" />}
                        {thread.is_qa_thread && <Badge variant="secondary">Q&amp;A</Badge>}
                        {thread.is_success_story && <Badge variant="default">Success</Badge>}
                        {thread.is_locked && <Lock className="w-4 h-4 text-muted-foreground" />}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {incognito ? "Preview hidden in incognito mode." : thread.content}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          {thread.is_anonymous
                            ? "Anonymous"
                            : `User ${thread.user_id?.substring(0, 8)}`}
                        </span>
                        {!incognito ? (
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {thread.view_count}
                          </span>
                        ) : null}
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
            </button>
          ))
        )}
      </div>
    </div>
  );
}
