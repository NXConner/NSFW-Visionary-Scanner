import { useCallback, useEffect, useRef, useState } from "react";
import type { TrackedObject } from "@/hooks/useObjectTracking";

export interface AutoTrackState {
  /** Currently selected track id, or null if none */
  selectedTrackId: number | null;
  /** The tracked object being auto-followed */
  trackedObject: TrackedObject | null;
  /** Whether we are actively tracking (following) the object */
  isTracking: boolean;
  /** Position for focus point (normalized 0-1) */
  focusPoint: { x: number; y: number } | null;
}

export interface UseObjectAutoTrackOptions {
  enabled: boolean;
  tracks: TrackedObject[];
  /** Callback when focus point changes (for tap-to-focus integration) */
  onFocusPointChange?: (point: { x: number; y: number } | null) => void;
  /** How often to update focus point when tracking (ms) */
  focusUpdateIntervalMs?: number;
}

/**
 * Hook for tap-to-select object auto-tracking.
 * When user taps on an object, it locks onto that object and continuously
 * updates the focus point to follow it.
 */
export function useObjectAutoTrack(options: UseObjectAutoTrackOptions) {
  const { enabled, tracks, onFocusPointChange, focusUpdateIntervalMs = 200 } = options;

  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const lastFocusUpdateRef = useRef<number>(0);

  // Find the currently tracked object
  const trackedObject = selectedTrackId != null
    ? tracks.find(t => t.trackId === selectedTrackId) ?? null
    : null;

  // Calculate focus point from tracked object center
  const focusPoint = trackedObject
    ? {
        x: (trackedObject.box.x + trackedObject.box.width / 2) / 100,
        y: (trackedObject.box.y + trackedObject.box.height / 2) / 100,
      }
    : null;

  // Update focus point when tracking
  useEffect(() => {
    if (!enabled || !isTracking || !focusPoint || !onFocusPointChange) return;

    const now = performance.now();
    if (now - lastFocusUpdateRef.current < focusUpdateIntervalMs) return;

    lastFocusUpdateRef.current = now;
    onFocusPointChange(focusPoint);
  }, [enabled, isTracking, focusPoint, onFocusPointChange, focusUpdateIntervalMs]);

  // Clear selection if tracked object disappears for too long
  useEffect(() => {
    if (!enabled || selectedTrackId == null) return;

    const trackStillExists = tracks.some(t => t.trackId === selectedTrackId);
    if (!trackStillExists) {
      // Give it a grace period before clearing
      const timeout = setTimeout(() => {
        const stillExists = tracks.some(t => t.trackId === selectedTrackId);
        if (!stillExists) {
          setSelectedTrackId(null);
          setIsTracking(false);
          onFocusPointChange?.(null);
        }
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [enabled, selectedTrackId, tracks, onFocusPointChange]);

  // Reset when disabled
  useEffect(() => {
    if (!enabled) {
      setSelectedTrackId(null);
      setIsTracking(false);
    }
  }, [enabled]);

  /**
   * Handle tap on screen to select an object at that position.
   * @param xPct x position in percent (0-100)
   * @param yPct y position in percent (0-100)
   */
  const handleTapToSelect = useCallback(
    (xPct: number, yPct: number) => {
      if (!enabled || tracks.length === 0) return null;

      // Find track whose bounding box contains the tap point
      const tappedTrack = tracks.find(t => {
        const { x, y, width, height } = t.box;
        return xPct >= x && xPct <= x + width && yPct >= y && yPct <= y + height;
      });

      if (tappedTrack) {
        setSelectedTrackId(tappedTrack.trackId);
        setIsTracking(true);

        // Immediately update focus
        const center = {
          x: (tappedTrack.box.x + tappedTrack.box.width / 2) / 100,
          y: (tappedTrack.box.y + tappedTrack.box.height / 2) / 100,
        };
        onFocusPointChange?.(center);
        return tappedTrack;
      }

      // Tapped outside all objects - deselect
      setSelectedTrackId(null);
      setIsTracking(false);
      onFocusPointChange?.(null);
      return null;
    },
    [enabled, tracks, onFocusPointChange],
  );

  /**
   * Select a specific track by ID
   */
  const selectTrack = useCallback(
    (trackId: number | null) => {
      setSelectedTrackId(trackId);
      setIsTracking(trackId != null);

      if (trackId != null) {
        const track = tracks.find(t => t.trackId === trackId);
        if (track) {
          const center = {
            x: (track.box.x + track.box.width / 2) / 100,
            y: (track.box.y + track.box.height / 2) / 100,
          };
          onFocusPointChange?.(center);
        }
      } else {
        onFocusPointChange?.(null);
      }
    },
    [tracks, onFocusPointChange],
  );

  /**
   * Stop tracking but keep selection
   */
  const pauseTracking = useCallback(() => {
    setIsTracking(false);
  }, []);

  /**
   * Resume tracking the selected object
   */
  const resumeTracking = useCallback(() => {
    if (selectedTrackId != null) {
      setIsTracking(true);
    }
  }, [selectedTrackId]);

  /**
   * Clear all tracking state
   */
  const clearTracking = useCallback(() => {
    setSelectedTrackId(null);
    setIsTracking(false);
    onFocusPointChange?.(null);
  }, [onFocusPointChange]);

  return {
    selectedTrackId,
    trackedObject,
    isTracking,
    focusPoint,
    handleTapToSelect,
    selectTrack,
    pauseTracking,
    resumeTracking,
    clearTracking,
  };
}
