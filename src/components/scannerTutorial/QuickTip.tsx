import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, X } from "lucide-react";

export const QuickTip = ({ tip, onDismiss }: { tip: string; onDismiss: () => void }) => (
  <div className="absolute bottom-4 left-4 right-4 z-30 animate-fade-in">
    <Card className="bg-primary/10 border-primary/20">
      <CardContent className="p-3 flex items-center gap-3">
        <Lightbulb className="w-5 h-5 text-primary flex-shrink-0" />
        <p className="text-sm flex-1">{tip}</p>
        <Button variant="ghost" size="sm" onClick={onDismiss}>
          <X className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  </div>
);
