import { ExternalLink, Video } from "lucide-react";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ParsedEmbed =
  | { ok: true; embedSrc: string; provider: "youtube" | "vimeo" | "direct"; canonicalUrl: string }
  | { ok: false; reason: string };

function safeParseEmbed(urlRaw: string): ParsedEmbed {
  const raw = urlRaw.trim();
  if (!raw) return { ok: false, reason: "Paste a video URL to preview it." };

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, reason: "That doesn’t look like a valid URL." };
  }

  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  const protocol = url.protocol.toLowerCase();
  if (protocol !== "https:" && protocol !== "http:") {
    return { ok: false, reason: "Only http/https URLs are supported." };
  }

  // YouTube
  if (host === "youtube.com" || host === "m.youtube.com") {
    const v = url.searchParams.get("v");
    if (!v) return { ok: false, reason: "Missing YouTube video id (v=...)." };
    const embedSrc = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(v)}`;
    const canonicalUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(v)}`;
    return { ok: true, embedSrc, provider: "youtube", canonicalUrl };
  }

  // youtu.be short links
  if (host === "youtu.be") {
    const id = url.pathname.replace(/^\/+/, "").split("/")[0];
    if (!id) return { ok: false, reason: "Missing YouTube video id in path." };
    const embedSrc = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`;
    const canonicalUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;
    return { ok: true, embedSrc, provider: "youtube", canonicalUrl };
  }

  // Vimeo
  if (host === "vimeo.com") {
    const id = url.pathname.replace(/^\/+/, "").split("/")[0];
    if (!id || !/^\d+$/.test(id)) return { ok: false, reason: "Unsupported Vimeo URL format." };
    const embedSrc = `https://player.vimeo.com/video/${encodeURIComponent(id)}`;
    return { ok: true, embedSrc, provider: "vimeo", canonicalUrl: `https://vimeo.com/${id}` };
  }

  // Direct embeddable URL (already an embed page)
  if (
    raw.includes("/embed/") ||
    host.endsWith("youtube-nocookie.com") ||
    host.startsWith("player.")
  ) {
    return { ok: true, embedSrc: raw, provider: "direct", canonicalUrl: raw };
  }

  return {
    ok: false,
    reason:
      "Unsupported provider. Try a YouTube or Vimeo link (or a direct embeddable /embed/ URL).",
  };
}

export function VideoEmbed({
  title = "Video demo (paste a URL)",
  description = "Paste a YouTube/Vimeo link to watch a technique demonstration. Choose clinician-led, non-explicit educational content.",
  url,
  onChangeUrl,
  className,
}: {
  title?: string;
  description?: string;
  url: string;
  onChangeUrl: (next: string) => void;
  className?: string;
}) {
  const parsed = useMemo(() => safeParseEmbed(url), [url]);

  return (
    <Card className={cn("glass-morphism", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={url}
            onChange={e => onChangeUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            inputMode="url"
            aria-label="Video URL"
          />
          {parsed.ok ? (
            <Button asChild variant="outline" className="gap-2">
              <a href={parsed.canonicalUrl} target="_blank" rel="noopener noreferrer">
                Open
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          ) : (
            <Button type="button" variant="outline" disabled className="gap-2">
              Open
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
        </div>

        {!parsed.ok ? (
          <p className="text-sm text-muted-foreground">
            {"reason" in parsed ? parsed.reason : "Invalid URL"}
          </p>
        ) : (
          <div className="aspect-video rounded-lg overflow-hidden bg-secondary border border-border/50">
            <iframe
              title={title}
              src={parsed.embedSrc}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
