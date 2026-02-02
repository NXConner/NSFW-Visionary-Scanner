import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "ui-fx-btn inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-300 transform-gpu active:scale-[0.98] active:translate-y-[0.5px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:shadow-[0_0_0_6px_hsl(var(--primary)/0.12)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 btn-ripple",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 btn-ripple",
        outline:
          "border border-border bg-transparent hover:bg-secondary hover:text-secondary-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-secondary hover:text-secondary-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        gradient:
          "gradient-primary text-primary-foreground hover:opacity-90 hover:shadow-lg hover:shadow-primary/25 font-semibold btn-ripple",
        glass: "glass hover:bg-secondary/40 text-foreground border-0",
        glow: "bg-primary text-primary-foreground glow-primary hover:opacity-90 font-semibold btn-ripple",
        hero: "gradient-primary text-primary-foreground text-base px-8 py-4 rounded-xl font-semibold hover:scale-105 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 btn-ripple",
        scan: "bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 hover:border-primary/50 font-medium",
        bounce: "bg-primary text-primary-foreground hover:bg-primary/90 icon-bounce btn-ripple",
        // Premium variants from PREMIUM_ENHANCEMENTS.md
        premium:
          "bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black font-semibold hover:shadow-xl hover:shadow-amber-500/30 hover:scale-[1.02] btn-ripple animate-shimmer bg-[length:200%_100%]",
        infinity:
          "bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-400 text-white font-bold hover:shadow-xl hover:shadow-purple-500/40 hover:scale-[1.02] btn-ripple animate-shimmer bg-[length:200%_100%]",
        neomorph:
          "bg-card shadow-[8px_8px_16px_hsl(var(--background)),_-8px_-8px_16px_hsl(var(--muted)/0.5)] hover:shadow-[4px_4px_8px_hsl(var(--background)),_-4px_-4px_8px_hsl(var(--muted)/0.5)] active:shadow-[inset_4px_4px_8px_hsl(var(--background)),_inset_-4px_-4px_8px_hsl(var(--muted)/0.3)] text-foreground",
        success:
          "bg-success text-success-foreground hover:bg-success/90 hover:shadow-lg hover:shadow-success/25 btn-ripple",
        warning:
          "bg-warning text-warning-foreground hover:bg-warning/90 hover:shadow-lg hover:shadow-warning/25 btn-ripple",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-lg px-8",
        xl: "h-14 rounded-xl px-10 text-base",
        "2xl": "h-16 rounded-2xl px-12 text-lg font-bold",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const resolvedProps = asChild ? props : { ...props, type: props.type ?? "button" };
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...resolvedProps}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
