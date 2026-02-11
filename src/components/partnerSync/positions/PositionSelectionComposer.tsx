import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import {
  INTIMACY_THEMES,
  PARTNER_AVAILABILITY_TAGS,
  PARTNER_BOUNDARY_TAGS,
  POSITION_CONSTRAINT_LEVELS,
  POSITION_EQUIPMENT_TAGS,
  POSITION_PRIVACY_LEVELS,
  POSITION_SAFETY_CHECKLIST,
  THOUGHT_PING_INTENSITIES,
  THOUGHT_PING_PRIORITIES,
} from "@/lib/partnerSync";
import type {
  PartnerAvailabilityTag,
  PartnerBoundaryTag,
  PositionIntensity,
  ThoughtPingPriority,
} from "@/lib/partnerSync";
import type { SexPosition } from "@/lib/nsfwAdvancedFeatures";

type PositionSelectionComposerProps = {
  positions: SexPosition[];
  loading: boolean;
  onSuggest: (input: {
    positionId?: string;
    customName?: string;
    customDescription?: string;
    themeTags: string[];
    intensity: PositionIntensity;
    note?: string;
    safetyChecklist?: string[];
    constraints?: Record<string, unknown>;
    availabilityTags?: PartnerAvailabilityTag[];
    boundaryTags?: PartnerBoundaryTag[];
    priority?: ThoughtPingPriority;
    privacyLevel?: "private" | "shared" | "public";
  }) => Promise<boolean>;
};

export function PositionSelectionComposer({
  positions,
  loading,
  onSuggest,
}: PositionSelectionComposerProps) {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [flexibility, setFlexibility] = useState("all");
  const [equipment, setEquipment] = useState("none");
  const [privacy, setPrivacy] = useState<"private" | "shared" | "public">("private");
  const [themeTags, setThemeTags] = useState<string[]>([]);
  const [availabilityTags, setAvailabilityTags] = useState<PartnerAvailabilityTag[]>([]);
  const [boundaryTags, setBoundaryTags] = useState<PartnerBoundaryTag[]>([]);
  const [safetyChecklist, setSafetyChecklist] = useState<string[]>([]);
  const [intensity, setIntensity] = useState<PositionIntensity>("medium");
  const [priority, setPriority] = useState<ThoughtPingPriority>("normal");
  const [note, setNote] = useState("");
  const [privateNote, setPrivateNote] = useState("");
  const [customName, setCustomName] = useState("");
  const [customDescription, setCustomDescription] = useState("");

  const categories = useMemo(
    () =>
      Array.from(new Set(positions.map(p => p.position_category)))
        .filter(Boolean)
        .sort(),
    [positions],
  );
  const difficulties = useMemo(
    () =>
      Array.from(new Set(positions.map(p => p.difficulty_level)))
        .filter(Boolean)
        .sort(),
    [positions],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return positions.filter(p => {
      if (category !== "all" && p.position_category !== category) return false;
      if (difficulty !== "all" && p.difficulty_level !== difficulty) return false;
      if (flexibility !== "all" && p.required_flexibility && p.required_flexibility !== flexibility)
        return false;
      if (term) {
        const haystack = `${p.position_name} ${p.description ?? ""}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [category, difficulty, flexibility, positions, search]);

  const handleSuggest = async (positionId?: string) => {
    const ok = await onSuggest({
      positionId,
      customName: positionId ? undefined : customName,
      customDescription: positionId ? undefined : customDescription,
      themeTags,
      intensity,
      priority,
      privacyLevel: privacy,
      note: note || privateNote || undefined,
      safetyChecklist,
      constraints: {
        flexibility,
        equipment,
      },
      availabilityTags,
      boundaryTags,
    });
    if (ok) {
      setNote("");
      setPrivateNote("");
      setCustomName("");
      setCustomDescription("");
    }
  };

  return (
    <Card className="glass-card border-border/50">
      <CardHeader>
        <CardTitle>{t("partnerSync.positions.title")}</CardTitle>
        <CardDescription>{t("partnerSync.positions.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>{t("partnerSync.positions.themeTags")}</Label>
          <ToggleGroup
            type="multiple"
            value={themeTags}
            onValueChange={value => setThemeTags(value)}
            className="flex flex-wrap justify-start"
            aria-label={t("partnerSync.positions.themeTags")}
          >
            {INTIMACY_THEMES.map(tag => (
              <ToggleGroupItem key={tag} value={tag} size="sm">
                {tag}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>{t("partnerSync.positions.intensity")}</Label>
            <Select value={intensity} onValueChange={v => setIntensity(v as PositionIntensity)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {THOUGHT_PING_INTENSITIES.map(level => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("partnerSync.positions.priority")}</Label>
            <Select value={priority} onValueChange={v => setPriority(v as ThoughtPingPriority)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {THOUGHT_PING_PRIORITIES.map(level => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("partnerSync.positions.privacy")}</Label>
            <Select value={privacy} onValueChange={v => setPrivacy(v as typeof privacy)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POSITION_PRIVACY_LEVELS.map(level => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("partnerSync.positions.note")}</Label>
            <Input value={note} onChange={e => setNote(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("partnerSync.positions.privateNote")}</Label>
            <Input
              value={privateNote}
              onChange={e => setPrivateNote(e.target.value)}
              placeholder={t("partnerSync.positions.privateNotePlaceholder")}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t("partnerSync.positions.availability")}</Label>
          <ToggleGroup
            type="multiple"
            value={availabilityTags}
            onValueChange={value => setAvailabilityTags(value as PartnerAvailabilityTag[])}
            className="flex flex-wrap justify-start"
            aria-label={t("partnerSync.positions.availability")}
          >
            {PARTNER_AVAILABILITY_TAGS.map(tag => (
              <ToggleGroupItem key={tag} value={tag} size="sm">
                {tag}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div className="space-y-2">
          <Label>{t("partnerSync.positions.boundaries")}</Label>
          <ToggleGroup
            type="multiple"
            value={boundaryTags}
            onValueChange={value => setBoundaryTags(value as PartnerBoundaryTag[])}
            className="flex flex-wrap justify-start"
            aria-label={t("partnerSync.positions.boundaries")}
          >
            {PARTNER_BOUNDARY_TAGS.map(tag => (
              <ToggleGroupItem key={tag} value={tag} size="sm">
                {tag}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div className="space-y-2">
          <Label>{t("partnerSync.positions.safety")}</Label>
          <ToggleGroup
            type="multiple"
            value={safetyChecklist}
            onValueChange={value => setSafetyChecklist(value)}
            className="flex flex-wrap justify-start"
            aria-label={t("partnerSync.positions.safety")}
          >
            {POSITION_SAFETY_CHECKLIST.map(tag => (
              <ToggleGroupItem key={tag} value={tag} size="sm">
                {tag}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>{t("partnerSync.positions.search")}</Label>
            <Input value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("partnerSync.positions.category")}</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("partnerSync.positions.allCategories")}</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("partnerSync.positions.difficulty")}</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("partnerSync.positions.allDifficulties")}</SelectItem>
                {difficulties.map(level => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("partnerSync.positions.flexibility")}</Label>
            <Select value={flexibility} onValueChange={setFlexibility}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("partnerSync.positions.flexibilityAll")}</SelectItem>
                {POSITION_CONSTRAINT_LEVELS.map(level => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("partnerSync.positions.equipment")}</Label>
            <Select value={equipment} onValueChange={setEquipment}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POSITION_EQUIPMENT_TAGS.map(tag => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            {t("partnerSync.positions.emptyCatalog")}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filtered.slice(0, 12).map(position => (
              <Card key={position.id} className="border border-border/60">
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{position.position_name}</p>
                    <Badge variant="secondary">{position.difficulty_level}</Badge>
                  </div>
                  {position.description && (
                    <p className="text-xs text-muted-foreground">{position.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{position.position_category}</Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void handleSuggest(position.id)}
                      disabled={loading}
                    >
                      {t("partnerSync.positions.suggest")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="border border-border/60">
          <CardContent className="pt-4 space-y-3">
            <Label>{t("partnerSync.positions.customTitle")}</Label>
            <Input
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              placeholder={t("partnerSync.positions.customName")}
            />
            <Textarea
              value={customDescription}
              onChange={e => setCustomDescription(e.target.value)}
              rows={2}
              placeholder={t("partnerSync.positions.customDescription")}
            />
            <Button
              variant="outline"
              onClick={() => void handleSuggest(undefined)}
              disabled={loading}
            >
              {t("partnerSync.positions.customSuggest")}
            </Button>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
