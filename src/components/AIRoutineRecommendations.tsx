import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Lightbulb } from "lucide-react";

interface AIRoutineRecommendationsProps {
  experienceLevel?: string;
  goals?: string[];
}

export const AIRoutineRecommendations: React.FC<AIRoutineRecommendationsProps> = ({
  experienceLevel = "beginner",
  goals = [],
}) => {
  const recommendations = [
    "Start with basic exercises and gradually increase intensity",
    "Maintain consistency with your routine",
    "Track your progress regularly",
    "Listen to your body and rest when needed",
  ];

  return (
    <Card className="glass-morphism">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          AI Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {recommendations.map(rec => (
            <li key={rec} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              {rec}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default AIRoutineRecommendations;
