import { useState, useEffect, useCallback } from "react";
import { safeLocalStorage } from "@/lib/storageErrorHandler";

export function useGenericStorage<T>(
  key: string,
  defaultValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = safeLocalStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setStoredValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      setValue(prev => {
        const resolvedValue =
          typeof newValue === "function" ? (newValue as (prev: T) => T)(prev) : newValue;
        const success = safeLocalStorage.setItem(key, JSON.stringify(resolvedValue));
        if (!success) {
          // If storage failed, still update state but warn user
        }
        return resolvedValue;
      });
    },
    [key],
  );

  return [value, setStoredValue];
}
