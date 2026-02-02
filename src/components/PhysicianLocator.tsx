import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Reveal } from "@/components/premium/Reveal";
import { AnimatedNumber } from "@/components/premium/AnimatedNumber";
import { TiltCard } from "@/components/premium/TiltCard";
import {
  MapPin,
  Search,
  Phone,
  Clock,
  Star,
  Navigation,
  Stethoscope,
  Building2,
  ChevronRight,
} from "lucide-react";

interface Physician {
  id: string;
  name: string;
  specialty: string;
  clinic: string;
  address: string;
  distance: string;
  rating: number;
  reviews: number;
  phone: string;
  availability: string;
}

export const PhysicianLocator = () => {
  const [searchLocation, setSearchLocation] = useState("");
  const [physicians] = useState<Physician[]>([
    {
      id: "1",
      name: "Dr. Michael Roberts",
      specialty: "Urologist - Peyronie's Specialist",
      clinic: "Pacific Urology Center",
      address: "1234 Medical Plaza, Los Angeles, CA 90024",
      distance: "2.4 mi",
      rating: 4.9,
      reviews: 127,
      phone: "(310) 555-0123",
      availability: "Next available: Tomorrow",
    },
    {
      id: "2",
      name: "Dr. Sarah Chen",
      specialty: "Urologist - Men's Health",
      clinic: "UCLA Medical Center",
      address: "757 Westwood Plaza, Los Angeles, CA 90095",
      distance: "3.1 mi",
      rating: 4.8,
      reviews: 89,
      phone: "(310) 555-0456",
      availability: "Next available: Thursday",
    },
    {
      id: "3",
      name: "Dr. James Wilson",
      specialty: "Urologist",
      clinic: "Cedars-Sinai Urology",
      address: "8700 Beverly Blvd, Los Angeles, CA 90048",
      distance: "5.7 mi",
      rating: 4.7,
      reviews: 156,
      phone: "(323) 555-0789",
      availability: "Next available: Friday",
    },
  ]);

  return (
    <section className="min-h-screen px-4 py-20 relative">
      <div className="container mx-auto max-w-6xl">
        <Reveal variant="fade-up">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6">
              <MapPin className="w-4 h-4 text-accent" />
              <span className="text-sm text-accent font-medium">Find Specialists</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="gradient-text">Physician</span> Locator
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Find urologists and specialists who treat Peyronie's Disease near you.
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
                    placeholder="Enter your location or ZIP code..."
                    value={searchLocation}
                    onChange={e => setSearchLocation(e.target.value)}
                    className="pl-12 h-14 text-lg"
                  />
                </div>
                <Button variant="hero" className="h-14 px-8">
                  <Search className="w-5 h-5 mr-2" />
                  Find Doctors
                </Button>
              </div>

              <div className="flex items-center gap-4 mt-4">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Navigation className="w-4 h-4" />
                  Use Current Location
                </Button>
                <span className="text-sm text-muted-foreground">
                  Showing results within 25 miles
                </span>
              </div>
            </CardContent>
          </Card>
        </Reveal>

        {/* Results */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map Placeholder */}
          <Reveal variant="fade-up" delay={0.15} className="lg:col-span-2">
            <Card variant="glass" className="overflow-hidden">
              <div className="relative h-[400px] bg-secondary/30 flex items-center justify-center">
                {/* Map grid pattern */}
                <div className="absolute inset-0 opacity-20">
                  <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="mapGrid" width="60" height="60" patternUnits="userSpaceOnUse">
                        <path
                          d="M 60 0 L 0 0 0 60"
                          fill="none"
                          stroke="hsl(var(--primary))"
                          strokeWidth="0.5"
                        />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#mapGrid)" />
                  </svg>
                </div>

                {/* Location markers */}
                {physicians.map((doc, index) => (
                  <div
                    key={doc.id}
                    className="absolute w-8 h-8 rounded-full gradient-primary flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                    style={{
                      top: `${20 + index * 25}%`,
                      left: `${30 + index * 20}%`,
                    }}
                  >
                    <span className="text-xs font-bold text-primary-foreground">{index + 1}</span>
                  </div>
                ))}

                <div className="text-center z-10">
                  <MapPin className="w-12 h-12 text-primary mx-auto mb-2" />
                  <p className="text-muted-foreground">Interactive map</p>
                  <p className="text-sm text-muted-foreground">3 specialists found nearby</p>
                </div>
              </div>
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
                        <AnimatedNumber value={physicians.length} />
                      </p>
                      <p className="text-sm text-muted-foreground">Specialists Found</p>
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
                        <AnimatedNumber value={4.8} decimals={1} />
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
                      <p className="text-2xl font-bold">1 day</p>
                      <p className="text-sm text-muted-foreground">Earliest Available</p>
                    </div>
                  </div>
                </Card>
              </TiltCard>
            </Reveal>
          </div>
        </div>

        {/* Physician List */}
        <div className="mt-8 space-y-4">
          {physicians.map((doc, index) => (
            <Reveal key={doc.id} variant="fade-up" delay={0.35 + index * 0.1}>
              <TiltCard maxTilt={5}>
                <Card variant="interactive">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl font-bold text-primary-foreground">
                          {index + 1}
                        </span>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold">{doc.name}</h3>
                            <p className="text-sm text-primary">{doc.specialty}</p>
                          </div>
                          <div className="flex items-center gap-1 text-warning">
                            <Star className="w-4 h-4 fill-warning" />
                            <span className="font-medium">
                              <AnimatedNumber value={doc.rating} decimals={1} />
                            </span>
                            <span className="text-muted-foreground text-sm">({doc.reviews})</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            <span>{doc.clinic}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{doc.distance}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span className="text-success">{doc.availability}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="gap-2">
                          <Phone className="w-4 h-4" />
                          Call
                        </Button>
                        <Button variant="gradient" size="sm" className="gap-2">
                          Book
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};
