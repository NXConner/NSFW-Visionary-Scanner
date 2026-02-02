import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, History, ChevronRight } from "lucide-react";

export function PrivacySecurityCard() {
  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Privacy & Security
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Your data is encrypted and stored locally. No cloud sync, no tracking.
        </p>
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-between"
            onClick={() => {
              window.location.hash = "privacy";
              window.dispatchEvent(new CustomEvent("navigate-tab", { detail: "privacy" }));
            }}
          >
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Privacy Dashboard
            </span>
            <ChevronRight className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            className="w-full justify-between"
            onClick={() => {
              window.location.hash = "activity";
              window.dispatchEvent(new CustomEvent("navigate-tab", { detail: "activity" }));
            }}
          >
            <span className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Activity History
            </span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
