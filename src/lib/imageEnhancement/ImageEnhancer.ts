/**
 * Main Image Enhancement Engine
 * Orchestrates all enhancement operations with caching and optimization
 */

import {
  reduceNoise,
  analyzeNoise,
  type NoiseReductionOptions,
  type NoiseReductionLevel,
} from "./noiseReduction";
import {
  sharpenImage,
  analyzeSharpness,
  type SharpeningOptions,
  type SharpeningMethod,
} from "./sharpening";
import {
  correctColors,
  autoWhiteBalance,
  analyzeColors,
  type ColorCorrectionOptions,
} from "./colorCorrection";
import {
  autoEnhance,
  analyzeImage,
  getEnhancementSuggestions,
  type AutoEnhanceOptions,
  type EnhancementPreset,
  type EnhancementResult,
  type ImageAnalysis,
} from "./autoEnhance";

export interface EnhancementState {
  originalImage: ImageData | null;
  currentImage: ImageData | null;
  history: HistoryEntry[];
  historyIndex: number;
  analysis: ImageAnalysis | null;
  isProcessing: boolean;
}

export interface HistoryEntry {
  image: ImageData;
  action: string;
  timestamp: number;
  parameters?: Record<string, unknown>;
}

export interface EnhancementSettings {
  noiseReduction: Partial<NoiseReductionOptions>;
  sharpening: Partial<SharpeningOptions>;
  colorCorrection: Partial<ColorCorrectionOptions>;
}

export type EnhancementEventType =
  | "stateChange"
  | "processingStart"
  | "processingEnd"
  | "error"
  | "historyChange";

export interface EnhancementEvent {
  type: EnhancementEventType;
  data?: unknown;
}

export type EnhancementListener = (event: EnhancementEvent) => void;

const MAX_HISTORY_SIZE = 20;

/**
 * ImageEnhancer - Main class for image enhancement operations
 */
export class ImageEnhancer {
  private state: EnhancementState;
  private listeners: Set<EnhancementListener>;
  private processingAbortController: AbortController | null = null;

  constructor() {
    this.state = {
      originalImage: null,
      currentImage: null,
      history: [],
      historyIndex: -1,
      analysis: null,
      isProcessing: false,
    };
    this.listeners = new Set();
  }

  /**
   * Subscribe to enhancement events
   */
  subscribe(listener: EnhancementListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: EnhancementEvent): void {
    this.listeners.forEach(listener => listener(event));
  }

  private setState(updates: Partial<EnhancementState>): void {
    this.state = { ...this.state, ...updates };
    this.emit({ type: "stateChange", data: this.state });
  }

  /**
   * Load an image for enhancement
   */
  async loadImage(
    source: HTMLImageElement | HTMLCanvasElement | ImageData | string,
  ): Promise<void> {
    this.emit({ type: "processingStart" });
    this.setState({ isProcessing: true });

    try {
      let imageData: ImageData;

      if (source instanceof ImageData) {
        imageData = source;
      } else if (typeof source === "string") {
        imageData = await this.loadImageFromUrl(source);
      } else {
        imageData = this.getImageDataFromElement(source);
      }

      const analysis = analyzeImage(imageData);

      this.setState({
        originalImage: this.cloneImageData(imageData),
        currentImage: imageData,
        history: [
          { image: this.cloneImageData(imageData), action: "Initial load", timestamp: Date.now() },
        ],
        historyIndex: 0,
        analysis,
        isProcessing: false,
      });

      this.emit({ type: "processingEnd" });
    } catch (error) {
      this.setState({ isProcessing: false });
      this.emit({ type: "error", data: error });
      throw error;
    }
  }

  private async loadImageFromUrl(url: string): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        resolve(this.getImageDataFromElement(img));
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  private getImageDataFromElement(element: HTMLImageElement | HTMLCanvasElement): ImageData {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    if (element instanceof HTMLImageElement) {
      canvas.width = element.naturalWidth;
      canvas.height = element.naturalHeight;
      ctx.drawImage(element, 0, 0);
    } else {
      canvas.width = element.width;
      canvas.height = element.height;
      ctx.drawImage(element, 0, 0);
    }

    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  private cloneImageData(imageData: ImageData): ImageData {
    return new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height);
  }

  /**
   * Add entry to history
   */
  private addToHistory(
    image: ImageData,
    action: string,
    parameters?: Record<string, unknown>,
  ): void {
    // Remove any future history if we're not at the end
    const newHistory = this.state.history.slice(0, this.state.historyIndex + 1);

    // Add new entry
    newHistory.push({
      image: this.cloneImageData(image),
      action,
      timestamp: Date.now(),
      parameters,
    });

    // Limit history size
    if (newHistory.length > MAX_HISTORY_SIZE) {
      newHistory.shift();
    }

    this.setState({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });

    this.emit({ type: "historyChange", data: newHistory });
  }

  /**
   * Get current state
   */
  getState(): EnhancementState {
    return { ...this.state };
  }

  /**
   * Get analysis of current image
   */
  getAnalysis(): ImageAnalysis | null {
    return this.state.analysis;
  }

  /**
   * Apply noise reduction
   */
  async applyNoiseReduction(options: Partial<NoiseReductionOptions> = {}): Promise<ImageData> {
    if (!this.state.currentImage) throw new Error("No image loaded");

    this.emit({ type: "processingStart" });
    this.setState({ isProcessing: true });

    try {
      const result = reduceNoise(this.state.currentImage, options);
      const analysis = analyzeImage(result);

      this.addToHistory(result, "Noise Reduction", options);
      this.setState({
        currentImage: result,
        analysis,
        isProcessing: false,
      });

      this.emit({ type: "processingEnd" });
      return result;
    } catch (error) {
      this.setState({ isProcessing: false });
      this.emit({ type: "error", data: error });
      throw error;
    }
  }

  /**
   * Apply sharpening
   */
  async applySharpening(options: Partial<SharpeningOptions> = {}): Promise<ImageData> {
    if (!this.state.currentImage) throw new Error("No image loaded");

    this.emit({ type: "processingStart" });
    this.setState({ isProcessing: true });

    try {
      const result = sharpenImage(this.state.currentImage, options);
      const analysis = analyzeImage(result);

      this.addToHistory(result, "Sharpening", options);
      this.setState({
        currentImage: result,
        analysis,
        isProcessing: false,
      });

      this.emit({ type: "processingEnd" });
      return result;
    } catch (error) {
      this.setState({ isProcessing: false });
      this.emit({ type: "error", data: error });
      throw error;
    }
  }

  /**
   * Apply color correction
   */
  async applyColorCorrection(options: Partial<ColorCorrectionOptions> = {}): Promise<ImageData> {
    if (!this.state.currentImage) throw new Error("No image loaded");

    this.emit({ type: "processingStart" });
    this.setState({ isProcessing: true });

    try {
      const result = correctColors(this.state.currentImage, options);
      const analysis = analyzeImage(result);

      this.addToHistory(result, "Color Correction", options);
      this.setState({
        currentImage: result,
        analysis,
        isProcessing: false,
      });

      this.emit({ type: "processingEnd" });
      return result;
    } catch (error) {
      this.setState({ isProcessing: false });
      this.emit({ type: "error", data: error });
      throw error;
    }
  }

  /**
   * Apply auto white balance
   */
  async applyAutoWhiteBalance(): Promise<ImageData> {
    if (!this.state.currentImage) throw new Error("No image loaded");

    this.emit({ type: "processingStart" });
    this.setState({ isProcessing: true });

    try {
      const result = autoWhiteBalance(this.state.currentImage);
      const analysis = analyzeImage(result);

      this.addToHistory(result, "Auto White Balance");
      this.setState({
        currentImage: result,
        analysis,
        isProcessing: false,
      });

      this.emit({ type: "processingEnd" });
      return result;
    } catch (error) {
      this.setState({ isProcessing: false });
      this.emit({ type: "error", data: error });
      throw error;
    }
  }

  /**
   * Apply auto enhancement
   */
  async applyAutoEnhance(options: Partial<AutoEnhanceOptions> = {}): Promise<EnhancementResult> {
    if (!this.state.currentImage) throw new Error("No image loaded");

    this.emit({ type: "processingStart" });
    this.setState({ isProcessing: true });

    try {
      const result = autoEnhance(this.state.currentImage, options);
      const analysis = analyzeImage(result.enhancedImage);

      this.addToHistory(
        result.enhancedImage,
        `Auto Enhance (${options.preset || "auto"})`,
        options,
      );
      this.setState({
        currentImage: result.enhancedImage,
        analysis,
        isProcessing: false,
      });

      this.emit({ type: "processingEnd" });
      return result;
    } catch (error) {
      this.setState({ isProcessing: false });
      this.emit({ type: "error", data: error });
      throw error;
    }
  }

  /**
   * Get enhancement suggestions
   */
  getSuggestions() {
    if (!this.state.currentImage) return null;
    return getEnhancementSuggestions(this.state.currentImage);
  }

  /**
   * Undo last enhancement
   */
  undo(): ImageData | null {
    if (this.state.historyIndex <= 0) return null;

    const newIndex = this.state.historyIndex - 1;
    const historyEntry = this.state.history[newIndex];

    this.setState({
      currentImage: this.cloneImageData(historyEntry.image),
      historyIndex: newIndex,
      analysis: analyzeImage(historyEntry.image),
    });

    this.emit({ type: "historyChange", data: this.state.history });
    return this.state.currentImage;
  }

  /**
   * Redo last undone enhancement
   */
  redo(): ImageData | null {
    if (this.state.historyIndex >= this.state.history.length - 1) return null;

    const newIndex = this.state.historyIndex + 1;
    const historyEntry = this.state.history[newIndex];

    this.setState({
      currentImage: this.cloneImageData(historyEntry.image),
      historyIndex: newIndex,
      analysis: analyzeImage(historyEntry.image),
    });

    this.emit({ type: "historyChange", data: this.state.history });
    return this.state.currentImage;
  }

  /**
   * Reset to original image
   */
  reset(): ImageData | null {
    if (!this.state.originalImage) return null;

    const original = this.cloneImageData(this.state.originalImage);
    this.addToHistory(original, "Reset to original");

    this.setState({
      currentImage: original,
      analysis: analyzeImage(original),
    });

    return original;
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.state.historyIndex > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.state.historyIndex < this.state.history.length - 1;
  }

  /**
   * Get history entries
   */
  getHistory(): HistoryEntry[] {
    return [...this.state.history];
  }

  /**
   * Export current image to various formats
   */
  async exportImage(format: "png" | "jpeg" | "webp" = "png", quality = 0.92): Promise<Blob> {
    if (!this.state.currentImage) throw new Error("No image loaded");

    const canvas = document.createElement("canvas");
    canvas.width = this.state.currentImage.width;
    canvas.height = this.state.currentImage.height;

    const ctx = canvas.getContext("2d")!;
    ctx.putImageData(this.state.currentImage, 0, 0);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        blob => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to export image"));
        },
        `image/${format}`,
        quality,
      );
    });
  }

  /**
   * Compare original with current (side by side data)
   */
  getComparisonData(): { original: ImageData; current: ImageData } | null {
    if (!this.state.originalImage || !this.state.currentImage) return null;

    return {
      original: this.cloneImageData(this.state.originalImage),
      current: this.cloneImageData(this.state.currentImage),
    };
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.listeners.clear();
    this.state = {
      originalImage: null,
      currentImage: null,
      history: [],
      historyIndex: -1,
      analysis: null,
      isProcessing: false,
    };
  }
}

// Export singleton instance
let enhancerInstance: ImageEnhancer | null = null;

export function getImageEnhancer(): ImageEnhancer {
  if (!enhancerInstance) {
    enhancerInstance = new ImageEnhancer();
  }
  return enhancerInstance;
}

// Re-export types and functions from submodules
export {
  analyzeNoise,
  reduceNoise,
  type NoiseReductionLevel,
  type NoiseReductionOptions,
} from "./noiseReduction";
export {
  analyzeSharpness,
  sharpenImage,
  type SharpeningMethod,
  type SharpeningOptions,
} from "./sharpening";
export {
  analyzeColors,
  correctColors,
  autoWhiteBalance,
  type ColorCorrectionOptions,
} from "./colorCorrection";
export {
  autoEnhance,
  analyzeImage,
  getEnhancementSuggestions,
  type EnhancementPreset,
  type AutoEnhanceOptions,
  type EnhancementResult,
} from "./autoEnhance";
