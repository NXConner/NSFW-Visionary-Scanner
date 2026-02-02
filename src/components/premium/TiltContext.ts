import * as React from "react";
import type { MotionValue } from "framer-motion";

export type TiltContextValue = {
  enabled: boolean;
  sx: MotionValue<number>;
  sy: MotionValue<number>;
};

export const TiltContext = React.createContext<TiltContextValue | null>(null);

export function useTiltContext() {
  return React.useContext(TiltContext);
}
