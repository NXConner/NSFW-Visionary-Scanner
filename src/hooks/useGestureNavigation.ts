import { MutableRefObject, useMemo, useRef } from "react";
import { useGesture } from "@use-gesture/react";

interface GestureNavigationOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  enabled?: boolean;
}

export const useGestureNavigation = <T extends HTMLElement = HTMLDivElement>({
  onSwipeLeft,
  onSwipeRight,
  threshold = 40,
  enabled = true,
}: GestureNavigationOptions): MutableRefObject<T | null> => {
  const ref = useRef<T | null>(null);
  const options = useMemo(
    () => ({ onSwipeLeft, onSwipeRight, threshold, enabled }),
    [onSwipeLeft, onSwipeRight, threshold, enabled],
  );

  useGesture(
    {
      onDragEnd: state => {
        if (!options.enabled) return;
        const [deltaX] = state.offset;
        if (Math.abs(deltaX) < options.threshold) return;
        if (deltaX > 0) {
          options.onSwipeRight?.();
        } else {
          options.onSwipeLeft?.();
        }
      },
    },
    {
      target: ref,
      eventOptions: { passive: true },
      drag: { axis: "x" },
    },
  );

  return ref;
};
