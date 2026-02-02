/**
 * Update Source Warning Modal
 * Warns users that installing DLC will change their update source
 */

import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, ExternalLink, Info } from "lucide-react";
import { useUpdateSource } from "../hooks/useDLCContent";

interface UpdateSourceWarningProps {
  isOpen: boolean;
  onClose: () => void;
  onAcknowledge?: () => void;
}

export function UpdateSourceWarning({
  isOpen,
  onClose,
  onAcknowledge,
}: UpdateSourceWarningProps): React.ReactElement {
  const { acknowledge } = useUpdateSource();

  const handleAcknowledge = () => {
    acknowledge();
    onAcknowledge?.();
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-amber-500/10">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
            </div>
            <AlertDialogTitle>Important: Update Source Change</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-4">
            <p>
              Installing this add-on will change how you receive app updates. Please read the
              following information carefully:
            </p>

            {/* Info Box */}
            <div className="space-y-3 p-4 rounded-lg bg-muted">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">After installing any add-on:</p>
                  <ul className="mt-1 space-y-1 text-sm text-muted-foreground list-disc list-inside">
                    <li>Future app updates will come from our official website</li>
                    <li>
                      You will no longer receive updates from the Google Play Store or Apple App
                      Store
                    </li>
                    <li>This is required due to content policies on app stores</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className="space-y-2">
              <p className="font-medium text-sm">Benefits of website updates:</p>
              <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                <li>Access to all premium features without restrictions</li>
                <li>Faster update releases</li>
                <li>Direct support from our team</li>
                <li>Exclusive website-only content</li>
              </ul>
            </div>

            {/* How it works */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <ExternalLink className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                When updates are available, you'll receive a notification in the app with a link to
                download the latest version from our website.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleAcknowledge}
            className="bg-amber-500 hover:bg-amber-600"
          >
            I Understand, Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
