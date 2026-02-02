import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  createVideoPlaylist,
  deleteVideoPlaylist,
  getNSFWVideos,
  getPlaylistVideos,
  getVideoPlaylists,
  updateVideoPlaylist,
  type NSFWVideoContent,
  type NSFWVideoPlaylist,
} from "@/lib/nsfwVideoContent";
import { toast } from "sonner";
import { Clock, Eye, Loader2, Play, Plus, Settings, Trash2 } from "lucide-react";

export type PlaylistsTabProps = {
  onPlayVideo: (videoId: string) => void;
};

function formatDuration(seconds: number | null): string {
  if (seconds == null) return "";
  const mins = Math.floor(seconds / 60);
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hrs > 0) return `${hrs}h ${remMins}m`;
  return `${mins}m`;
}

export function PlaylistsTab(props: PlaylistsTabProps): JSX.Element {
  const { onPlayVideo } = props;

  const [loading, setLoading] = useState(false);
  const [scope, setScope] = useState<"mine" | "public">("mine");
  const [playlists, setPlaylists] = useState<NSFWVideoPlaylist[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPublic, setNewPublic] = useState(false);
  const [newShuffle, setNewShuffle] = useState(false);
  const [newAutoplay, setNewAutoplay] = useState(true);

  const [manageOpen, setManageOpen] = useState(false);
  const [managePlaylist, setManagePlaylist] = useState<NSFWVideoPlaylist | null>(null);
  const [allVideos, setAllVideos] = useState<NSFWVideoContent[]>([]);
  const [videoQuery, setVideoQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const list = await getVideoPlaylists({ scope });
      setPlaylists(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  const openManage = async (p: NSFWVideoPlaylist) => {
    setManagePlaylist(p);
    setSelectedIds(new Set((p.video_ids || []).map(String)));
    setVideoQuery("");
    setManageOpen(true);

    if (allVideos.length === 0) {
      const vids = await getNSFWVideos();
      setAllVideos(vids);
    }
  };

  const filteredVideos = useMemo(() => {
    const q = videoQuery.trim().toLowerCase();
    if (!q) return allVideos;
    return allVideos.filter(
      v => v.title.toLowerCase().includes(q) || v.description.toLowerCase().includes(q),
    );
  }, [allVideos, videoQuery]);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) {
      toast.error("Please enter a playlist name");
      return;
    }

    setSaving(true);
    try {
      const created = await createVideoPlaylist(name, [], newDesc.trim() || undefined, newPublic);
      if (!created) {
        toast.error("Failed to create playlist");
        return;
      }
      await updateVideoPlaylist(created.id, {
        shuffle_enabled: newShuffle,
        auto_play_next: newAutoplay,
      });

      setCreateOpen(false);
      setNewName("");
      setNewDesc("");
      setNewPublic(false);
      setNewShuffle(false);
      setNewAutoplay(true);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleSaveManage = async () => {
    if (!managePlaylist) return;
    setSaving(true);
    try {
      const ids = Array.from(selectedIds);
      const updated = await updateVideoPlaylist(managePlaylist.id, { video_ids: ids });
      if (!updated) {
        toast.error("Failed to update playlist");
        return;
      }
      setManagePlaylist(updated);
      await load();
      toast.success("Playlist updated");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (playlistId: string) => {
    setSaving(true);
    try {
      const ok = await deleteVideoPlaylist(playlistId);
      if (ok) await load();
    } finally {
      setSaving(false);
    }
  };

  const handlePlayPlaylist = async (p: NSFWVideoPlaylist) => {
    const first = (p.video_ids || [])[0];
    if (!first) {
      toast.error("Playlist is empty");
      return;
    }
    onPlayVideo(String(first));
  };

  const handleViewVideos = async (p: NSFWVideoPlaylist) => {
    setSaving(true);
    try {
      const vids = await getPlaylistVideos(p);
      if (vids.length === 0) {
        toast.info("No videos in this playlist yet");
        return;
      }
      // Play the first video as a simple way to start.
      onPlayVideo(vids[0]!.id);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant={scope === "mine" ? "default" : "outline"}
            size="sm"
            onClick={() => setScope("mine")}
          >
            My playlists
          </Button>
          <Button
            variant={scope === "public" ? "default" : "outline"}
            size="sm"
            onClick={() => setScope("public")}
          >
            Public
          </Button>
        </div>

        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Playlist
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
        </div>
      ) : playlists.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No playlists yet</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {playlists.map(p => (
            <Card key={p.id} className="glass-card border-border/50">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold truncate">{p.playlist_name}</h4>
                      {p.is_public && <Badge variant="secondary">Public</Badge>}
                      {p.is_curated && <Badge>Curated</Badge>}
                    </div>
                    {p.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {p.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(p.total_duration_seconds)}
                      </span>
                      <span>Videos: {p.video_count ?? p.video_ids?.length ?? 0}</span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {p.view_count}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="outline" onClick={() => void handlePlayPlaylist(p)}>
                      <Play className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => void openManage(p)}>
                      <Settings className="w-4 h-4" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={saving}
                          aria-label="Delete playlist"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete playlist?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the playlist. This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => void handleDelete(p.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void handleViewVideos(p)}
                    className="flex-1"
                  >
                    View & play
                  </Button>
                  <Button size="sm" onClick={() => void openManage(p)} className="flex-1">
                    Manage videos
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create playlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="text-sm font-medium">Name</div>
              <Input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="My playlist"
              />
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Description</div>
              <Input
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="Optional"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Public</div>
                <div className="text-xs text-muted-foreground">
                  Allow others to discover this playlist
                </div>
              </div>
              <Switch checked={newPublic} onCheckedChange={setNewPublic} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Shuffle</div>
                <div className="text-xs text-muted-foreground">Randomize playback order</div>
              </div>
              <Switch checked={newShuffle} onCheckedChange={setNewShuffle} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Auto play next</div>
                <div className="text-xs text-muted-foreground">
                  Continue to next item automatically
                </div>
              </div>
              <Switch checked={newAutoplay} onCheckedChange={setNewAutoplay} />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setCreateOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button className="flex-1" onClick={() => void handleCreate()} disabled={saving}>
                {saving ? "Saving..." : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={manageOpen} onOpenChange={o => !o && setManageOpen(false)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Manage playlist</DialogTitle>
          </DialogHeader>

          {managePlaylist ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium truncate">{managePlaylist.playlist_name}</div>
                  <div className="text-xs text-muted-foreground">Select videos to include</div>
                </div>
                <Badge variant="secondary">{selectedIds.size} selected</Badge>
              </div>

              <Input
                value={videoQuery}
                onChange={e => setVideoQuery(e.target.value)}
                placeholder="Search videos..."
              />

              <div className="max-h-[50vh] overflow-auto rounded border">
                <div className="p-2 space-y-2">
                  {filteredVideos.map(v => {
                    const checked = selectedIds.has(v.id);
                    return (
                      <div
                        key={v.id}
                        className="flex items-start gap-3 p-2 rounded hover:bg-muted/50"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={val => {
                            const next = new Set(selectedIds);
                            const isChecked = Boolean(val);
                            if (isChecked) next.add(v.id);
                            else next.delete(v.id);
                            setSelectedIds(next);
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{v.title}</div>
                          <div className="text-xs text-muted-foreground line-clamp-2">
                            {v.description}
                          </div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => onPlayVideo(v.id)}>
                          <Play className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setManageOpen(false)}
                  disabled={saving}
                >
                  Close
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => void handleSaveManage()}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
