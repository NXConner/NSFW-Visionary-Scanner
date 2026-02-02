import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Clock, Eye, MessageSquare, Pin, Search, ThumbsUp } from "lucide-react";

import type { ForumCategory, ForumThread } from "@/lib/communityForum";

export function ThreadsList(props: {
  loading: boolean;
  categories: ForumCategory[];
  selectedCategory: string | null;
  onSelectCategory: (id: string | null) => void;
  threads: ForumThread[];
  searchQuery: string;
  onSearchQuery: (q: string) => void;
  onLoadThread: (id: string) => void;
  onSearchNow: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button
          variant={props.selectedCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => props.onSelectCategory(null)}
        >
          All
        </Button>
        {props.categories.map(cat => (
          <Button
            key={cat.id}
            variant={props.selectedCategory === cat.id ? "default" : "outline"}
            size="sm"
            onClick={() => props.onSelectCategory(cat.id!)}
          >
            {cat.name}
          </Button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search threads..."
          value={props.searchQuery}
          onChange={e => {
            props.onSearchQuery(e.target.value);
            if (e.target.value) props.onSearchNow();
          }}
          className="pl-10"
        />
      </div>

      {props.loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : props.threads.length > 0 ? (
        <div className="space-y-4">
          {props.threads.map(thread => (
            <Card
              key={thread.id}
              variant="glass"
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => props.onLoadThread(thread.id!)}
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
                          : thread.created_at
                            ? new Date(thread.created_at).toLocaleDateString()
                            : ""}
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
    </div>
  );
}
