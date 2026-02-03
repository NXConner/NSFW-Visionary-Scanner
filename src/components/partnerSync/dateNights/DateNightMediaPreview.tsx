import { Badge } from "@/components/ui/badge";
import type { IntimateDateProposal } from "@/lib/nsfwAdvancedFeatures";

type DateNightMediaPreviewProps = {
  proposal: IntimateDateProposal;
};

function isHttpUrl(value: string | null | undefined): boolean {
  return /^https?:\/\//i.test(String(value || ""));
}

export function DateNightMediaPreview({ proposal }: DateNightMediaPreviewProps): JSX.Element | null {
  const images = proposal.images_urls ?? [];
  const gifs = proposal.gifs_urls ?? [];
  const videos = proposal.videos_urls ?? [];
  const links = proposal.links ?? [];
  const emojis = proposal.adult_emojis ?? [];
  const voiceUrl = proposal.voice_message_url;

  const hasMedia =
    images.length || gifs.length || videos.length || links.length || emojis.length || voiceUrl;
  if (!hasMedia) return null;

  return (
    <div className="space-y-2">
      {voiceUrl && isHttpUrl(voiceUrl) && (
        <audio controls src={voiceUrl} className="w-full" />
      )}
      {voiceUrl && !isHttpUrl(voiceUrl) && (
        <div className="text-xs text-muted-foreground">Voice message attached.</div>
      )}

      {(images.length > 0 || gifs.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {images.slice(0, 4).map(url => (
            <a key={url} href={url} target="_blank" rel="noreferrer" aria-label="Open image in new tab">
              <img src={url} alt="Image" className="h-16 w-16 object-cover rounded border" />
            </a>
          ))}
          {gifs.slice(0, 4).map(url => (
            <a key={url} href={url} target="_blank" rel="noreferrer" aria-label="Open GIF in new tab">
              <img src={url} alt="GIF" className="h-16 w-16 object-cover rounded border" />
            </a>
          ))}
        </div>
      )}

      {videos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {videos.slice(0, 3).map(url => (
            <a key={url} href={url} target="_blank" rel="noreferrer" aria-label="Open video in new tab">
              <Badge variant="outline">Video</Badge>
            </a>
          ))}
        </div>
      )}

      {links.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {links.slice(0, 3).map(url => (
            <a key={url} href={url} target="_blank" rel="noreferrer" aria-label="Open link in new tab">
              <Badge variant="secondary">Link</Badge>
            </a>
          ))}
        </div>
      )}

      {emojis.length > 0 && (
        <div className="text-sm text-muted-foreground">Emojis: {emojis.slice(0, 8).join(" ")}</div>
      )}
    </div>
  );
}
