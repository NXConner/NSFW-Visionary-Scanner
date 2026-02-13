import { useCallback, useEffect, useMemo, useState } from "react";
import { fromExtended } from "@/lib/supabaseExtensions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

type TopicRow = {
  topic_id: string;
  display_name: string;
  description: string | null;
  requires_feature_id: string;
  is_active: boolean;
  content_rating: string;
};

type ItemRow = {
  id: string;
  title: string;
  topic_id: string;
  requires_feature_id: string;
  is_active: boolean;
  content_rating: string;
};

export function NsfwTopicLibraryAdminPanel(): JSX.Element {
  const [topics, setTopics] = useState<TopicRow[]>([]);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [topicsRes, itemsRes] = await Promise.all([
        fromExtended("nsfw_topics")
          .select("topic_id,display_name,description,requires_feature_id,is_active,content_rating")
          .order("sort_order", { ascending: true }),
        fromExtended("nsfw_topic_library_items")
          .select("id,title,topic_id,requires_feature_id,is_active,content_rating")
          .order("updated_at", { ascending: false })
          .limit(200),
      ]);

      if (topicsRes.error) throw new Error(topicsRes.error.message);
      if (itemsRes.error) throw new Error(itemsRes.error.message);
      setTopics((topicsRes.data || []) as TopicRow[]);
      setItems((itemsRes.data || []) as ItemRow[]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load topics library");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(item => item.title.toLowerCase().includes(q));
  }, [items, query]);

  const updateTopic = async (topicId: string, patch: Partial<TopicRow>) => {
    try {
      const { error } = await fromExtended("nsfw_topics").update(patch).eq("topic_id", topicId);
      if (error) throw new Error(error.message);
      setTopics(prev => prev.map(t => (t.topic_id === topicId ? { ...t, ...patch } : t)));
      toast.success("Updated topic");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  };

  const updateItem = async (id: string, patch: Partial<ItemRow>) => {
    try {
      const { error } = await fromExtended("nsfw_topic_library_items")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw new Error(error.message);
      setItems(prev => prev.map(i => (i.id === id ? { ...i, ...patch } : i)));
      toast.success("Updated item");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  };

  return (
    <Card className="glass-card border-border/50">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <CardTitle>Topics Library</CardTitle>
        <div className="flex flex-col md:flex-row gap-2 md:items-center">
          <Input
            placeholder="Search items"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : (
          <Tabs defaultValue="topics" className="space-y-4">
            <TabsList>
              <TabsTrigger value="topics">Topics</TabsTrigger>
              <TabsTrigger value="items">Library Items</TabsTrigger>
            </TabsList>
            <TabsContent value="topics">
              {topics.length === 0 ? (
                <div className="text-sm text-muted-foreground">No topics found.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Topic</TableHead>
                      <TableHead>Feature</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Active</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topics.map(topic => (
                      <TableRow key={topic.topic_id}>
                        <TableCell>
                          <div className="font-medium">{topic.display_name}</div>
                          <div className="text-xs text-muted-foreground">{topic.topic_id}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{topic.requires_feature_id}</Badge>
                        </TableCell>
                        <TableCell>{topic.content_rating}</TableCell>
                        <TableCell>
                          <Switch
                            checked={topic.is_active}
                            onCheckedChange={v =>
                              void updateTopic(topic.topic_id, { is_active: v })
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
            <TabsContent value="items">
              {filteredItems.length === 0 ? (
                <div className="text-sm text-muted-foreground">No items found.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Topic</TableHead>
                      <TableHead>Feature</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Active</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-medium">{item.title}</div>
                          <div className="text-xs text-muted-foreground">{item.id}</div>
                        </TableCell>
                        <TableCell>{item.topic_id}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{item.requires_feature_id}</Badge>
                        </TableCell>
                        <TableCell>{item.content_rating}</TableCell>
                        <TableCell>
                          <Switch
                            checked={item.is_active}
                            onCheckedChange={v => void updateItem(item.id, { is_active: v })}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
