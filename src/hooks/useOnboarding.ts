import { useEffect, useState } from "react";

const ONBOARDING_KEY = "morphoscan_onboarding_complete";

export function useOnboarding(): {
  showOnboarding: boolean;
  setShowOnboarding: React.Dispatch<React.SetStateAction<boolean>>;
  resetOnboarding: () => void;
} {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    try {
      const completed = localStorage.getItem(ONBOARDING_KEY);
      if (!completed) {
        setShowOnboarding(true);
      }
    } catch {
      // If localStorage is not available, skip onboarding
      setShowOnboarding(false);
    }
  }, []);

  const resetOnboarding = () => {
    try {
      localStorage.removeItem(ONBOARDING_KEY);
      setShowOnboarding(true);
    } catch {
      // Ignore errors
    }
  };

  return { showOnboarding, setShowOnboarding, resetOnboarding };
}
