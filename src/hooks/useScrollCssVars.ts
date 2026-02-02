import * as React from "react";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Updates CSS variables for scroll-reactive visuals (glass reflections, gradients).
 * Safe no-op on SSR, throttled via rAF.
 */
export function useScrollCssVars() {
  React.useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    let raf = 0;
    const root = document.documentElement;

    const update = () => {
      raf = 0;
      const y = window.scrollY || 0;
      const h = Math.max(1, document.body.scrollHeight - window.innerHeight);
      const pct = clamp((y / h) * 100, 0, 100);

      root.style.setProperty("--scroll-y", `${y.toFixed(0)}`);
      root.style.setProperty("--scroll-y-pct", `${pct.toFixed(2)}%`);
    };

    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
}
