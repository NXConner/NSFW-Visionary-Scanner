import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MessageSquare, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import {
  createForumPost,
  createForumThread,
  getForumCategories,
  getForumThread,
  getForumThreads,
  getUserReputation,
  interactWithContent,
  searchForumThreads,
  type ForumCategory,
  type ForumPost,
  type ForumThread,
  type UserReputation,
} from "@/lib/communityForum";

import { NewThreadForm } from "./NewThreadForm";
import { ThreadDetail } from "./ThreadDetail";
import { ThreadsList } from "./ThreadsList";

export const CommunityForum = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("threads");
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<ForumThread | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [userReputation, setUserReputation] = useState<UserReputation | null>(null);

  const [newThread, setNewThread] = useState({
    category_id: "",
    title: "",
    content: "",
    is_anonymous: false,
    is_success_story: false,
  });

  const [newPost, setNewPost] = useState({
    content: "",
    is_anonymous: false,
  });

  useEffect(() => {
    void loadCategories();
    if (user) void loadUserReputation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (selectedCategory || activeTab === "threads") {
      void loadThreads();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, activeTab]);

  const loadCategories = async () => {
    try {
      const data = await getForumCategories();
      setCategories(data);
      if (data.length > 0 && !selectedCategory) setSelectedCategory(data[0].id!);
    } catch {
      toast.error("Failed to load categories");
    }
  };

  const loadThreads = async () => {
    setLoading(true);
    try {
      if (searchQuery) {
        const results = await searchForumThreads(searchQuery, selectedCategory || undefined);
        setThreads(results);
      } else {
        const data = await getForumThreads(selectedCategory || undefined);
        setThreads(data);
      }
    } catch {
      toast.error("Failed to load threads");
    } finally {
      setLoading(false);
    }
  };

  const loadThread = async (threadId: string) => {
    setLoading(true);
    try {
      const { thread, posts: threadPosts } = await getForumThread(threadId);
      if (thread) {
        setSelectedThread(thread);
        setPosts(threadPosts);
      }
    } catch {
      toast.error("Failed to load thread");
    } finally {
      setLoading(false);
    }
  };

  const loadUserReputation = async () => {
    try {
      const reputation = await getUserReputation();
      setUserReputation(reputation);
    } catch {
      // silent
    }
  };

  const handleCreateThread = async () => {
    if (!newThread.title || !newThread.content || !newThread.category_id) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      await createForumThread(newThread);
      toast.success("Thread created!");
      setNewThread({
        category_id: "",
        title: "",
        content: "",
        is_anonymous: false,
        is_success_story: false,
      });
      setActiveTab("threads");
      await loadThreads();
    } catch {
      toast.error("Failed to create thread");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.content || !selectedThread) {
      toast.error("Please enter a reply");
      return;
    }

    setLoading(true);
    try {
      await createForumPost({
        thread_id: selectedThread.id!,
        content: newPost.content,
        is_anonymous: newPost.is_anonymous,
      });
      toast.success("Reply posted!");
      setNewPost({ content: "", is_anonymous: false });
      await loadThread(selectedThread.id!);
    } catch {
      toast.error("Failed to post reply");
    } finally {
      setLoading(false);
    }
  };

  const handleInteract = async (
    contentType: "thread" | "post",
    contentId: string,
    type: "like" | "helpful",
  ) => {
    try {
      await interactWithContent(contentType, contentId, type);
      if (selectedThread) await loadThread(selectedThread.id!);
      else await loadThreads();
    } catch {
      toast.error("Failed to update interaction");
    }
  };

  if (selectedThread) {
    return (
      <ThreadDetail
        thread={selectedThread}
        posts={posts}
        loading={loading}
        newPost={newPost}
        setNewPost={setNewPost}
        onBack={() => {
          setSelectedThread(null);
          setPosts([]);
        }}
        onInteract={handleInteract}
        onCreatePost={handleCreatePost}
      />
    );
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
            <Badge variant="outline">Level {userReputation.level || 1}</Badge>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="threads">Threads</TabsTrigger>
          <TabsTrigger value="new">New Thread</TabsTrigger>
        </TabsList>

        <TabsContent value="threads" className="space-y-6">
          <ThreadsList
            loading={loading}
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={id => setSelectedCategory(id)}
            threads={threads}
            searchQuery={searchQuery}
            onSearchQuery={setSearchQuery}
            onSearchNow={() => void loadThreads()}
            onLoadThread={id => void loadThread(id)}
          />
        </TabsContent>

        <TabsContent value="new">
          <NewThreadForm
            loading={loading}
            categories={categories}
            value={newThread}
            onChange={setNewThread}
            onSubmit={handleCreateThread}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CommunityForum;
