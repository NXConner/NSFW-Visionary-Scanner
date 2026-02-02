import * as React from "react";
import { TiltContext, type TiltContextValue } from "./TiltContext";

export function TiltProvider({
  value,
  children,
}: {
  value: TiltContextValue;
  children: React.ReactNode;
}) {
  return <TiltContext.Provider value={value}>{children}</TiltContext.Provider>;
}
