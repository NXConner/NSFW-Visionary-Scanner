import { useMemo, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Grid,
  List,
  Flame,
  Sparkles,
  Users,
  Zap,
  Lock,
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
import type { Position } from "@/components/positionsGallery/model";
import { usePositionsGalleryData } from "@/components/positionsGallery/usePositionsGalleryData";
import { PositionCard } from "@/components/positionsGallery/PositionCard";

// CRITICAL: Module-level cached super admin check - runs ONCE at import time
// This ensures privileged status is known BEFORE any component renders
const INITIAL_SUPER_ADMIN_STATUS = isAnySuperAdminPersisted();

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

  const stillCheckingAccess = featureLoading || dlcLoading || authLoading || rolesLoading;

  // Super admin bypass: always allow access (but only after loading completes).
  // Include module-level cached value for instant privileged access in-session.
  const hasSuperAdminAccess =
    INITIAL_SUPER_ADMIN_STATUS ||
    isSuperAdmin ||
    hasFullAccess ||
    allFeaturesUnlocked ||
    isAdmin ||
    isSuperAdminRole;

  const canAccessPositions =
    hasSuperAdminAccess || hasFeature("positionsGallery") || hasPositionsDlc;
  const canLoadContent =
    !stillCheckingAccess && canAccessPositions && (hasSuperAdminAccess || isAgeVerified);

  const {
    page,
    pageSize,
    setPage,
    positions,
    totalCount,
    loading: positionsLoading,
    error: positionsError,
    categories: allCategories,
    refreshOverrides,
    openPositionById,
  } = usePositionsGalleryData({
    enabled: canLoadContent,
    searchTerm,
    selectedCategory,
    selectedDifficulty,
    pageSize: 48,
  });

  useEffect(() => {
    const id = String(initialPositionId || "").trim();
    if (!id) return;
    if (selectedPosition?.id === id) return;
    if (!canLoadContent) return;
    void (async () => {
      const pos = await openPositionById(id);
      if (pos) setSelectedPosition(pos);
    })();
  }, [initialPositionId, canLoadContent, openPositionById, selectedPosition?.id]);

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
    if (!term) return positions;
    return positions.filter(pos => {
      return (
        pos.name.toLowerCase().includes(term) ||
        pos.description.toLowerCase().includes(term) ||
        pos.tags.some(tag => tag.toLowerCase().includes(term))
      );
    });
  }, [positions, searchTerm]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => (prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]));
  };

  const getRandomPosition = () => {
    const random = filteredPositions[Math.floor(Math.random() * filteredPositions.length)];
    if (random) setSelectedPosition(random);
  };

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

  if (stillCheckingAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

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
  if (!canAccessPositions) {
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
          {totalCount === 0 &&
          searchTerm.trim() === "" &&
          selectedCategory === "all" &&
          selectedDifficulty === "all" ? (
            <div className="space-y-3">
              <p className="text-muted-foreground">No positions content is available yet.</p>
              {hasSuperAdminAccess || isAdmin ? (
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Button asChild>
                    <Link to="/admin/nsfw">Import NSFW Content</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/admin/dlc">DLC Admin</Link>
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  If you believe this is an error, contact support or try again later.
                </p>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">No positions found matching your criteria</p>
          )}
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
