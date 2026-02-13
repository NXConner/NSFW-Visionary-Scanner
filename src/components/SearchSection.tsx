import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  User,
  Phone,
  Mail,
  MapPin,
  Building2,
  Users,
  FileText,
  Shield,
  Loader2,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

interface SearchResult {
  id: string;
  name: string;
  age: number;
  location: string;
  email: string;
  phone: string;
  occupation: string;
  relatives: string[];
  riskScore: number;
}

export const SearchSection = () => {
  type SearchType = "name" | "phone" | "email";

  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("name");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult | null>(null);

  const handleSearch = () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    // Simulate search
    setTimeout(() => {
      setResults({
        id: "1",
        name: "John Michael Smith",
        age: 34,
        location: "Los Angeles, CA",
        email: "j***@email.com",
        phone: "(310) ***-**42",
        occupation: "Software Engineer",
        relatives: ["Mary Smith", "Robert Smith", "Sarah Johnson"],
        riskScore: 15,
      });
      setIsSearching(false);
    }, 2000);
  };

  const searchTypes: ReadonlyArray<{
    id: SearchType;
    label: string;
    icon: typeof User;
    placeholder: string;
  }> = [
    { id: "name", label: "Name", icon: User, placeholder: "Enter full name..." },
    { id: "phone", label: "Phone", icon: Phone, placeholder: "Enter phone number..." },
    { id: "email", label: "Email", icon: Mail, placeholder: "Enter email address..." },
  ];

  return (
    <section className="min-h-screen px-4 py-20 relative">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6">
            <Search className="w-4 h-4 text-accent" />
            <span className="text-sm text-accent font-medium">People Search</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="gradient-text">Background</span> Check
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Access comprehensive background information including public records, social profiles,
            and verification data.
          </p>
        </div>

        {/* Search Interface */}
        <Card
          variant="glass"
          className="mb-8 animate-fade-in-up"
          style={{ animationDelay: "0.1s" }}
        >
          <CardContent className="p-6">
            {/* Search Type Tabs */}
            <div className="flex gap-2 mb-6">
              {searchTypes.map(type => (
                <Button
                  key={type.id}
                  variant={searchType === type.id ? "scan" : "ghost"}
                  size="sm"
                  onClick={() => setSearchType(type.id)}
                  className="gap-2"
                >
                  <type.icon className="w-4 h-4" />
                  {type.label}
                </Button>
              ))}
            </div>

            {/* Search Input */}
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder={searchTypes.find(t => t.id === searchType)?.placeholder}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 text-lg bg-secondary/50 border-border/50 focus:border-primary"
                  onKeyDown={e => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button
                variant="hero"
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="h-14 px-8"
              >
                {isSearching ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Search
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-border/50">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">3B+</div>
                <div className="text-xs text-muted-foreground">Records</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">50</div>
                <div className="text-xs text-muted-foreground">States</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">100%</div>
                <div className="text-xs text-muted-foreground">Legal</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">256-bit</div>
                <div className="text-xs text-muted-foreground">Encryption</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search Results */}
        {results && (
          <div className="grid lg:grid-cols-3 gap-6 animate-fade-in-up">
            {/* Profile Card */}
            <Card variant="glass" className="lg:col-span-1">
              <CardContent className="p-6 text-center">
                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4">
                  <User className="w-12 h-12 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-1">{results.name}</h3>
                <p className="text-muted-foreground mb-4">{results.age} years old</p>

                <div className="space-y-3 text-left">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <MapPin className="w-5 h-5 text-primary" />
                    <span className="text-sm">{results.location}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <Building2 className="w-5 h-5 text-primary" />
                    <span className="text-sm">{results.occupation}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <Mail className="w-5 h-5 text-primary" />
                    <span className="text-sm">{results.email}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <Phone className="w-5 h-5 text-primary" />
                    <span className="text-sm">{results.phone}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Risk Assessment */}
              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Risk Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1">
                      <div className="h-3 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full bg-success transition-all duration-1000"
                          style={{ width: `${100 - results.riskScore}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-success">
                        {100 - results.riskScore}%
                      </div>
                      <div className="text-xs text-muted-foreground">Safe Score</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      <span>No criminal records</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      <span>Identity verified</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      <span>No bankruptcies</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="w-4 h-4 text-warning" />
                      <span>1 address change</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Relatives */}
              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Known Associates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {results.relatives.map((relative) => (
                      <div
                        key={relative}
                        className="px-4 py-2 rounded-full bg-secondary/50 border border-border/50 text-sm hover:border-primary/50 cursor-pointer transition-colors"
                      >
                        {relative}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-4">
                <Button variant="gradient" className="flex-1 gap-2">
                  <FileText className="w-5 h-5" />
                  Full Report
                </Button>
                <Button variant="outline" className="flex-1 gap-2">
                  <Shield className="w-5 h-5" />
                  Deep Verification
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!results && !isSearching && (
          <div className="text-center py-16 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <div className="w-24 h-24 mx-auto rounded-full bg-secondary/50 flex items-center justify-center mb-6">
              <Search className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Start Your Search</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Enter a name, phone number, or email address to access comprehensive background
              information.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
