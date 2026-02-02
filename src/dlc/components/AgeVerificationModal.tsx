/**
 * Age Verification Modal
 * Ensures users are 18+ before accessing adult content
 */

import React, { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield, AlertTriangle } from "lucide-react";
import { useAgeVerification } from "../hooks/useDLCContent";

interface AgeVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified?: () => void;
}

export function AgeVerificationModal({
  isOpen,
  onClose,
  onVerified,
}: AgeVerificationModalProps): React.ReactElement {
  const { verify, isVerifying, error } = useAgeVerification();
  const [age, setAge] = useState<string>("");
  const [consent, setConsent] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleVerify = async () => {
    const ageNum = parseInt(age, 10);

    if (isNaN(ageNum) || ageNum < 18) {
      return;
    }

    if (!consent || !termsAccepted) {
      return;
    }

    const success = await verify(ageNum, consent);

    if (success) {
      onVerified?.();
      onClose();
    }
  };

  const isValid = age && parseInt(age, 10) >= 18 && consent && termsAccepted;

  // Generate age options (18-99)
  const ageOptions = Array.from({ length: 82 }, (_, i) => i + 18);

  return (
    <AlertDialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-purple-500/10">
              <Shield className="h-6 w-6 text-purple-500" />
            </div>
            <AlertDialogTitle>Age Verification Required</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-4">
            <p>
              This content is intended for adults only (18+). Please verify your age to continue.
            </p>

            {/* Age Selection */}
            <div className="space-y-2">
              <Label htmlFor="age">Select your age</Label>
              <Select value={age} onValueChange={setAge}>
                <SelectTrigger>
                  <SelectValue placeholder="Select age" />
                </SelectTrigger>
                <SelectContent>
                  {ageOptions.map(a => (
                    <SelectItem key={a} value={a.toString()}>
                      {a} years old
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Consent Checkboxes */}
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="consent"
                  checked={consent}
                  onCheckedChange={checked => setConsent(checked === true)}
                />
                <Label htmlFor="consent" className="text-sm leading-tight cursor-pointer">
                  I confirm that I am at least 18 years of age and wish to view adult content
                </Label>
              </div>

              <div className="flex items-start gap-2">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={checked => setTermsAccepted(checked === true)}
                />
                <Label htmlFor="terms" className="text-sm leading-tight cursor-pointer">
                  I agree to the Terms of Service and Privacy Policy for adult content
                </Label>
              </div>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                By proceeding, you confirm that you are legally permitted to view adult content in
                your jurisdiction. Misrepresenting your age is a violation of our terms.
              </p>
            </div>

            {/* Error */}
            {error && <p className="text-sm text-red-500">{error}</p>}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleVerify}
            disabled={!isValid || isVerifying}
            className="bg-purple-500 hover:bg-purple-600"
          >
            {isVerifying ? "Verifying..." : "Verify & Continue"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
