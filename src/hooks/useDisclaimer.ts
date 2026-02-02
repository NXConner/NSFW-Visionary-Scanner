import { useEffect, useState } from "react";
import { DISCLAIMER_DATE_KEY, DISCLAIMER_KEY } from "@/components/medicalDisclaimer/constants";

export function useDisclaimer(): {
  hasAccepted: boolean;
  isLoading: boolean;
  resetDisclaimer: () => void;
} {
  const [hasAccepted, setHasAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const accepted = localStorage.getItem(DISCLAIMER_KEY);
    setHasAccepted(accepted === "true");
    setIsLoading(false);
  }, []);

  const resetDisclaimer = () => {
    localStorage.removeItem(DISCLAIMER_KEY);
    localStorage.removeItem(DISCLAIMER_DATE_KEY);
    setHasAccepted(false);
  };

  return { hasAccepted, isLoading, resetDisclaimer };
}
