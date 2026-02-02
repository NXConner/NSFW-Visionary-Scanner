import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import {
  createNSFWSupportGroup,
  getNSFWSupportGroups,
  joinNSFWSupportGroup,
  type NSFWSupportGroup,
} from "@/lib/nsfwCommunityForum";

type NewGroupState = { group_name: string; description: string; category: string };

export function SupportGroupsTab({ isActive }: { isActive: boolean }): JSX.Element {
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<NSFWSupportGroup[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newGroup, setNewGroup] = useState<NewGroupState>({
    group_name: "",
    description: "",
    category: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getNSFWSupportGroups();
      setGroups(data);
    } catch {
      toast.error("Failed to load support groups");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isActive) return;
    void load();
  }, [isActive, load]);

  const canCreate = useMemo(
    () => Boolean(newGroup.group_name.trim() && newGroup.description.trim()),
    [newGroup],
  );

  const create = useCallback(async () => {
    if (!canCreate) {
      toast.error("Please enter group name and description");
      return;
    }
    setLoading(true);
    try {
      const created = await createNSFWSupportGroup(
        newGroup.group_name.trim(),
        newGroup.description.trim(),
        newGroup.category || undefined,
      );
      if (created) {
        setShowCreate(false);
        setNewGroup({ group_name: "", description: "", category: "" });
        await load();
      }
    } finally {
      setLoading(false);
    }
  }, [canCreate, load, newGroup.category, newGroup.description, newGroup.group_name]);

  const join = useCallback(
    async (groupId: string) => {
      setLoading(true);
      try {
        const joined = await joinNSFWSupportGroup(groupId);
        if (joined) await load();
      } finally {
        setLoading(false);
      }
    },
    [load],
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Support Groups
        </h3>
        <Button size="sm" onClick={() => setShowCreate(v => !v)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Group
        </Button>
      </div>

      {showCreate && (
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Create Support Group</CardTitle>
            <CardDescription>
              Groups are visible based on your access and membership.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Group name"
              value={newGroup.group_name}
              onChange={e => setNewGroup(g => ({ ...g, group_name: e.target.value }))}
            />
            <Textarea
              placeholder="Description"
              value={newGroup.description}
              onChange={e => setNewGroup(g => ({ ...g, description: e.target.value }))}
              rows={4}
            />
            <Input
              placeholder="Category (optional)"
              value={newGroup.category}
              onChange={e => setNewGroup(g => ({ ...g, category: e.target.value }))}
            />
            <div className="flex gap-2">
              <Button onClick={create} disabled={!canCreate || loading} className="flex-1">
                Create
              </Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && groups.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No groups available yet</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map(g => (
            <Card key={g.id} className="glass-card border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-base">{g.group_name}</CardTitle>
                  <Badge variant={g.is_private ? "secondary" : "outline"}>
                    {g.is_private ? "Private" : "Open"}
                  </Badge>
                </div>
                {g.description && <CardDescription>{g.description}</CardDescription>}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{g.member_count} members</span>
                  {g.category && <span>{g.category}</span>}
                </div>
                <Button className="w-full" onClick={() => void join(g.id)} disabled={loading}>
                  Join Group
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
