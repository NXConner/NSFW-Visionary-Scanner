import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { getSexPositions, savePosition, type SexPosition } from "@/lib/nsfwAdvancedFeatures";
import { Star } from "lucide-react";

type FilterState = {
  category: "all" | SexPosition["position_category"];
  difficulty: "all" | SexPosition["difficulty_level"];
};

export function PositionsTab({ isActive }: { isActive: boolean }): JSX.Element {
  const [loading, setLoading] = useState(false);
  const [positions, setPositions] = useState<SexPosition[]>([]);
  const [filters, setFilters] = useState<FilterState>({ category: "all", difficulty: "all" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getSexPositions();
      setPositions(list);
    } catch {
      toast.error("Failed to load positions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isActive) return;
    void load();
  }, [isActive, load]);

  const filtered = useMemo(() => {
    return positions.filter(p => {
      if (filters.category !== "all" && p.position_category !== filters.category) return false;
      if (filters.difficulty !== "all" && p.difficulty_level !== filters.difficulty) return false;
      return true;
    });
  }, [filters, positions]);

  const handleSave = useCallback(async (positionId: string) => {
    try {
      const ok = await savePosition(positionId);
      if (!ok) toast.error("Failed to save position");
    } catch {
      toast.error("Failed to save position");
    }
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Select
          value={filters.category}
          onValueChange={v => setFilters(p => ({ ...p, category: v as FilterState["category"] }))}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="basic">Basic / Classic</SelectItem>
            <SelectItem value="romantic">Romantic / Tantric</SelectItem>
            <SelectItem value="adventurous">Adventurous / Quick</SelectItem>
            <SelectItem value="acrobatic">Acrobatic</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.difficulty}
          onValueChange={v =>
            setFilters(p => ({ ...p, difficulty: v as FilterState["difficulty"] }))
          }
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Difficulties</SelectItem>
            <SelectItem value="easy">Easy</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="hard">Hard</SelectItem>
            <SelectItem value="expert">Expert</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(position => (
            <Card key={position.id} className="glass-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2 gap-2">
                  <h4 className="font-semibold">{position.position_name}</h4>
                  <Badge variant="secondary">{position.difficulty_level}</Badge>
                </div>
                {position.description && (
                  <p className="text-sm text-muted-foreground mb-2">{position.description}</p>
                )}
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{position.position_category}</Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void handleSave(position.id)}
                    aria-label={`Save position ${position.position_name}`}
                  >
                    <Star className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
