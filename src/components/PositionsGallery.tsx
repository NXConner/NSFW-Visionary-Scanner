import { useCallback, useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  Shuffle,
  Heart,
  Star,
  Filter,
  Grid,
  List,
  Flame,
  Sparkles,
  Users,
  Zap,
  Info,
  Lock,
  Image as ImageIcon,
  Video,
  Loader2,
  Moon,
  Sun,
  Shield,
} from "lucide-react";
import { useGenericStorage } from "@/hooks/useGenericStorage";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";
import { isAnySuperAdminPersisted } from "@/lib/superAdmin";
import { PositionDetailView } from "@/components/PositionDetailView";
import { AgeVerificationModal } from "@/dlc/components/AgeVerificationModal";
import { Link } from "react-router-dom";
import { useDLC, useDLCFeature } from "@/dlc/context/DLCContext";

// CRITICAL: Module-level cached super admin check - runs ONCE at import time
// This ensures privileged status is known BEFORE any component renders
const INITIAL_SUPER_ADMIN_STATUS = isAnySuperAdminPersisted();
import {
  fetchMyPositionMediaOverrides,
  type UserPositionMediaOverridesMap,
} from "@/lib/positions/userPositionMediaOverrides";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceId, getDevicePlatform } from "@/dlc/core/device";
import type { Position, DbPositionRow } from "@/components/positionsGallery/model";
import {
  defaultBenefits,
  defaultInstructions,
  defaultTips,
  deriveStimulation,
  mapDifficulty,
  mapFlexibility,
  mapIntimacy,
  splitInstructions,
} from "@/components/positionsGallery/model";
import {
  fetchPositionById,
  fetchPositionCategories,
  fetchPositionsPage,
} from "@/components/positionsGallery/db";
import { isHttpUrl, signAssetPaths } from "@/components/positionsGallery/privateAssets";
import { PositionCard } from "@/components/positionsGallery/PositionCard";
import {
  findNsfwFallbackPositionById,
  getNsfwFallbackCategories,
  getNsfwFallbackPositions,
} from "@/components/positionsGallery/nsfwFallback";

// (types + mapping helpers live in `src/components/positionsGallery/*` to keep this file < 500 lines)

function toLabel(categoryId: string): string {
  return String(categoryId)
    .split(/[-_]+/g)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function categoryIcon(categoryId: string) {
  const c = String(categoryId).toLowerCase();
  if (c.includes("rom")) return Heart;
  if (c.includes("tan")) return Sparkles;
  if (c.includes("stand")) return Zap;
  if (c.includes("sit")) return Users;
  if (c.includes("classic")) return Star;
  if (c.includes("floor")) return Grid;
  return Flame;
}

export const PositionsGallery = ({
  initialPositionId,
}: {
  initialPositionId?: string;
}): JSX.Element => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [favorites, setFavorites] = useGenericStorage<string[]>("favorite_positions", []);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [invertedColors, setInvertedColors] = useState(true);
  const { hasFeature, loading: featureLoading } = useFeatureAccess();
  const {
    isSuperAdmin,
    hasFullAccess,
    allFeaturesUnlocked,
    loading: authLoading,
    rolesLoading,
  } = useAuth();
  const { isAdmin, isSuperAdmin: isSuperAdminRole } = useUserRoles();
  const [showAgeModal, setShowAgeModal] = useState(false);
  const { isAgeVerified } = useDLC();
  const { isAvailable: hasPositionsDlc, isLoading: dlcLoading } =
    useDLCFeature("positions_gallery");
  const { isAvailable: hasBeginnerTier } = useDLCFeature("positions_gallery_beginner");
  const { isAvailable: hasIntermediateTier } = useDLCFeature("positions_gallery_intermediate");
  const { isAvailable: hasAdvancedTier } = useDLCFeature("positions_gallery_advanced");

  const allowedDifficultyValues = useMemo(() => {
    // Subscription positions access implies full access.
    const hasSubscriptionPositions = Boolean(hasFeature("positionsGallery"));
    if (hasSubscriptionPositions || hasAdvancedTier)
      return ["all", "easy", "medium", "hard", "expert"];
    if (hasIntermediateTier) return ["all", "easy", "medium", "hard"];
    if (hasBeginnerTier) return ["all", "easy", "medium"];
    // Default (dlc-positions or older packages): allow all.
    return ["all", "easy", "medium", "hard", "expert"];
  }, [hasAdvancedTier, hasBeginnerTier, hasFeature, hasIntermediateTier]);

  useEffect(() => {
    if (allowedDifficultyValues.includes(selectedDifficulty)) return;
    setSelectedDifficulty("all");
  }, [allowedDifficultyValues, selectedDifficulty]);

  const [positions, setPositions] = useState<Position[]>([]);
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [positionsError, setPositionsError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 48;
  const [totalCount, setTotalCount] = useState<number>(0);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [signedAssetUrls, setSignedAssetUrls] = useState<Record<string, string>>({});
  const [overridesMap, setOverridesMap] = useState<UserPositionMediaOverridesMap>({});

  const refreshOverrides = useCallback(async () => {
    const map = await fetchMyPositionMediaOverrides();
    setOverridesMap(map);
  }, []);

  useEffect(() => {
    if (!isAgeVerified) return;
    void refreshOverrides();
  }, [isAgeVerified, refreshOverrides]);

  const loadCategories = useCallback(async () => {
    try {
      const cats = await fetchPositionCategories();
      if (cats.length > 0) {
        setAllCategories(cats);
      } else {
        // Fallback: derive categories from GitHub catalog
        const fallbackCats = await getNsfwFallbackCategories();
        if (fallbackCats.length > 0) setAllCategories(fallbackCats);
      }
    } catch {
      // Fallback to GitHub catalog on error
      const fallbackCats = await getNsfwFallbackCategories();
      if (fallbackCats.length > 0) setAllCategories(fallbackCats);
    }
  }, []);

  const loadPositions = useCallback(async () => {
    setPositionsLoading(true);
    setPositionsError(null);
    try {
      const { rows, count } = await fetchPositionsPage({
        page,
        pageSize,
        searchTerm,
        selectedCategory,
        selectedDifficulty,
      });

      // If database is empty, use pre-generated GitHub catalog
      if (rows.length === 0 && count === 0 && page === 0) {
        const fallbackPositions = await getNsfwFallbackPositions();

        // Apply filters to GitHub positions
        let filtered = fallbackPositions;

        // Filter by category
        if (selectedCategory !== "all") {
          filtered = filtered.filter(p => p.category === selectedCategory);
        }

        // Filter by difficulty
        if (selectedDifficulty !== "all") {
          const diffMap: Record<string, Position["difficulty"][]> = {
            easy: ["easy"],
            medium: ["medium"],
            hard: ["hard"],
            expert: ["expert"],
          };
          const allowed = diffMap[selectedDifficulty] || [];
          filtered = filtered.filter(p => allowed.includes(p.difficulty));
        }

        // Filter by search term
        const term = searchTerm.trim().toLowerCase();
        if (term) {
          filtered = filtered.filter(
            p =>
              p.name.toLowerCase().includes(term) ||
              p.description.toLowerCase().includes(term) ||
              p.tags.some(tag => tag.toLowerCase().includes(term)),
          );
        }

        // Apply pagination
        const from = page * pageSize;
        const paged = filtered.slice(from, from + pageSize);

        setPositions(paged);
        setTotalCount(filtered.length);
        setPositionsLoading(false);
        return;
      }

      const deviceId = getDeviceId();
      const devicePlatform = getDevicePlatform();

      const toSign: string[] = [];

      const mapped: Position[] = rows.map((r: DbPositionRow) => {
        const category = String(r.category || "general");
        const tags = Array.from(
          new Set(
            [category, ...(Array.isArray(r.tags) ? r.tags : [])]
              .map(x => String(x || "").trim())
              .filter(Boolean),
          ),
        ).slice(0, 24);

        const images: string[] = [];
        const primaryImage = r.image_url_illustrated || r.image_url || r.thumbnail_url;
        if (primaryImage) {
          const img = String(primaryImage);
          if (!isHttpUrl(img) && !signedAssetUrls[img]) toSign.push(img);
          images.push(signedAssetUrls[img] ? String(signedAssetUrls[img]) : img);
        }

        const videos: string[] = [];
        if (r.video_tutorial_url) {
          const v = String(r.video_tutorial_url);
          if (!isHttpUrl(v) && !signedAssetUrls[v]) toSign.push(v);
          videos.push(signedAssetUrls[v] ? String(signedAssetUrls[v]) : v);
        }

        const animations: string[] = [];
        if (r.animation_url) {
          const a = String(r.animation_url);
          if (!isHttpUrl(a) && !signedAssetUrls[a]) toSign.push(a);
          animations.push(signedAssetUrls[a] ? String(signedAssetUrls[a]) : a);
        }

        const instructions = splitInstructions(r.detailed_instructions);

        return {
          id: String(r.id),
          name: String(r.position_name || "Untitled").trim(),
          category,
          difficulty: mapDifficulty(r.difficulty_level),
          description: String(
            r.description || "Illustrated position reference with safety-first guidance.",
          ),
          summary: undefined,
          instructions: instructions.length > 0 ? instructions : defaultInstructions(),
          benefits:
            Array.isArray(r.benefits) && r.benefits.length > 0 ? r.benefits : defaultBenefits(),
          tips: Array.isArray(r.tips) && r.tips.length > 0 ? r.tips : defaultTips(),
          tags,
          stimulationType: deriveStimulation(tags, category),
          requiredFlexibility: mapFlexibility(r.required_flexibility),
          intimacyLevel: mapIntimacy(r.intimacy_level),
          images: images.length > 0 ? images : undefined,
          videos: videos.length > 0 ? videos : undefined,
          gifs: undefined,
          animations: animations.length > 0 ? animations : undefined,
        };
      });

      setPositions(mapped);
      setTotalCount(typeof count === "number" ? count : mapped.length);

      // Best-effort sign private storage paths for visible page items.
      // We keep a cache keyed by assetPath to avoid re-signing during navigation.
      if (toSign.length > 0) {
        const next = await signAssetPaths({
          assetPaths: toSign,
          deviceId,
          devicePlatform,
          expiresInSeconds: 5 * 60,
        });
        if (Object.keys(next).length > 0) setSignedAssetUrls(prev => ({ ...prev, ...next }));
      }
    } catch (e) {
      // On error, try falling back to GitHub catalog
      try {
        let filtered = await getNsfwFallbackPositions();

        if (selectedCategory !== "all") {
          filtered = filtered.filter(p => p.category === selectedCategory);
        }

        const term = searchTerm.trim().toLowerCase();
        if (term) {
          filtered = filtered.filter(
            p =>
              p.name.toLowerCase().includes(term) ||
              p.description.toLowerCase().includes(term) ||
              p.tags.some(tag => tag.toLowerCase().includes(term)),
          );
        }

        const from = page * pageSize;
        const paged = filtered.slice(from, from + pageSize);

        setPositions(paged);
        setTotalCount(filtered.length);
        setPositionsError(null);
      } catch {
        const msg = e instanceof Error ? e.message : "Failed to load positions";
        setPositionsError(msg);
        setPositions([]);
        setTotalCount(0);
      }
    } finally {
      setPositionsLoading(false);
    }
  }, [page, pageSize, searchTerm, selectedCategory, selectedDifficulty, signedAssetUrls]);

  const openPositionById = useCallback(
    async (positionId: string) => {
      const id = String(positionId || "").trim();
      if (!id) return;
      setPositionsError(null);

      // First check if it's a GitHub-based position ID (contains repo path)
      if (id.includes("/") || id.includes("@")) {
        const fallbackPos = await findNsfwFallbackPositionById(id);
        if (fallbackPos) {
          setSelectedPosition(fallbackPos);
          return;
        }
      }

      try {
        const row = await fetchPositionById(id);
        if (!row) {
          // Fallback: try GitHub catalog
          const fallbackPos = await findNsfwFallbackPositionById(id);
          if (fallbackPos) {
            setSelectedPosition(fallbackPos);
            return;
          }
          setPositionsError("Position not found");
          return;
        }

        const deviceId = getDeviceId();
        const devicePlatform = getDevicePlatform();
        const toSign: string[] = [];

        const category = String(row.category || "general");
        const tags = Array.from(
          new Set(
            [category, ...(Array.isArray(row.tags) ? row.tags : [])]
              .map(x => String(x || "").trim())
              .filter(Boolean),
          ),
        ).slice(0, 24);

        const images: string[] = [];
        const primaryImage = row.image_url_illustrated || row.image_url || row.thumbnail_url;
        if (primaryImage) {
          const img = String(primaryImage);
          if (!isHttpUrl(img) && !signedAssetUrls[img]) toSign.push(img);
          images.push(signedAssetUrls[img] ? String(signedAssetUrls[img]) : img);
        }

        const videos: string[] = [];
        if (row.video_tutorial_url) {
          const v = String(row.video_tutorial_url);
          if (!isHttpUrl(v) && !signedAssetUrls[v]) toSign.push(v);
          videos.push(signedAssetUrls[v] ? String(signedAssetUrls[v]) : v);
        }

        const animations: string[] = [];
        if (row.animation_url) {
          const a = String(row.animation_url);
          if (!isHttpUrl(a) && !signedAssetUrls[a]) toSign.push(a);
          animations.push(signedAssetUrls[a] ? String(signedAssetUrls[a]) : a);
        }

        if (toSign.length > 0) {
          const next = await signAssetPaths({
            assetPaths: toSign,
            deviceId,
            devicePlatform,
            expiresInSeconds: 5 * 60,
          });
          if (Object.keys(next).length > 0) setSignedAssetUrls(prev => ({ ...prev, ...next }));
        }

        const mapped: Position = {
          id: String(row.id),
          name: String(row.position_name || "Untitled").trim(),
          category,
          difficulty: mapDifficulty(row.difficulty_level),
          description: String(
            row.description || "Illustrated position reference with safety-first guidance.",
          ),
          summary: undefined,
          instructions: (() => {
            const lines = splitInstructions(row.detailed_instructions);
            return lines.length > 0 ? lines : defaultInstructions();
          })(),
          benefits:
            Array.isArray(row.benefits) && row.benefits.length > 0
              ? row.benefits
              : defaultBenefits(),
          tips: Array.isArray(row.tips) && row.tips.length > 0 ? row.tips : defaultTips(),
          tags,
          stimulationType: deriveStimulation(tags, category),
          requiredFlexibility: mapFlexibility(row.required_flexibility),
          intimacyLevel: mapIntimacy(row.intimacy_level),
          images: images.length > 0 ? images : undefined,
          videos: videos.length > 0 ? videos : undefined,
          gifs: undefined,
          animations: animations.length > 0 ? animations : undefined,
        };

        setSelectedPosition(mapped);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load position";
        setPositionsError(msg);
      }
    },
    [signedAssetUrls],
  );

  // initial category + first load
  useEffect(() => {
    if (!isAgeVerified) return;
    void loadCategories();
  }, [isAgeVerified, loadCategories]);

  // reset pagination when filters change
  useEffect(() => {
    setPage(0);
  }, [searchTerm, selectedCategory, selectedDifficulty]);

  useEffect(() => {
    if (!isAgeVerified) return;
    void loadPositions();
  }, [isAgeVerified, loadPositions]);

  useEffect(() => {
    const id = String(initialPositionId || "").trim();
    if (!id) return;
    if (!isAgeVerified) return;
    if (dlcLoading) return;
    if (!hasFeature("positionsGallery") && !hasPositionsDlc) return;
    if (selectedPosition?.id === id) return;
    void openPositionById(id);
  }, [
    dlcLoading,
    hasPositionsDlc,
    hasFeature,
    initialPositionId,
    isAgeVerified,
    openPositionById,
    selectedPosition?.id,
  ]);

  const positionsWithOverrides = useMemo(() => {
    if (!overridesMap || Object.keys(overridesMap).length === 0) return positions;
    return positions.map(p => {
      const o = overridesMap[p.id];
      if (!o) return p;
      const imageUrl = o.image?.public_url || undefined;
      const gifUrl = o.gif?.public_url || undefined;
      const videoUrl = o.video?.public_url || undefined;
      return {
        ...p,
        images: imageUrl ? [imageUrl] : p.images,
        gifs: gifUrl ? [gifUrl] : p.gifs,
        videos: videoUrl ? [videoUrl] : p.videos,
      };
    });
  }, [overridesMap, positions]);

  const categories = useMemo(() => {
    const ids =
      allCategories.length > 0
        ? allCategories
        : Array.from(new Set(positions.map(p => p.category))).sort((a, b) => a.localeCompare(b));
    return [
      { id: "all", label: "All Positions", icon: Grid },
      ...ids.map(id => ({ id, label: toLabel(id), icon: categoryIcon(id) })),
    ];
  }, [allCategories, positions]);

  const filteredPositions = useMemo(() => {
    // DB query already applies filters; keep client-side guard (e.g. overrides), but avoid re-filtering by category/difficulty.
    const term = searchTerm.trim().toLowerCase();
    if (!term) return positionsWithOverrides;
    return positionsWithOverrides.filter(pos => {
      return (
        pos.name.toLowerCase().includes(term) ||
        pos.description.toLowerCase().includes(term) ||
        pos.tags.some(tag => tag.toLowerCase().includes(term))
      );
    });
  }, [positionsWithOverrides, searchTerm]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => (prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]));
  };

  const getRandomPosition = () => {
    const random = filteredPositions[Math.floor(Math.random() * filteredPositions.length)];
    if (random) setSelectedPosition(random);
  };

  // Check if feature is available and NSFW content is accessible
  if (dlcLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="glass-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="w-12 h-12 text-muted-foreground animate-spin mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // CRITICAL: Wait for ALL access checks to complete FIRST before making any gating decisions
  // This prevents showing locked screens while roles are still loading
  const stillCheckingAccess = featureLoading || dlcLoading || authLoading || rolesLoading;
  if (stillCheckingAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Super admin bypass: always allow access (check AFTER loading completes)
  // CRITICAL: Include module-level cached value for instant privileged access
  const hasSuperAdminAccess =
    INITIAL_SUPER_ADMIN_STATUS ||
    isSuperAdmin ||
    hasFullAccess ||
    allFeaturesUnlocked ||
    isAdmin ||
    isSuperAdminRole;

  // Hide in SFW mode or if NSFW content not available (bypass for super admins)
  if (!isAgeVerified && !hasSuperAdminAccess) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="glass-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-full bg-muted/30 mb-4">
              <Lock className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{"Age Verification Required"}</h3>
            <p className="text-muted-foreground max-w-md mb-4">
              {"This gallery contains adult content. Please verify you are 18+ to continue."}
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={() => setShowAgeModal(true)} className="gap-2">
                <Shield className="w-4 h-4" />
                Verify Age
              </Button>
              <Button asChild variant="outline">
                <Link to="/pricing">View Pricing</Link>
              </Button>
            </div>
            <Badge variant="secondary" className="mt-3">
              {"18+ Required"}
            </Badge>
          </CardContent>
        </Card>
        <AgeVerificationModal
          isOpen={showAgeModal}
          onClose={() => setShowAgeModal(false)}
          onVerified={() => {
            setShowAgeModal(false);
          }}
        />
      </div>
    );
  }

  // Entitlement for positions gallery: super admin OR subscription OR DLC feature
  if (!hasSuperAdminAccess && !hasFeature("positionsGallery") && !hasPositionsDlc) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="glass-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-full bg-muted/30 mb-4">
              <Lock className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Premium Feature</h3>
            <p className="text-muted-foreground max-w-md mb-4">
              Unlock via subscription or DLC to access 100+ positions with detailed instructions.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button asChild>
                <Link to="/store">Open DLC Store</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/pricing">View Subscriptions</Link>
              </Button>
            </div>
            <Badge variant="secondary" className="mt-3">
              Requires Subscription or DLC
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <AgeVerificationModal
        isOpen={showAgeModal}
        onClose={() => setShowAgeModal(false)}
        onVerified={() => {
          setShowAgeModal(false);
        }}
      />
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold gradient-text mb-2">Positions Gallery</h2>
        <p className="text-muted-foreground">Explore and learn new intimate positions</p>
      </div>

      {/* Search and Filters */}
      <Card className="glass-card border-border/50 mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search positions..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                {allowedDifficultyValues.includes("all") ? (
                  <SelectItem value="all">All Levels</SelectItem>
                ) : null}
                {allowedDifficultyValues.includes("easy") ? (
                  <SelectItem value="easy">Easy</SelectItem>
                ) : null}
                {allowedDifficultyValues.includes("medium") ? (
                  <SelectItem value="medium">Medium</SelectItem>
                ) : null}
                {allowedDifficultyValues.includes("hard") ? (
                  <SelectItem value="hard">Hard</SelectItem>
                ) : null}
                {allowedDifficultyValues.includes("expert") ? (
                  <SelectItem value="expert">Expert</SelectItem>
                ) : null}
              </SelectContent>
            </Select>
            <Button onClick={getRandomPosition} variant="outline" className="gap-2">
              <Shuffle className="w-4 h-4" /> Random
            </Button>
            <Button
              onClick={() => setInvertedColors(!invertedColors)}
              variant="outline"
              size="icon"
              title={invertedColors ? "Disable color inversion" : "Enable color inversion"}
            >
              {invertedColors ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <div className="flex gap-1 p-1 bg-muted/30 rounded-lg">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {positionsLoading ? "Loading…" : `${filteredPositions.length} shown`}
              {typeof totalCount === "number" && totalCount > 0 ? ` (of ${totalCount})` : ""}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={positionsLoading || page === 0}
                onClick={() => setPage(p => Math.max(0, p - 1))}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={positionsLoading || (page + 1) * pageSize >= totalCount}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
          {positionsError && <div className="mt-3 text-sm text-destructive">{positionsError}</div>}
        </CardContent>
      </Card>

      {/* Category Tabs */}
      <ScrollArea className="w-full mb-6">
        <div className="flex gap-2 pb-2">
          {categories.map(cat => {
            const Icon = cat.icon;
            return (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat.id)}
                className="gap-2 whitespace-nowrap"
              >
                <Icon className="w-4 h-4" />
                {cat.label}
              </Button>
            );
          })}
        </div>
      </ScrollArea>

      {/* Positions Grid */}
      <div
        className={
          viewMode === "grid" ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" : "space-y-4"
        }
      >
        {filteredPositions.map(position => (
          <PositionCard
            key={position.id}
            position={position}
            viewMode={viewMode}
            invertedColors={invertedColors}
            isFavorite={favorites.includes(position.id)}
            onSelect={() => setSelectedPosition(position)}
            onToggleFavorite={() => toggleFavorite(position.id)}
          />
        ))}
      </div>

      {filteredPositions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No positions found matching your criteria</p>
        </div>
      )}

      {/* Position Detail Dialog */}
      <PositionDetailView
        position={selectedPosition}
        isOpen={!!selectedPosition}
        onClose={() => setSelectedPosition(null)}
        onToggleFavorite={toggleFavorite}
        isFavorite={selectedPosition ? favorites.includes(selectedPosition.id) : false}
        invertedColors={invertedColors}
        onMediaOverrideChange={() => void refreshOverrides()}
      />
    </div>
  );
};

export default PositionsGallery;
