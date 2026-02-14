import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import type { Position } from "@/components/positionsGallery/model";

export function EducationTab(props: { position: Position }): JSX.Element {
  const { position } = props;

  return (
    <div className="space-y-4 mt-4">
      <Card>
        <CardContent className="pt-6">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-400" /> Educational Information
          </h4>
          <div className="space-y-4">
            <div>
              <h5 className="font-medium mb-2">Stimulation Types</h5>
              <div className="flex flex-wrap gap-2">
                {position.stimulationType.map((type, i) => (
                  <Badge key={i} variant="outline">
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h5 className="font-medium mb-2">Physical Requirements</h5>
              <p className="text-sm text-muted-foreground">
                Flexibility Level: <strong>{position.requiredFlexibility}</strong>
              </p>
              <p className="text-sm text-muted-foreground">
                Intimacy Level: <strong>{position.intimacyLevel}</strong>
              </p>
            </div>
            <div>
              <h5 className="font-medium mb-2">Best For</h5>
              <p className="text-sm text-muted-foreground">
                This position is ideal for {position.tags.join(", ")} experiences.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
