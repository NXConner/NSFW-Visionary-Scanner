import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { BrowseTab } from "@/components/nsfwVideoContent/tabs/BrowseTab";
import type { NSFWVideoContent } from "@/lib/nsfwVideoContent";
import type { VideoQuality } from "@/lib/offlineMedia/videoCache";

const makeVideo = (overrides: Partial<NSFWVideoContent>): NSFWVideoContent => ({
  id: "vid-1",
  title: "Alpha Guide",
  description: "Alpha description",
  category: "tutorial",
  video_url_sd: null,
  video_url_hd: null,
  video_url_2k: null,
  video_url_4k: null,
  video_duration_seconds: 120,
  thumbnail_url: null,
  preview_gif_url: null,
  tags: [],
  difficulty_level: null,
  content_rating: null,
  expert_id: null,
  expert_name: null,
  expert_credentials: null,
  step_by_step_guide: {},
  key_points: [],
  warnings: [],
  prerequisites: [],
  view_count: 10,
  like_count: 2,
  favorite_count: 1,
  share_count: 0,
  average_rating: 4.5,
  rating_count: 2,
  is_premium: false,
  is_featured: false,
  requires_dlc: false,
  dlc_pack_id: null,
  is_approved: true,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

const baseProps = (overrides?: Partial<React.ComponentProps<typeof BrowseTab>>) => ({
  loading: false,
  videos: [makeVideo({})],
  searchQuery: "",
  setSearchQuery: vi.fn(),
  selectedCategory: "all",
  setSelectedCategory: vi.fn(),
  selectedDifficulty: "all",
  setSelectedDifficulty: vi.fn(),
  selectedRating: "all",
  setSelectedRating: vi.fn(),
  categories: [{ id: "all", label: "All" }],
  difficultyLevels: [{ id: "all", label: "All" }],
  ratingLevels: [{ id: "all", label: "All" }],
  downloadQuality: "hd" as VideoQuality,
  setDownloadQuality: vi.fn(),
  downloadProgress: {},
  bookmarkedIds: new Set<string>(),
  onToggleBookmark: vi.fn(),
  onPlay: vi.fn(),
  onDownload: vi.fn(),
  privacy: {
    incognitoMode: false,
    blurThumbnails: false,
    hideTitles: false,
  },
  ...overrides,
});

describe("BrowseTab", () => {
  it("filters videos by search query", () => {
    const videos = [
      makeVideo({ id: "vid-1", title: "Alpha Guide", description: "Alpha" }),
      makeVideo({ id: "vid-2", title: "Beta Guide", description: "Beta" }),
    ];

    render(
      <BrowseTab
        {...baseProps({
          videos,
          searchQuery: "beta",
        })}
      />,
    );

    expect(screen.getByText("Beta Guide")).toBeInTheDocument();
    expect(screen.queryByText("Alpha Guide")).not.toBeInTheDocument();
  });

  it("toggles bookmarks when the bookmark button is clicked", async () => {
    const onToggleBookmark = vi.fn();
    const user = userEvent.setup();

    render(
      <BrowseTab
        {...baseProps({
          onToggleBookmark,
          bookmarkedIds: new Set<string>(),
        })}
      />,
    );

    const button = screen.getByRole("button", { name: "Bookmark video" });
    await user.click(button);

    expect(onToggleBookmark).toHaveBeenCalledWith("vid-1", true);
  });
});
