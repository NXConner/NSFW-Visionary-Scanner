import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Brain, Search } from "lucide-react";
import type { BookmarkContentType, EducationQA } from "../types";

export function QATab({
  loading,
  searchQuery,
  onSearchQueryChange,
  qa,
  onHelpful,
  onBookmark,
}: {
  loading: boolean;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  qa: EducationQA[];
  onHelpful: (qaId: string, helpful: boolean) => void;
  onBookmark: (contentType: BookmarkContentType, contentId: string) => void;
}): JSX.Element {
  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search questions..."
          value={searchQuery}
          onChange={e => onSearchQueryChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : qa.length > 0 ? (
        <div className="space-y-4">
          {qa.map(item => (
            <Card key={item.id} variant="glass">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{item.question}</h3>
                    <p className="text-muted-foreground">{item.answer}</p>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex gap-2">
                      {item.category && <Badge variant="outline">{item.category}</Badge>}
                      {item.expert_verified && (
                        <Badge className="bg-green-500">Expert Verified</Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => onHelpful(item.id!, true)}>
                        Helpful ({item.helpful_count || 0})
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onBookmark("qa", item.id!)}>
                        Bookmark
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No Q&amp;A found. Try a different search.</p>
        </div>
      )}
    </div>
  );
}
