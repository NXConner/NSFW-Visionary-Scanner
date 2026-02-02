import React, { useMemo, useState } from "react";

import { useVisualContent } from "@/hooks/useVisualContent";
import { VISUAL_CONTENT_CATEGORIES } from "@/lib/visualContentManager";

import { TopicDetailView, TopicGridView } from "@/components/educationCenter/components";
import {
  categoryIcons,
  categoryLabels,
  healthTopics,
  severityColors,
} from "@/components/educationCenter/data";
import type { HealthTopic, HealthTopicCategory } from "@/components/educationCenter/types";

export const EducationCenter = () => {
  const [selectedTopic, setSelectedTopic] = useState<HealthTopic | null>(null);
  const [activeCategory, setActiveCategory] = useState<HealthTopicCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Load visual content for health conditions
  const { content: healthVisuals } = useVisualContent({
    categories: [
      VISUAL_CONTENT_CATEGORIES.HEALTH_CONDITIONS,
      VISUAL_CONTENT_CATEGORIES.SYMPTOMS,
      VISUAL_CONTENT_CATEGORIES.TREATMENT,
    ],
    autoLoad: true,
    autoInvert: true,
  });

  const filteredTopics = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return healthTopics.filter(topic => {
      const matchesCategory = activeCategory === "all" || topic.category === activeCategory;
      const matchesSearch =
        !q || topic.title.toLowerCase().includes(q) || topic.overview.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  if (selectedTopic) {
    return (
      <TopicDetailView
        topic={selectedTopic}
        onBack={() => setSelectedTopic(null)}
        healthVisuals={healthVisuals}
        categoryIcons={categoryIcons}
        categoryLabels={categoryLabels}
        severityColors={severityColors}
      />
    );
  }

  return (
    <TopicGridView
      filteredTopics={filteredTopics}
      activeCategory={activeCategory}
      onCategoryChange={setActiveCategory}
      searchQuery={searchQuery}
      onSearchQueryChange={setSearchQuery}
      onSelectTopic={setSelectedTopic}
      categoryIcons={categoryIcons}
      severityColors={severityColors}
    />
  );
};

export default EducationCenter;
