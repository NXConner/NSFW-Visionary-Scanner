import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Camera } from "lucide-react";

export function CaptureFlashOverlay(props: { enabled: boolean; nonce: number }) {
  const { enabled, nonce } = props;
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    if (nonce <= 0) return;
    setShow(true);
    const t1 = setTimeout(() => setShow(false), 120);
    return () => clearTimeout(t1);
  }, [enabled, nonce]);

  if (!enabled || !show) return null;

  return (
    <div className="absolute inset-0 z-50 pointer-events-none">
      <div className="absolute inset-0 bg-white/70 animate-fade-out" />
      <div className="absolute top-14 left-1/2 -translate-x-1/2">
        <Badge className="bg-success/90 text-success-foreground">
          <Camera className="w-3 h-3 mr-1" />
          Captured!
        </Badge>
      </div>
    </div>
  );
}
