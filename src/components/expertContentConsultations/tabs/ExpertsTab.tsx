import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { GraduationCap, Star } from "lucide-react";
import { getExpertProfiles, type ExpertProfile } from "@/lib/expertContentConsultations";

function renderStars(rating: number): JSX.Element[] {
  return Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      className={`h-4 w-4 ${i < rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`}
    />
  ));
}

export function ExpertsTab({
  isActive,
  selectedExpert,
  onSelectExpert,
}: {
  isActive: boolean;
  selectedExpert: ExpertProfile | null;
  onSelectExpert: (expert: ExpertProfile) => void;
}): JSX.Element {
  const [loading, setLoading] = useState(false);
  const [experts, setExperts] = useState<ExpertProfile[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const expertsData = await getExpertProfiles(true);
      setExperts(expertsData);
    } catch {
      toast.error("Failed to load experts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isActive) return;
    void load();
  }, [isActive, load]);

  const empty = useMemo(() => !loading && experts.length === 0, [experts.length, loading]);

  if (loading)
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">Loading…</div>
    );

  if (empty) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No experts available yet</p>
        <p className="text-sm">Expert profiles coming soon</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {experts.map(expert => {
        const isSelected = selectedExpert?.id === expert.id;
        return (
          <button
            key={expert.id}
            type="button"
            onClick={() => onSelectExpert(expert)}
            aria-label={`Select expert ${expert.display_name}`}
            className={`text-left block rounded-lg border transition-all hover:border-primary ${
              isSelected ? "border-primary ring-2 ring-primary/20" : "border-border"
            }`}
            aria-pressed={isSelected}
          >
            <Card className="border-0 shadow-none">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                    <GraduationCap className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{expert.display_name}</h3>
                    <p className="text-sm text-muted-foreground">{expert.bio}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex">{renderStars(expert.rating || 0)}</div>
                      <span className="text-sm text-muted-foreground">
                        ({expert.review_count || 0} reviews)
                      </span>
                    </div>
                    {expert.specialties && expert.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {expert.specialties.slice(0, 3).map(spec => (
                          <Badge key={spec} variant="secondary" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </button>
        );
      })}
    </div>
  );
}
