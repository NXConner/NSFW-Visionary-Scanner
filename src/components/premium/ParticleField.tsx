import * as React from "react";

import { cn } from "@/lib/utils";

export interface ParticleFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Particle density relative to area (higher = more). */
  density?: number;
  /** Connection distance in CSS px. */
  connectDistance?: number;
  /** Particle speed multiplier. */
  speed?: number;
  /** Maximum particles cap for safety. */
  maxParticles?: number;
  /** Force-pause animation (keeps DOM but stops rAF). */
  paused?: boolean;
}

type Pt = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  a: number;
};

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isCoarsePointer(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(pointer: coarse)").matches;
}

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

/**
 * Canvas particle field for subtle premium sections.
 * Auto-disables for reduced motion and coarse pointers (mobile touch).
 */
export function ParticleField({
  className,
  density = 0.00006,
  connectDistance = 120,
  speed = 1,
  maxParticles = 120,
  paused = false,
  ...props
}: ParticleFieldProps) {
  const hostRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const rafRef = React.useRef<number>(0);
  const ptsRef = React.useRef<Pt[]>([]);
  const pointerRef = React.useRef<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });
  const runningRef = React.useRef(false);
  const sizeRef = React.useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const themeRef = React.useRef<{ dot: string; line: string; at: number }>({
    dot: "rgba(255,255,255,0.15)",
    line: "rgba(255,255,255,0.06)",
    at: 0,
  });
  // FPS cap to prevent excessive CPU usage on high-refresh-rate displays
  const lastFrameTimeRef = React.useRef<number>(0);
  const TARGET_FPS = 30;
  const FRAME_INTERVAL = 1000 / TARGET_FPS;

  React.useEffect(() => {
    if (paused) return;
    if (prefersReducedMotion() || isCoarsePointer()) return;
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const resize = () => {
      const r = host.getBoundingClientRect();
      sizeRef.current = { w: r.width, h: r.height };
      canvas.width = Math.floor(r.width * dpr);
      canvas.height = Math.floor(r.height * dpr);
      canvas.style.width = `${r.width}px`;
      canvas.style.height = `${r.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const area = r.width * r.height;
      const count = Math.max(18, Math.min(maxParticles, Math.floor(area * density)));
      const existing = ptsRef.current;

      if (existing.length !== count) {
        const next: Pt[] = [];
        for (let i = 0; i < count; i++) {
          const p = existing[i];
          next.push(
            p ?? {
              x: rand(0, r.width),
              y: rand(0, r.height),
              vx: rand(-0.25, 0.25) * speed,
              vy: rand(-0.25, 0.25) * speed,
              r: rand(0.9, 1.8),
              a: rand(0.18, 0.42),
            },
          );
        }
        ptsRef.current = next;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      pointerRef.current = {
        x: e.clientX - r.left,
        y: e.clientY - r.top,
        active: true,
      };
    };
    const onPointerLeave = () => {
      pointerRef.current.active = false;
    };

    const isVisible = () => document.visibilityState === "visible";

    const tick = (currentTime: number) => {
      rafRef.current = 0;
      if (!runningRef.current || !isVisible()) return;

      // FPS cap - skip frame if not enough time has passed
      const elapsed = currentTime - lastFrameTimeRef.current;
      if (elapsed < FRAME_INTERVAL) {
        rafRef.current = window.requestAnimationFrame(tick);
        return;
      }
      lastFrameTimeRef.current = currentTime - (elapsed % FRAME_INTERVAL);

      const { w, h } = sizeRef.current;
      if (!w || !h) {
        rafRef.current = window.requestAnimationFrame(tick);
        return;
      }
      const pts = ptsRef.current;

      ctx.clearRect(0, 0, w, h);

      // Pull theme color from CSS variables (cache; avoid per-frame style computation).
      const now = performance.now();
      if (now - themeRef.current.at > 1000) {
        const styles = getComputedStyle(document.documentElement);
        const primary = styles.getPropertyValue("--primary").trim(); // "187 100% 42%"
        const accent = styles.getPropertyValue("--accent").trim();
        // Best-effort; fall back to RGBA if var parsing fails.
        const dot = primary
          ? `hsla(${primary.split(" ").join(",")}, 0.35)`
          : "rgba(255,255,255,0.15)";
        const line = accent
          ? `hsla(${accent.split(" ").join(",")}, 0.10)`
          : "rgba(255,255,255,0.06)";
        themeRef.current = { dot, line, at: now };
      }
      const { dot, line } = themeRef.current;

      // Pointer influence.
      const pointer = pointerRef.current;
      const pd = connectDistance;

      for (let i = 0; i < pts.length; i++) {
        const p = pts[i]!;
        p.x += p.vx;
        p.y += p.vy;

        // Bounce edges softly.
        if (p.x < 0) {
          p.x = 0;
          p.vx *= -1;
        } else if (p.x > w) {
          p.x = w;
          p.vx *= -1;
        }
        if (p.y < 0) {
          p.y = 0;
          p.vy *= -1;
        } else if (p.y > h) {
          p.y = h;
          p.vy *= -1;
        }

        // Gentle pointer drift.
        if (pointer.active) {
          const dx = pointer.x - p.x;
          const dy = pointer.y - p.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < pd * pd) {
            const f = (1 - Math.sqrt(d2) / pd) * 0.0045 * speed;
            p.vx += dx * f;
            p.vy += dy * f;
          }
        }

        // Dampen to avoid runaway.
        p.vx *= 0.985;
        p.vy *= 0.985;
      }

      // Lines
      ctx.strokeStyle = line;
      for (let i = 0; i < pts.length; i++) {
        const aPt = pts[i]!;
        for (let j = i + 1; j < pts.length; j++) {
          const bPt = pts[j]!;
          const dx = aPt.x - bPt.x;
          const dy = aPt.y - bPt.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < connectDistance) {
            const alpha = (1 - d / connectDistance) * 0.6;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.moveTo(aPt.x, aPt.y);
            ctx.lineTo(bPt.x, bPt.y);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;

      // Dots
      ctx.fillStyle = dot;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i]!;
        ctx.globalAlpha = p.a;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      rafRef.current = window.requestAnimationFrame(tick);
    };

    const start = () => {
      if (runningRef.current) return;
      runningRef.current = true;
      resize();
      rafRef.current = window.requestAnimationFrame(tick);
    };

    const stop = () => {
      runningRef.current = false;
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };

    const ro = new ResizeObserver(() => resize());
    ro.observe(host);

    host.addEventListener("pointermove", onPointerMove);
    host.addEventListener("pointerleave", onPointerLeave);

    const onVis = () => {
      if (document.visibilityState !== "visible") stop();
      else start();
    };
    document.addEventListener("visibilitychange", onVis);

    start();
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVis);
      host.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerleave", onPointerLeave);
      ro.disconnect();
    };
  }, [density, connectDistance, speed, maxParticles, paused]);

  return (
    <div ref={hostRef} className={cn("pointer-events-none absolute inset-0", className)} {...props}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
    </div>
  );
}
