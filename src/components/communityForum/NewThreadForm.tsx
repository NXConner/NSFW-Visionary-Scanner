import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ForumCategory } from "@/lib/communityForum";

export function NewThreadForm(props: {
  loading: boolean;
  categories: ForumCategory[];
  value: {
    category_id: string;
    title: string;
    content: string;
    is_anonymous: boolean;
    is_success_story: boolean;
  };
  onChange: (next: {
    category_id: string;
    title: string;
    content: string;
    is_anonymous: boolean;
    is_success_story: boolean;
  }) => void;
  onSubmit: () => void;
}) {
  const v = props.value;
  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle>Create New Thread</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block" htmlFor="new-thread-category">
            Category
          </label>
          <select
            id="new-thread-category"
            value={v.category_id}
            onChange={e => props.onChange({ ...v, category_id: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2"
          >
            <option value="">Select a category</option>
            {props.categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block" htmlFor="new-thread-title">
            Title
          </label>
          <Input
            id="new-thread-title"
            value={v.title}
            onChange={e => props.onChange({ ...v, title: e.target.value })}
            placeholder="Enter thread title..."
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block" htmlFor="new-thread-content">
            Content
          </label>
          <Textarea
            id="new-thread-content"
            value={v.content}
            onChange={e => props.onChange({ ...v, content: e.target.value })}
            placeholder="Write your post..."
            rows={8}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={v.is_anonymous}
                onChange={e => props.onChange({ ...v, is_anonymous: e.target.checked })}
                aria-label="Post anonymously"
              />
              Post anonymously
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={v.is_success_story}
                onChange={e => props.onChange({ ...v, is_success_story: e.target.checked })}
                aria-label="Mark as success story"
              />
              This is a success story
            </label>
          </div>
          <Button onClick={props.onSubmit} disabled={props.loading} variant="gradient">
            {props.loading ? "Creating..." : "Create Thread"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
