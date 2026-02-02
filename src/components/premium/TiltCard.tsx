import * as React from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";

import { Card, type CardProps } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TiltProvider } from "./TiltProvider";

export interface TiltCardProps extends Omit<CardProps, "ref"> {
  /** Optional wrapper className (perspective container). */
  containerClassName?: string;
  /** Max rotation in degrees. */
  maxTilt?: number;
  /** 3D perspective in px. */
  perspective?: number;
  /** Adds a cursor-following glow layer. */
  glow?: boolean;
  /**
   * Enables touch/pen interaction.
   * On touch devices, tilt is applied only while the user is actively touching/dragging
   * (so it doesn't interfere with scrolling).
   */
  touch?: boolean;
  /** Disables tilt even on desktop. */
  disabled?: boolean;
}

function canHoverTilt(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

function canTouchTilt(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return (
    window.matchMedia("(any-pointer: coarse)").matches ||
    window.matchMedia("(pointer: coarse)").matches
  );
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  const el = target as Element | null;
  if (!el?.closest) return false;
  return Boolean(
    el.closest(
      'button, a, input, textarea, select, option, [role="button"], [role="link"], [data-tilt-ignore]',
    ),
  );
}

export function TiltCard({
  containerClassName,
  className,
  children,
  maxTilt = 10,
  perspective = 900,
  glow = true,
  touch = true,
  disabled = false,
  variant = "interactive",
  ...props
}: TiltCardProps) {
  const reduceMotion = useReducedMotion();
  const [hoverEnabled, setHoverEnabled] = React.useState(false);
  const [touchCapable, setTouchCapable] = React.useState(false);
  const [touchActive, setTouchActive] = React.useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  const sx = useSpring(mx, { stiffness: 220, damping: 24, mass: 0.7 });
  const sy = useSpring(my, { stiffness: 220, damping: 24, mass: 0.7 });

  const rotateX = useTransform(sy, v => `${(-v * maxTilt).toFixed(3)}deg`);
  const rotateY = useTransform(sx, v => `${(v * maxTilt).toFixed(3)}deg`);

  const glowX = useTransform(sx, v => `${((v + 0.5) * 100).toFixed(2)}%`);
  const glowY = useTransform(sy, v => `${((v + 0.5) * 100).toFixed(2)}%`);
  const glowOpacity = useTransform(sx, v => Math.max(0, Math.min(1, Math.abs(v) * 0.9 + 0.15)));

  React.useEffect(() => {
    if (disabled || reduceMotion) {
      setHoverEnabled(false);
      setTouchCapable(false);
      setTouchActive(false);
      return;
    }
    setHoverEnabled(canHoverTilt());
    setTouchCapable(canTouchTilt());
  }, [disabled, reduceMotion]);

  const enabled = hoverEnabled || (touch && touchCapable && touchActive);

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!enabled) return;
    const isMouse = e.pointerType === "mouse";
    const isTouchLike = e.pointerType === "touch" || e.pointerType === "pen";
    const canUpdate = (hoverEnabled && isMouse) || (touch && touchActive && isTouchLike);
    if (!canUpdate) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    mx.set(px);
    my.set(py);
  };

  const reset = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <div ref={ref} className={cn("relative", containerClassName)} style={{ perspective }}>
      <motion.div
        onPointerDown={e => {
          if (disabled || reduceMotion) return;
          if (!touch || !touchCapable) return;
          if (e.pointerType !== "touch" && e.pointerType !== "pen") return;
          if (isInteractiveTarget(e.target)) return;
          setTouchActive(true);
          onPointerMove(e);
        }}
        onPointerUp={() => {
          if (!touchActive) return;
          setTouchActive(false);
          reset();
        }}
        onPointerCancel={() => {
          if (!touchActive) return;
          setTouchActive(false);
          reset();
        }}
        onPointerMove={onPointerMove}
        onPointerLeave={e => {
          if (!hoverEnabled || e.pointerType !== "mouse") return;
          reset();
        }}
        style={{
          rotateX: enabled ? rotateX : undefined,
          rotateY: enabled ? rotateY : undefined,
          transformStyle: "preserve-3d",
        }}
        whileHover={hoverEnabled ? { scale: 1.01 } : undefined}
        whileTap={touch && touchCapable ? { scale: 0.985 } : undefined}
        className="relative"
      >
        <TiltProvider value={{ enabled, sx, sy }}>
          <Card
            variant={variant}
            {...props}
            className={cn("relative overflow-hidden", className)}
            style={{ transformStyle: "preserve-3d" }}
          >
            {children}
            {glow && enabled && (
              <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-0"
                style={{
                  opacity: glowOpacity,
                  background:
                    "radial-gradient(circle at var(--gx, 50%) var(--gy, 50%), hsl(var(--primary) / 0.22), transparent 55%)",
                  ["--gx" as any]: glowX,
                  ["--gy" as any]: glowY,
                  mixBlendMode: "screen",
                }}
              />
            )}
          </Card>
        </TiltProvider>
      </motion.div>
    </div>
  );
}
