import { createContext } from "react";

import type { DLCContextValue } from "./types";

export const DLCContext = createContext<DLCContextValue | null>(null);
