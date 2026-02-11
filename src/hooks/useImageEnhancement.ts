/**
 * useImageEnhancement Hook
 * React hook for image enhancement operations
 */

import { useState, useCallback, useEffect, useRef } from "react";
import {
  ImageEnhancer,
  getImageEnhancer,
  type EnhancementState,
  type EnhancementResult,
  type AutoEnhanceOptions,
  type EnhancementPreset,
  type NoiseReductionOptions,
  type NoiseReductionLevel,
  type SharpeningOptions,
  type ColorCorrectionOptions,
  type ImageAnalysis,
  type HistoryEntry,
} from "@/lib/imageEnhancement";

export interface UseImageEnhancementOptions {
  autoAnalyze?: boolean;
  onError?: (error: Error) => void;
  onEnhancementComplete?: (result: EnhancementResult) => void;
}

export interface UseImageEnhancementReturn {
  // State
  originalImage: ImageData | null;
  currentImage: ImageData | null;
  analysis: ImageAnalysis | null;
  isProcessing: boolean;
  canUndo: boolean;
  canRedo: boolean;
  history: HistoryEntry[];
  historyIndex: number;

  // Actions
  loadImage: (source: HTMLImageElement | HTMLCanvasElement | ImageData | string) => Promise<void>;
  applyNoiseReduction: (options?: Partial<NoiseReductionOptions>) => Promise<ImageData>;
  applySharpening: (options?: Partial<SharpeningOptions>) => Promise<ImageData>;
  applyColorCorrection: (options?: Partial<ColorCorrectionOptions>) => Promise<ImageData>;
  applyAutoWhiteBalance: () => Promise<ImageData>;
  applyAutoEnhance: (options?: Partial<AutoEnhanceOptions>) => Promise<EnhancementResult>;
  undo: () => ImageData | null;
  redo: () => ImageData | null;
  reset: () => ImageData | null;
  exportImage: (format?: "png" | "jpeg" | "webp", quality?: number) => Promise<Blob>;
  getSuggestions: () => ReturnType<ImageEnhancer["getSuggestions"]>;
  getComparisonData: () => { original: ImageData; current: ImageData } | null;

  // Quick actions
  quickEnhance: (preset?: EnhancementPreset) => Promise<EnhancementResult>;
  adjustBrightness: (value: number) => Promise<ImageData>;
  adjustContrast: (value: number) => Promise<ImageData>;
  adjustSaturation: (value: number) => Promise<ImageData>;
}

export function useImageEnhancement(
  options: UseImageEnhancementOptions = {},
): UseImageEnhancementReturn {
  const { autoAnalyze = true, onError, onEnhancementComplete } = options;

  const enhancerRef = useRef<ImageEnhancer>(getImageEnhancer());

  const [state, setState] = useState<EnhancementState>(() => enhancerRef.current.getState());

  // Subscribe to enhancer events
  useEffect(() => {
    const enhancer = enhancerRef.current;

    const unsubscribe = enhancer.subscribe(event => {
      if (event.type === "stateChange") {
        setState(enhancer.getState());
      } else if (event.type === "error" && onError) {
        onError(event.data as Error);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [onError]);

  const loadImage = useCallback(
    async (source: HTMLImageElement | HTMLCanvasElement | ImageData | string) => {
      try {
        await enhancerRef.current.loadImage(source);
      } catch (error) {
        onError?.(error as Error);
        throw error;
      }
    },
    [onError],
  );

  const applyNoiseReduction = useCallback(async (opts: Partial<NoiseReductionOptions> = {}) => {
    return enhancerRef.current.applyNoiseReduction(opts);
  }, []);

  const applySharpening = useCallback(async (opts: Partial<SharpeningOptions> = {}) => {
    return enhancerRef.current.applySharpening(opts);
  }, []);

  const applyColorCorrection = useCallback(async (opts: Partial<ColorCorrectionOptions> = {}) => {
    return enhancerRef.current.applyColorCorrection(opts);
  }, []);

  const applyAutoWhiteBalance = useCallback(async () => {
    return enhancerRef.current.applyAutoWhiteBalance();
  }, []);

  const applyAutoEnhance = useCallback(
    async (opts: Partial<AutoEnhanceOptions> = {}) => {
      const result = await enhancerRef.current.applyAutoEnhance(opts);
      onEnhancementComplete?.(result);
      return result;
    },
    [onEnhancementComplete],
  );

  const undo = useCallback(() => {
    return enhancerRef.current.undo();
  }, []);

  const redo = useCallback(() => {
    return enhancerRef.current.redo();
  }, []);

  const reset = useCallback(() => {
    return enhancerRef.current.reset();
  }, []);

  const exportImage = useCallback(
    async (format: "png" | "jpeg" | "webp" = "png", quality = 0.92) => {
      return enhancerRef.current.exportImage(format, quality);
    },
    [],
  );

  const getSuggestions = useCallback(() => {
    return enhancerRef.current.getSuggestions();
  }, []);

  const getComparisonData = useCallback(() => {
    return enhancerRef.current.getComparisonData();
  }, []);

  // Quick actions
  const quickEnhance = useCallback(
    async (preset: EnhancementPreset = "auto") => {
      const result = await enhancerRef.current.applyAutoEnhance({ preset, intensity: 50 });
      onEnhancementComplete?.(result);
      return result;
    },
    [onEnhancementComplete],
  );

  const adjustBrightness = useCallback(async (value: number) => {
    return enhancerRef.current.applyColorCorrection({ brightness: value });
  }, []);

  const adjustContrast = useCallback(async (value: number) => {
    return enhancerRef.current.applyColorCorrection({ contrast: value });
  }, []);

  const adjustSaturation = useCallback(async (value: number) => {
    return enhancerRef.current.applyColorCorrection({ saturation: value });
  }, []);

  return {
    // State
    originalImage: state.originalImage,
    currentImage: state.currentImage,
    analysis: state.analysis,
    isProcessing: state.isProcessing,
    canUndo: enhancerRef.current.canUndo(),
    canRedo: enhancerRef.current.canRedo(),
    history: state.history,
    historyIndex: state.historyIndex,

    // Actions
    loadImage,
    applyNoiseReduction,
    applySharpening,
    applyColorCorrection,
    applyAutoWhiteBalance,
    applyAutoEnhance,
    undo,
    redo,
    reset,
    exportImage,
    getSuggestions,
    getComparisonData,

    // Quick actions
    quickEnhance,
    adjustBrightness,
    adjustContrast,
    adjustSaturation,
  };
}

export default useImageEnhancement;
