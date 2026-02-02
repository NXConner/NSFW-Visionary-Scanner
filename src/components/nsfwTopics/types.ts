export type NsfwTopic = {
  topicId: string;
  displayName: string;
  description: string | null;
  requiresFeatureId: string;
  sortOrder: number;
};

export type NsfwTopicLibraryItem = {
  id: string;
  topicId: string;
  title: string;
  summary: string | null;
  body: string | null;
  resources: Array<{ label: string; url: string }> | null;
  tags: string[];
  contentRating: "educational" | "demonstrative" | "explicit";
  requiresFeatureId: string;
};
