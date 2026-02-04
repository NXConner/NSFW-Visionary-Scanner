/**
 * Text & Titles Panel
 * Animated titles, lower thirds, captions, watermarks
 */

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Plus,
  Trash2,
  MoveVertical,
  Sparkles,
} from "lucide-react";

export interface TextOverlay {
  id: string;
  type: "title" | "lowerThird" | "caption" | "watermark";
  text: string;
  subtitle?: string;
  position: { x: number; y: number };
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor: string;
  opacity: number;
  animation: "none" | "fadeIn" | "slideUp" | "typewriter" | "glitch";
  alignment: "left" | "center" | "right";
  startTime: number;
  duration: number;
}

export interface TextOverlaysState {
  overlays: TextOverlay[];
  activeOverlayId: string | null;
}

export const defaultTextState: TextOverlaysState = {
  overlays: [],
  activeOverlayId: null,
};

const OVERLAY_TEMPLATES = [
  { type: "title" as const, label: "Title", icon: <Type className="w-4 h-4" /> },
  { type: "lowerThird" as const, label: "Lower Third", icon: <MoveVertical className="w-4 h-4" /> },
  { type: "caption" as const, label: "Caption", icon: <AlignCenter className="w-4 h-4" /> },
  { type: "watermark" as const, label: "Watermark", icon: <Sparkles className="w-4 h-4" /> },
];

const ANIMATIONS = [
  { key: "none", label: "None" },
  { key: "fadeIn", label: "Fade In" },
  { key: "slideUp", label: "Slide Up" },
  { key: "typewriter", label: "Typewriter" },
  { key: "glitch", label: "Glitch" },
];

const FONTS = [
  { key: "Inter", label: "Inter" },
  { key: "Montserrat", label: "Montserrat" },
  { key: "Playfair Display", label: "Playfair" },
  { key: "Space Mono", label: "Mono" },
];

interface Props {
  state: TextOverlaysState;
  onChange: (state: TextOverlaysState) => void;
  currentTime: number;
}

export function TextTitlesPanel({ state, onChange, currentTime }: Props) {
  const addOverlay = (type: TextOverlay["type"]) => {
    const newOverlay: TextOverlay = {
      id: `text-${Date.now()}`,
      type,
      text:
        type === "title"
          ? "Title Text"
          : type === "lowerThird"
            ? "Name"
            : type === "caption"
              ? "Caption text"
              : "Watermark",
      subtitle: type === "lowerThird" ? "Subtitle" : undefined,
      position: { x: 50, y: type === "lowerThird" ? 85 : type === "caption" ? 90 : 50 },
      fontSize: type === "title" ? 48 : type === "lowerThird" ? 24 : 18,
      fontFamily: "Inter",
      color: "#ffffff",
      backgroundColor: type === "lowerThird" ? "rgba(0,0,0,0.7)" : "transparent",
      opacity: type === "watermark" ? 50 : 100,
      animation: type === "title" ? "fadeIn" : "none",
      alignment: "center",
      startTime: currentTime,
      duration: 5,
    };
    onChange({
      overlays: [...state.overlays, newOverlay],
      activeOverlayId: newOverlay.id,
    });
  };

  const updateOverlay = (id: string, updates: Partial<TextOverlay>) => {
    onChange({
      ...state,
      overlays: state.overlays.map(o => (o.id === id ? { ...o, ...updates } : o)),
    });
  };

  const removeOverlay = (id: string) => {
    onChange({
      overlays: state.overlays.filter(o => o.id !== id),
      activeOverlayId: state.activeOverlayId === id ? null : state.activeOverlayId,
    });
  };

  const activeOverlay = state.overlays.find(o => o.id === state.activeOverlayId);

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium flex items-center gap-2">
        <Type className="w-4 h-4" />
        Text & Titles
      </Label>

      {/* Add Templates */}
      <div className="grid grid-cols-4 gap-1">
        {OVERLAY_TEMPLATES.map(t => (
          <Button
            key={t.type}
            variant="outline"
            size="sm"
            onClick={() => addOverlay(t.type)}
            className="h-auto py-2 flex-col gap-0.5"
          >
            {t.icon}
            <span className="text-[9px]">{t.label}</span>
          </Button>
        ))}
      </div>

      {/* Overlay List */}
      {state.overlays.length > 0 && (
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {state.overlays.map(overlay => (
            <div
              key={overlay.id}
              className={`
                flex items-center justify-between p-2 rounded border
                ${overlay.id === state.activeOverlayId ? "border-primary bg-primary/5" : "border-border"}
              `}
            >
              <button
                type="button"
                onClick={() => onChange({ ...state, activeOverlayId: overlay.id })}
                className="min-w-0 flex-1 text-left"
                aria-pressed={overlay.id === state.activeOverlayId}
              >
                <div className="text-[10px] font-medium truncate">{overlay.text}</div>
                <div className="text-[9px] text-muted-foreground capitalize">{overlay.type}</div>
              </button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeOverlay(overlay.id)}
                className="h-6 w-6 p-0"
                aria-label="Remove overlay"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Edit Active Overlay */}
      {activeOverlay && (
        <div className="space-y-2 p-2 bg-muted/30 rounded-lg">
          <Input
            value={activeOverlay.text}
            onChange={e => updateOverlay(activeOverlay.id, { text: e.target.value })}
            placeholder="Text"
            className="h-8 text-xs"
          />
          {activeOverlay.type === "lowerThird" && (
            <Input
              value={activeOverlay.subtitle || ""}
              onChange={e => updateOverlay(activeOverlay.id, { subtitle: e.target.value })}
              placeholder="Subtitle"
              className="h-8 text-xs"
            />
          )}

          {/* Font Size */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <Label className="text-[10px]">Size</Label>
              <span className="text-[10px] text-muted-foreground">{activeOverlay.fontSize}px</span>
            </div>
            <Slider
              value={[activeOverlay.fontSize]}
              onValueChange={([v]) => updateOverlay(activeOverlay.id, { fontSize: v })}
              min={12}
              max={96}
              step={2}
            />
          </div>

          {/* Font Family */}
          <div className="grid grid-cols-4 gap-1">
            {FONTS.map(f => (
              <Button
                key={f.key}
                variant={activeOverlay.fontFamily === f.key ? "default" : "outline"}
                size="sm"
                onClick={() => updateOverlay(activeOverlay.id, { fontFamily: f.key })}
                className="h-6 text-[9px]"
              >
                {f.label}
              </Button>
            ))}
          </div>

          {/* Alignment */}
          <div className="flex gap-1">
            {(["left", "center", "right"] as const).map(align => (
              <Button
                key={align}
                variant={activeOverlay.alignment === align ? "default" : "outline"}
                size="sm"
                onClick={() => updateOverlay(activeOverlay.id, { alignment: align })}
                className="flex-1 h-7"
              >
                {align === "left" && <AlignLeft className="w-3 h-3" />}
                {align === "center" && <AlignCenter className="w-3 h-3" />}
                {align === "right" && <AlignRight className="w-3 h-3" />}
              </Button>
            ))}
          </div>

          {/* Animation */}
          <div className="space-y-1">
            <Label className="text-[10px]">Animation</Label>
            <div className="grid grid-cols-5 gap-1">
              {ANIMATIONS.map(a => (
                <Button
                  key={a.key}
                  variant={activeOverlay.animation === a.key ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    updateOverlay(activeOverlay.id, {
                      animation: a.key as TextOverlay["animation"],
                    })
                  }
                  className="h-6 text-[8px] px-1"
                >
                  {a.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <Label className="text-[10px]">Duration</Label>
              <span className="text-[10px] text-muted-foreground">{activeOverlay.duration}s</span>
            </div>
            <Slider
              value={[activeOverlay.duration]}
              onValueChange={([v]) => updateOverlay(activeOverlay.id, { duration: v })}
              min={1}
              max={30}
              step={0.5}
            />
          </div>

          {/* Opacity */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <Label className="text-[10px]">Opacity</Label>
              <span className="text-[10px] text-muted-foreground">{activeOverlay.opacity}%</span>
            </div>
            <Slider
              value={[activeOverlay.opacity]}
              onValueChange={([v]) => updateOverlay(activeOverlay.id, { opacity: v })}
              min={10}
              max={100}
              step={5}
            />
          </div>
        </div>
      )}

      {state.overlays.length === 0 && (
        <p className="text-[10px] text-muted-foreground text-center py-2">
          Add text overlays using the buttons above
        </p>
      )}
    </div>
  );
}
