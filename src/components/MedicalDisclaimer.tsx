import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  Shield,
  Heart,
  Info,
  CheckCircle,
  Stethoscope,
  FileWarning,
  BookOpen,
} from "lucide-react";
import { encryptData, decryptData } from "@/lib/encryption";
import {
  DISCLAIMER_DATE_KEY,
  DISCLAIMER_KEY,
  TAGLINE,
  disclaimerVersions,
} from "@/components/medicalDisclaimer/constants";

interface MedicalDisclaimerProps {
  mode?: "modal" | "inline" | "condensed" | "contextual";
  onAccept?: () => void;
  onClose?: () => void;
  showCheckbox?: boolean;
  forceShow?: boolean;
}

export const MedicalDisclaimer = ({
  mode = "inline",
  onAccept,
  onClose,
  showCheckbox = false,
  forceShow = false,
}: MedicalDisclaimerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasAccepted, setHasAccepted] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [acceptedDate, setAcceptedDate] = useState<string | null>(null);

  // Rotate through versions randomly
  const currentVersion = useMemo(() => {
    return disclaimerVersions[Math.floor(Math.random() * disclaimerVersions.length)];
  }, []);

  // Check if disclaimer was previously accepted
  useEffect(() => {
    const checkAcceptance = async () => {
      try {
        const accepted = localStorage.getItem(DISCLAIMER_KEY);
        const date = localStorage.getItem(DISCLAIMER_DATE_KEY);
        if (accepted === "true") {
          setHasAccepted(true);
          setAcceptedDate(date);
        } else if (mode === "modal" && !forceShow) {
          setIsOpen(true);
        }
      } catch (error) {
        // Error silently handled
      }
    };
    checkAcceptance();
  }, [mode, forceShow]);

  useEffect(() => {
    if (forceShow && mode === "modal") {
      setIsOpen(true);
    }
  }, [forceShow, mode]);

  const handleAccept = () => {
    const now = new Date().toISOString();
    localStorage.setItem(DISCLAIMER_KEY, "true");
    localStorage.setItem(DISCLAIMER_DATE_KEY, now);
    setHasAccepted(true);
    setAcceptedDate(now);
    setIsOpen(false);
    onAccept?.();
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  // Condensed version for footer/inline brief mentions
  if (mode === "condensed") {
    return (
      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="w-3 h-3 shrink-0 mt-0.5" />
        <p>
          <span className="font-medium">Medical Disclaimer:</span> This app is for educational
          purposes only and does not replace professional medical advice. {TAGLINE}
        </p>
      </div>
    );
  }

  // Contextual warning (brief reminder before health results)
  if (mode === "contextual") {
    return (
      <div className="p-3 rounded-lg bg-warning/10 border border-warning/30 mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
          <p className="text-xs text-warning">
            <span className="font-medium">Reminder:</span> Results are for informational purposes
            only. Always consult a healthcare provider for medical advice.
          </p>
        </div>
      </div>
    );
  }

  // Modal version (first launch)
  if (mode === "modal") {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-warning/20">
                <Stethoscope className="w-6 h-6 text-warning" />
              </div>
              <div>
                <DialogTitle className="text-xl">Medical Disclaimer</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Please read before continuing
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {/* Tagline */}
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 text-center">
              <p className="text-sm font-medium text-primary italic">"{TAGLINE}"</p>
            </div>

            {/* Main Content */}
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                {currentVersion.content}
              </p>
            </div>

            <Separator />

            {/* Key Points */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <FileWarning className="w-4 h-4 text-warning" />
                Key Points
              </h4>
              <ul className="space-y-1.5">
                {[
                  "This app does NOT provide medical diagnoses",
                  "Information is for educational purposes only",
                  "Always consult a qualified healthcare provider",
                  "Early medical intervention often leads to better outcomes",
                  "Your privacy is protected—all data stays on your device",
                ].map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <CheckCircle className="w-3 h-3 text-success shrink-0 mt-0.5" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            {/* Checkbox */}
            {showCheckbox && (
              <div className="flex items-start space-x-3 p-3 rounded-lg bg-secondary/50 border border-border">
                <Checkbox
                  id="disclaimer-accept"
                  checked={isChecked}
                  onCheckedChange={checked => setIsChecked(checked === true)}
                />
                <label
                  htmlFor="disclaimer-accept"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  I understand and acknowledge this disclaimer
                </label>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="gradient"
                className="flex-1"
                onClick={handleAccept}
                disabled={showCheckbox && !isChecked}
              >
                <CheckCircle className="w-4 h-4 mr-2" />I Understand
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Inline version (for settings/full page view)
  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-warning" />
          Medical Disclaimer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tagline */}
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 text-center">
          <p className="text-sm font-medium text-primary italic">"{TAGLINE}"</p>
        </div>

        {/* Version selector badge */}
        <Badge variant="outline" className="mb-2">
          {currentVersion.title}
        </Badge>

        {/* Main Content */}
        <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
          {currentVersion.content}
        </p>

        <Separator />

        {/* Key Points */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <FileWarning className="w-4 h-4 text-warning" />
            Remember
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { icon: AlertTriangle, text: "Not a medical device" },
              { icon: BookOpen, text: "Educational purposes only" },
              { icon: Stethoscope, text: "Consult healthcare providers" },
              { icon: Heart, text: "Early intervention helps" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
                <item.icon className="w-4 h-4 text-warning" />
                <span className="text-xs">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Acceptance Status */}
        {hasAccepted && acceptedDate && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-success/10 border border-success/30">
            <CheckCircle className="w-4 h-4 text-success" />
            <span className="text-xs text-success">
              Acknowledged on {new Date(acceptedDate).toLocaleDateString()}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
