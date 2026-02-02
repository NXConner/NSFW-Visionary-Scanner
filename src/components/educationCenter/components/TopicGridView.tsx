import React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, BookOpen, ChevronRight, Search } from "lucide-react";

import type {
  HealthTopic,
  HealthTopicCategory,
  HealthTopicSeverity,
} from "@/components/educationCenter/types";

export function TopicGridView({
  filteredTopics,
  activeCategory,
  onCategoryChange,
  searchQuery,
  onSearchQueryChange,
  onSelectTopic,
  categoryIcons,
  severityColors,
}: {
  filteredTopics: HealthTopic[];
  activeCategory: HealthTopicCategory | "all";
  onCategoryChange: (category: HealthTopicCategory | "all") => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onSelectTopic: (topic: HealthTopic) => void;
  categoryIcons: Record<HealthTopicCategory, React.ComponentType<{ className?: string }>>;
  severityColors: Record<HealthTopicSeverity, string>;
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <BookOpen className="w-6 h-6 text-primary" />
            Health Education Center
          </CardTitle>
          <p className="text-muted-foreground">
            Comprehensive information about penis health conditions, STIs, and when to seek medical
            attention.
          </p>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search health topics..."
              value={searchQuery}
              onChange={e => onSearchQueryChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Category Tabs */}
      <Tabs
        value={activeCategory}
        onValueChange={v => onCategoryChange(v as HealthTopicCategory | "all")}
      >
        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap bg-secondary/30 p-1">
          <TabsTrigger value="all">All Topics</TabsTrigger>
          <TabsTrigger value="curvature">Curvature</TabsTrigger>
          <TabsTrigger value="sti">STIs</TabsTrigger>
          <TabsTrigger value="infection">Infections</TabsTrigger>
          <TabsTrigger value="skin">Skin</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Topic Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTopics.map(topic => {
          const Icon = categoryIcons[topic.category];
          return (
            <Card
              key={topic.id}
              variant="interactive"
              className="cursor-pointer hover:border-primary/30 transition-all"
              onClick={() => onSelectTopic(topic)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{topic.title}</h3>
                    </div>
                    <Badge className={`${severityColors[topic.severity]} text-xs mb-2`}>
                      {topic.severity}
                    </Badge>
                    <p className="text-sm text-muted-foreground line-clamp-2">{topic.overview}</p>
                  </div>
                </div>
                <Button variant="ghost" className="w-full mt-4 justify-between">
                  Learn More
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredTopics.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No topics found matching your search.</p>
        </div>
      )}

      {/* Disclaimer */}
      <Card variant="glass" className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <AlertTriangle className="w-6 h-6 text-warning shrink-0" />
            <div>
              <h4 className="font-semibold mb-2">Medical Disclaimer</h4>
              <p className="text-sm text-muted-foreground">
                This educational content is for informational purposes only and should not replace
                professional medical advice, diagnosis, or treatment. Always seek the advice of your
                physician or other qualified health provider with any questions about a medical
                condition. Never disregard professional medical advice or delay seeking it because
                of something you have read here.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
