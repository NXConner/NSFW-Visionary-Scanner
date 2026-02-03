import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Eye, HelpCircle, Lock, MessageSquare, Pin, ThumbsUp } from "lucide-react";

import type { ForumPost, ForumThread } from "@/lib/communityForum";

export function ThreadDetail(props: {
  thread: ForumThread;
  posts: ForumPost[];
  loading: boolean;
  newPost: { content: string; is_anonymous: boolean };
  setNewPost: (next: { content: string; is_anonymous: boolean }) => void;
  onBack: () => void;
  onInteract: (contentType: "thread" | "post", contentId: string, type: "like" | "helpful") => void;
  onCreatePost: () => void;
}) {
  const t = props.thread;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={props.onBack}>
        ← Back to Threads
      </Button>

      <Card variant="glass">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {t.is_pinned && <Pin className="w-4 h-4 text-primary" />}
                {t.is_locked && <Lock className="w-4 h-4 text-muted-foreground" />}
                <CardTitle className="text-2xl">{t.title}</CardTitle>
              </div>
              <div className="flex gap-2">
                {t.is_success_story && <Badge className="bg-green-500">Success Story</Badge>}
                {t.is_expert_qa && <Badge className="bg-blue-500">Expert Q&A</Badge>}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose prose-invert max-w-none mb-6 whitespace-pre-wrap">{t.content}</div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground pt-4 border-t">
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {t.view_count || 0} views
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              {t.reply_count || 0} replies
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {t.created_at ? new Date(t.created_at).toLocaleDateString() : ""}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Replies ({props.posts.length})</h3>
        {props.posts.map(post => (
          <Card key={post.id} variant="glass">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="prose prose-invert max-w-none whitespace-pre-wrap">
                  {post.content}
                </div>
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {post.is_expert_answer && <Badge className="bg-blue-500">Expert Answer</Badge>}
                    <span>
                      {post.created_at ? new Date(post.created_at).toLocaleDateString() : ""}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => props.onInteract("post", post.id!, "like")}
                    >
                      <ThumbsUp className="w-4 h-4 mr-1" />
                      {post.like_count || 0}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => props.onInteract("post", post.id!, "helpful")}
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

      {!t.is_locked && (
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Post a Reply</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Write your reply..."
              value={props.newPost.content}
              onChange={e => props.setNewPost({ ...props.newPost, content: e.target.value })}
              rows={6}
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={props.newPost.is_anonymous}
                  onChange={e =>
                    props.setNewPost({ ...props.newPost, is_anonymous: e.target.checked })
                  }
                  aria-label="Post anonymously"
                />
                Post anonymously
              </label>
              <Button
                onClick={props.onCreatePost}
                disabled={props.loading || !props.newPost.content}
              >
                {props.loading ? "Posting..." : "Post Reply"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
