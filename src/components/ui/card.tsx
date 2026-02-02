import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  } catch {
    return false;
  }
}

function uiFxFlags() {
  const d = typeof document !== "undefined" ? document.documentElement?.dataset : undefined;
  return {
    uiFx: d?.uiFx === "on",
    cards: d?.uiFxCards === "on",
    cardTilt: d?.uiFxCardTilt === "on",
    glow: d?.uiFxGlow === "on",
  };
}

function canHoverPointer(): boolean {
  try {
    return window.matchMedia?.("(hover: hover) and (pointer: fine)").matches ?? false;
  } catch {
    return false;
  }
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  const el = target as Element | null;
  if (!el?.closest) return false;
  return Boolean(
    el.closest(
      'button, a, input, textarea, select, option, [role="button"], [role="link"], [data-ui-fx-ignore], [data-tilt-ignore]',
    ),
  );
}

const cardVariants = cva("rounded-xl text-card-foreground", {
  variants: {
    variant: {
      default: "bg-card border border-border",
      glass: "glass-card glass-noise glass-reflect",
      gradient: "gradient-border",
      glow: "bg-card border border-border glow-primary",
      interactive:
        "bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10",
      stat: "glass-card glass-noise glass-reflect p-6 hover:border-primary/30 transition-all duration-300",
      lift: "bg-card border border-border card-lift",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant,
      onPointerMove,
      onPointerLeave,
      onPointerDown,
      onPointerUp,
      onPointerCancel,
      ...props
    },
    ref,
  ) => {
    const localRef = React.useRef<HTMLDivElement | null>(null);
    const touchActiveRef = React.useRef(false);

    const setRefs = (node: HTMLDivElement | null) => {
      localRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    };

    const reset = () => {
      const el = localRef.current;
      if (!el) return;
      el.style.setProperty("--ui-fx-active", "0");
      el.style.setProperty("--ui-fx-x", "50%");
      el.style.setProperty("--ui-fx-y", "50%");
      el.style.setProperty("--ui-tilt-x", "0");
      el.style.setProperty("--ui-tilt-y", "0");
    };

    const applyFromPointer = (e: React.PointerEvent<HTMLDivElement>) => {
      const el = localRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;

      const maxTilt = 10;
      el.style.setProperty("--ui-fx-active", "1");
      el.style.setProperty("--ui-fx-x", `${((px + 0.5) * 100).toFixed(2)}%`);
      el.style.setProperty("--ui-fx-y", `${((py + 0.5) * 100).toFixed(2)}%`);
      el.style.setProperty("--ui-tilt-x", `${(px * maxTilt).toFixed(3)}`);
      el.style.setProperty("--ui-tilt-y", `${(-py * maxTilt).toFixed(3)}`);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      const f = uiFxFlags();
      if (!f.uiFx || !f.cards) return onPointerMove?.(e);
      if (prefersReducedMotion()) return onPointerMove?.(e);

      const isMouse = e.pointerType === "mouse";
      const isTouchLike = e.pointerType === "touch" || e.pointerType === "pen";
      const hoverOk = isMouse && canHoverPointer();
      const touchOk = isTouchLike && touchActiveRef.current;
      const canUpdate =
        (f.cardTilt ? hoverOk || touchOk : false) || (f.glow ? hoverOk || touchOk : false);
      if (!canUpdate) return onPointerMove?.(e);

      applyFromPointer(e);
      return onPointerMove?.(e);
    };

    const handlePointerLeave = (e: React.PointerEvent<HTMLDivElement>) => {
      const f = uiFxFlags();
      if (f.uiFx && f.cards) reset();
      onPointerLeave?.(e);
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      const f = uiFxFlags();
      if (f.uiFx && f.cards && !prefersReducedMotion()) {
        if (
          (e.pointerType === "touch" || e.pointerType === "pen") &&
          !isInteractiveTarget(e.target)
        ) {
          touchActiveRef.current = true;
          applyFromPointer(e);
        }
      }
      onPointerDown?.(e);
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
      touchActiveRef.current = false;
      const f = uiFxFlags();
      if (f.uiFx && f.cards) reset();
      onPointerUp?.(e);
    };

    const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
      touchActiveRef.current = false;
      const f = uiFxFlags();
      if (f.uiFx && f.cards) reset();
      onPointerCancel?.(e);
    };

    return (
      <div
        ref={setRefs}
        className={cn(cardVariants({ variant, className }), "ui-fx-card")}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        {...props}
      />
    );
  },
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("text-2xl font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  ),
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants };
