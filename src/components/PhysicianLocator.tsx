import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Reveal } from "@/components/premium/Reveal";
import { AnimatedNumber } from "@/components/premium/AnimatedNumber";
import { TiltCard } from "@/components/premium/TiltCard";
import {
  MapPin,
  Search,
  Clock,
  Star,
  Stethoscope,
  Building2,
  ChevronRight,
  BadgeCheck,
  Briefcase,
  DollarSign,
} from "lucide-react";
import { getExpertProfiles, type ExpertProfile } from "@/lib/expertContentConsultations";
import { toast } from "sonner";

export const PhysicianLocator = () => {
  const [searchLocation, setSearchLocation] = useState("");
  const [experts, setExperts] = useState<ExpertProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadExperts = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getExpertProfiles();
      setExperts(data);
    } catch {
      setLoadError("Unable to load expert directory.");
      toast.error("Failed to load expert directory");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadExperts();
  }, [loadExperts]);

  const filteredExperts = useMemo(() => {
    const q = searchLocation.trim().toLowerCase();
    if (!q) return experts;
    return experts.filter(expert => {
      const haystack = [
        expert.display_name,
        expert.bio ?? "",
        expert.specialties.join(" "),
        (expert.credentials ?? []).join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [experts, searchLocation]);

  const averageRating = useMemo(() => {
    const rated = experts.filter(e => Number(e.rating || 0) > 0);
    if (rated.length === 0) return 0;
    const total = rated.reduce((sum, e) => sum + Number(e.rating || 0), 0);
    return total / rated.length;
  }, [experts]);

  const availableCount = useMemo(
    () => experts.filter(e => e.is_available).length,
    [experts],
  );
  const availabilityLabel = availableCount > 0 ? "Available now" : "Schedule required";

  const topSpecialties = useMemo(() => {
    const counts = new Map<string, number>();
    experts.forEach(expert => {
      expert.specialties.forEach(spec => {
        const key = spec.trim();
        if (!key) return;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([spec]) => spec);
  }, [experts]);

  return (
    <section className="min-h-screen px-4 py-20 relative">
      <div className="container mx-auto max-w-6xl">
        <Reveal variant="fade-up">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6">
              <MapPin className="w-4 h-4 text-accent" />
              <span className="text-sm text-accent font-medium">Find Experts</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="gradient-text">Expert</span> Locator
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Connect with verified pavement experts for inspection, repair planning, and maintenance
              guidance.
            </p>
          </div>
        </Reveal>

        {/* Search */}
        <Reveal variant="fade-up" delay={0.1}>
          <Card variant="glass" className="mb-8">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, specialty, or service..."
                    value={searchLocation}
                    onChange={e => setSearchLocation(e.target.value)}
                    className="pl-12 h-14 text-lg"
                  />
                </div>
                <Button variant="hero" className="h-14 px-8">
                  <Search className="w-5 h-5 mr-2" />
                  Find Experts
                </Button>
              </div>

              <div className="flex items-center gap-4 mt-4">
                <span className="text-sm text-muted-foreground">
                  Search results update as you type
                </span>
              </div>
            </CardContent>
          </Card>
        </Reveal>

        {/* Results */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Coverage & Expertise */}
          <Reveal variant="fade-up" delay={0.15} className="lg:col-span-2">
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Coverage & Expertise
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading expert coverage...</p>
                ) : loadError ? (
                  <p className="text-sm text-muted-foreground">{loadError}</p>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Experts provide remote-first guidance and schedule on-site consults based on
                      project location and availability.
                    </p>
                    {topSpecialties.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {topSpecialties.map(spec => (
                          <Badge key={spec} variant="secondary">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Specialties will appear once expert profiles are published.
                      </p>
                    )}
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="rounded-lg border border-border/60 p-4">
                        <p className="text-xs text-muted-foreground">Verified Experts</p>
                        <p className="text-2xl font-semibold">{experts.length}</p>
                      </div>
                      <div className="rounded-lg border border-border/60 p-4">
                        <p className="text-xs text-muted-foreground">Available Now</p>
                        <p className="text-2xl font-semibold">{availableCount}</p>
                      </div>
                      <div className="rounded-lg border border-border/60 p-4">
                        <p className="text-xs text-muted-foreground">Avg Rating</p>
                        <p className="text-2xl font-semibold">
                          <AnimatedNumber value={averageRating} decimals={1} />
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </Reveal>

          {/* Quick Stats */}
          <div className="space-y-4">
            <Reveal variant="slide-left" delay={0.2}>
              <TiltCard maxTilt={8} className="h-full">
                <Card variant="stat" className="h-full">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Stethoscope className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        <AnimatedNumber value={filteredExperts.length} />
                      </p>
                      <p className="text-sm text-muted-foreground">Experts Found</p>
                    </div>
                  </div>
                </Card>
              </TiltCard>
            </Reveal>

            <Reveal variant="slide-left" delay={0.25}>
              <TiltCard maxTilt={8} className="h-full">
                <Card variant="stat" className="h-full">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                      <Star className="w-6 h-6 text-success" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        <AnimatedNumber value={averageRating} decimals={1} />
                      </p>
                      <p className="text-sm text-muted-foreground">Avg. Rating</p>
                    </div>
                  </div>
                </Card>
              </TiltCard>
            </Reveal>

            <Reveal variant="slide-left" delay={0.3}>
              <TiltCard maxTilt={8} className="h-full">
                <Card variant="stat" className="h-full">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{availabilityLabel}</p>
                      <p className="text-sm text-muted-foreground">Availability</p>
                    </div>
                  </div>
                </Card>
              </TiltCard>
            </Reveal>
          </div>
        </div>

        {/* Expert Directory */}
        <div className="mt-8 space-y-4">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading experts...</div>
          ) : loadError ? (
            <div className="text-center py-12 text-muted-foreground">{loadError}</div>
          ) : filteredExperts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No matching experts found. Try adjusting your search.
            </div>
          ) : (
            filteredExperts.map((expert, index) => (
              <Reveal key={expert.id} variant="fade-up" delay={0.35 + index * 0.1}>
                <TiltCard maxTilt={5}>
                  <Card variant="interactive">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                          <span className="text-2xl font-bold text-primary-foreground">
                            {index + 1}
                          </span>
                        </div>

                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-lg font-semibold">{expert.display_name}</h3>
                              <p className="text-sm text-primary">
                                {expert.specialties[0] || "Pavement Specialist"}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 text-warning">
                              <Star className="w-4 h-4 fill-warning" />
                              <span className="font-medium">
                                <AnimatedNumber value={expert.rating} decimals={1} />
                              </span>
                              <span className="text-muted-foreground text-sm">
                                ({expert.review_count})
                              </span>
                            </div>
                          </div>

                          {expert.bio && (
                            <p className="text-sm text-muted-foreground">{expert.bio}</p>
                          )}

                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            {expert.is_verified && (
                              <Badge variant="default" className="gap-1">
                                <BadgeCheck className="w-3 h-3" />
                                Verified
                              </Badge>
                            )}
                            <Badge variant={expert.is_available ? "secondary" : "outline"}>
                              {expert.is_available ? "Available" : "By appointment"}
                            </Badge>
                            {expert.years_experience != null && (
                              <Badge variant="secondary" className="gap-1">
                                <Briefcase className="w-3 h-3" />
                                {expert.years_experience} yrs
                              </Badge>
                            )}
                            <Badge variant="secondary" className="gap-1">
                              <DollarSign className="w-3 h-3" />
                              {expert.consultation_rate_per_hour} {expert.currency}/hr
                            </Badge>
                          </div>

                          {expert.specialties.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {expert.specialties.slice(0, 4).map(spec => (
                                <Badge key={spec} variant="outline" className="text-xs">
                                  {spec}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="gap-2">
                            <Building2 className="w-4 h-4" />
                            View Profile
                          </Button>
                          <Button variant="gradient" size="sm" className="gap-2">
                            Request Consult
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TiltCard>
              </Reveal>
            ))
          )}
        </div>
      </div>
    </section>
  );
};
