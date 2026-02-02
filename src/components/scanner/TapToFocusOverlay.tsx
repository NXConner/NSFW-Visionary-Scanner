import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";

export type TapFocusFeedbackState = "focusing" | "locked" | "failed";

export function TapToFocusOverlay(props: {
  visible: boolean;
  xPct: number;
  yPct: number;
  state: TapFocusFeedbackState;
}) {
  const { visible, xPct, yPct, state } = props;
  const [show, setShow] = useState(visible);

  useEffect(() => {
    if (visible) setShow(true);
    else {
      const t = setTimeout(() => setShow(false), 150);
      return () => clearTimeout(t);
    }
  }, [visible]);

  if (!show) return null;

  const color =
    state === "locked"
      ? "hsl(var(--success))"
      : state === "failed"
        ? "hsl(var(--destructive))"
        : "hsl(var(--primary))";

  return (
    <div className="absolute inset-0 pointer-events-none z-40">
      <div
        className="absolute"
        style={{ left: `${xPct}%`, top: `${yPct}%`, transform: "translate(-50%, -50%)" }}
      >
        {/* Ripple */}
        <div
          className="absolute inset-0 rounded-full animate-ping"
          style={{ width: 44, height: 44, border: `2px solid ${color}`, opacity: 0.35 }}
        />

        {/* Brackets */}
        <div
          className="relative rounded-lg"
          style={{
            width: 44,
            height: 44,
            border: `2px solid ${color}`,
            boxShadow: `0 0 14px ${color}30`,
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            {state === "locked" ? (
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: `${color}22`, color }}
              >
                <Check className="w-4 h-4" />
              </div>
            ) : state === "failed" ? (
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: `${color}22`, color }}
              >
                <X className="w-4 h-4" />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
