import { useEffect, useState } from "react";
import { listAddonContributions } from "./registry";
import type { AddonContributions } from "./types";

export function useAddonContributions(): AddonContributions[] {
  const [contribs, setContribs] = useState<AddonContributions[]>(() => listAddonContributions());

  useEffect(() => {
    const onChange = () => setContribs(listAddonContributions());
    window.addEventListener("addons-changed", onChange as EventListener);
    return () => window.removeEventListener("addons-changed", onChange as EventListener);
  }, []);

  return contribs;
}

