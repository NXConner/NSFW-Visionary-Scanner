import React, { useState, useEffect, useRef, useCallback } from "react";
import { Scan } from "lucide-react";

export const TacticalScannerBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [isInteracting, setIsInteracting] = useState(false);
  const [glitchActive, setGlitchActive] = useState(false);

  // Random glitch effect
  useEffect(() => {
    const glitchInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        setGlitchActive(true);
        setTimeout(() => setGlitchActive(false), 150 + Math.random() * 200);
      }
    }, 2000);
    return () => clearInterval(glitchInterval);
  }, []);

  // Mouse/touch interaction handler
  const handleInteraction = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    setMousePos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
    setIsInteracting(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      handleInteraction(e.clientX, e.clientY);
    },
    [handleInteraction],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches[0]) {
        handleInteraction(e.touches[0].clientX, e.touches[0].clientY);
      }
    },
    [handleInteraction],
  );

  const handleInteractionEnd = useCallback(() => {
    setIsInteracting(false);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full flex justify-center pointer-events-auto cursor-crosshair select-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleInteractionEnd}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleInteractionEnd}
    >
      {/* Main scanner container */}
      <div
        className={`relative w-[85vw] h-[85vw] md:w-[60vw] md:h-[60vw] lg:w-[50vw] lg:h-[50vw] max-w-[600px] max-h-[600px] transition-transform duration-100 ${glitchActive ? "animate-glitch" : ""}`}
        style={{
          transform: isInteracting
            ? `perspective(1000px) rotateX(${(mousePos.y - 50) * 0.1}deg) rotateY(${(mousePos.x - 50) * 0.1}deg)`
            : "none",
        }}
      >
        {/* Outer ambient glow - enhanced visibility */}
        <div className="absolute inset-0 bg-gradient-radial from-primary/50 via-primary/25 to-transparent blur-3xl" />

        {/* Main circular scanner frame */}
        <div className="absolute inset-[5%] rounded-full">
          {/* Background grid pattern - brighter */}
          <div className="absolute inset-0 rounded-full overflow-hidden">
            {/* Concentric circles */}
            <div className="absolute inset-[10%] rounded-full border-2 border-primary/50" />
            <div className="absolute inset-[25%] rounded-full border-2 border-primary/60" />
            <div className="absolute inset-[40%] rounded-full border border-primary/50" />

            {/* Grid lines */}
            {[...Array(8)].map((_, i) => (
              <div
                key={`h-${i}`}
                className="absolute left-0 right-0 h-px bg-primary/30"
                style={{ top: `${(i + 1) * 11}%` }}
              />
            ))}
            {[...Array(8)].map((_, i) => (
              <div
                key={`v-${i}`}
                className="absolute top-0 bottom-0 w-px bg-primary/30"
                style={{ left: `${(i + 1) * 11}%` }}
              />
            ))}
          </div>

          {/* Outer rotating ring - enhanced glow */}
          <div
            className="absolute inset-0 rounded-full border-2 border-primary/60 shadow-[0_0_30px_hsl(var(--primary)/0.4)]"
            style={{ animation: "spin 25s linear infinite" }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full shadow-[0_0_20px_hsl(var(--primary))]" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-primary rounded-full shadow-[0_0_20px_hsl(var(--primary))]" />
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 bg-primary/80 rounded-full shadow-[0_0_15px_hsl(var(--primary))]" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2 h-2 bg-primary/80 rounded-full shadow-[0_0_15px_hsl(var(--primary))]" />
          </div>

          {/* Radar sweep effect - more visible */}
          <div className="absolute inset-[5%] rounded-full overflow-hidden">
            <div
              className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0deg,transparent_320deg,hsl(var(--primary)/0.5)_350deg,hsl(var(--primary)/0.3)_355deg,transparent_360deg)]"
              style={{ animation: "spin 4s linear infinite" }}
            />
          </div>

          {/* === INTERACTIVE TRACKING SQUARE === */}
          <div className="absolute inset-[15%]">
            <div
              className="absolute w-20 h-20 md:w-28 md:h-28 lg:w-36 lg:h-36 transition-all duration-300 ease-out"
              style={{
                top: isInteracting ? `${mousePos.y - 15}%` : "30%",
                left: isInteracting ? `${mousePos.x - 15}%` : "35%",
                animation: isInteracting ? "none" : "trackingMove 12s ease-in-out infinite",
              }}
            >
              {/* Square frame with enhanced glow */}
              <div
                className={`absolute inset-0 border-2 border-primary shadow-[0_0_30px_hsl(var(--primary)),inset_0_0_20px_hsl(var(--primary)/0.4)] transition-all duration-200 ${isInteracting ? "scale-110 border-primary" : ""}`}
              >
                {/* Corner accents */}
                <div className="absolute -top-1 -left-1 w-5 h-5 border-l-3 border-t-3 border-primary shadow-[0_0_10px_hsl(var(--primary))]" />
                <div className="absolute -top-1 -right-1 w-5 h-5 border-r-3 border-t-3 border-primary shadow-[0_0_10px_hsl(var(--primary))]" />
                <div className="absolute -bottom-1 -left-1 w-5 h-5 border-l-3 border-b-3 border-primary shadow-[0_0_10px_hsl(var(--primary))]" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 border-r-3 border-b-3 border-primary shadow-[0_0_10px_hsl(var(--primary))]" />
              </div>

              {/* Inner crosshair */}
              <div className="absolute inset-2 flex items-center justify-center">
                <div className="absolute w-full h-px bg-primary" />
                <div className="absolute h-full w-px bg-primary" />
                <div
                  className={`absolute w-3 h-3 bg-primary rounded-full shadow-[0_0_15px_hsl(var(--primary))] transition-transform ${isInteracting ? "scale-150" : "animate-pulse"}`}
                />
              </div>

              {/* Lock indicator pulse */}
              <div
                className={`absolute -inset-4 border border-primary/60 transition-opacity ${isInteracting ? "opacity-100" : "opacity-50 animate-ping"}`}
                style={{ animationDuration: "2s" }}
              />

              {/* Tracking data readout */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[8px] md:text-[10px] font-mono text-primary whitespace-nowrap">
                {isInteracting
                  ? `X:${mousePos.x.toFixed(0)} Y:${mousePos.y.toFixed(0)}`
                  : "SCANNING..."}
              </div>
            </div>
          </div>

          {/* Center scanner icon - square profile + wider footprint */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative flex h-[18rem] w-[18rem] items-center justify-center md:h-[24rem] md:w-[24rem] lg:h-[30rem] lg:w-[30rem]">
              {/* Layered square glow for cleaner icon silhouette */}
              <div className="absolute inset-0 rounded-[1.75rem] bg-primary/30 blur-3xl" />
              <div
                className="absolute inset-[8%] rounded-[1.5rem] bg-primary/20 blur-2xl animate-pulse"
                style={{ animationDuration: "3s" }}
              />
              <div
                className="absolute inset-[16%] rounded-[1.25rem] bg-primary/25 animate-ping"
                style={{ animationDuration: "4s" }}
              />
              <div className="absolute inset-[12%] rounded-2xl border border-primary/45 shadow-[0_0_40px_hsl(var(--primary)/0.35),inset_0_0_28px_hsl(var(--primary)/0.2)]" />

              {/* Square scanner frame */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative h-56 w-56 md:h-80 md:w-80 lg:h-96 lg:w-96 border-2 border-primary/70 shadow-[0_0_35px_hsl(var(--primary)/0.5),inset_0_0_24px_hsl(var(--primary)/0.25)]">
                  <div className="absolute -top-1.5 -left-1.5 h-8 w-8 border-l-2 border-t-2 border-primary" />
                  <div className="absolute -top-1.5 -right-1.5 h-8 w-8 border-r-2 border-t-2 border-primary" />
                  <div className="absolute -bottom-1.5 -left-1.5 h-8 w-8 border-l-2 border-b-2 border-primary" />
                  <div className="absolute -bottom-1.5 -right-1.5 h-8 w-8 border-r-2 border-b-2 border-primary" />
                </div>
              </div>

              {/* Main icon with enhanced visibility */}
              <Scan
                className={`relative h-44 w-44 md:h-64 md:w-64 lg:h-80 lg:w-80 text-primary drop-shadow-[0_0_60px_hsl(var(--primary))] transition-all duration-200 ${isInteracting ? "scale-105" : ""} ${glitchActive ? "translate-x-1" : ""}`}
                style={{ filter: "drop-shadow(0 0 40px hsl(var(--primary)))" }}
              />
            </div>
          </div>

          {/* === VERTICAL SCAN LINE - Enhanced === */}
          <div className="absolute inset-0 overflow-hidden rounded-full">
            {/* Primary scan line */}
            <div
              className="absolute left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_20px_hsl(var(--primary)),0_0_40px_hsl(var(--primary)/0.5)]"
              style={{ animation: "scanVertical 3s ease-in-out infinite" }}
            />
            {/* Secondary scan line (offset) */}
            <div
              className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/60 to-transparent"
              style={{ animation: "scanVertical 3s ease-in-out infinite", animationDelay: "-1.5s" }}
            />
          </div>

          {/* Glitch overlay effect */}
          {glitchActive && (
            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent"
                style={{
                  clipPath: `inset(${Math.random() * 30}% 0 ${Math.random() * 30}% 0)`,
                  transform: `translateX(${Math.random() * 10 - 5}px)`,
                }}
              />
              <div
                className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10"
                style={{
                  clipPath: `inset(${Math.random() * 40 + 30}% 0 ${Math.random() * 20}% 0)`,
                  transform: `translateX(${Math.random() * 8 - 4}px)`,
                }}
              />
            </div>
          )}
        </div>

        {/* Status text - top */}
        <div
          className={`absolute top-[2%] left-1/2 -translate-x-1/2 text-xs md:text-sm font-mono text-primary tracking-widest transition-opacity ${glitchActive ? "opacity-50" : "opacity-100"}`}
        >
          MORPHOSCAN • {isInteracting ? "TRACKING" : "ACTIVE"}
        </div>

        {/* Corner data readouts */}
        <div className="absolute bottom-[5%] left-[10%] text-[8px] md:text-[10px] font-mono text-primary/70">
          SYS:NOMINAL
        </div>
        <div className="absolute bottom-[5%] right-[10%] text-[8px] md:text-[10px] font-mono text-primary/70">
          v2.1.0
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes trackingMove {
          0%, 100% { 
            top: 20%; 
            left: 25%; 
            transform: scale(1);
          }
          25% { 
            top: 35%; 
            left: 60%; 
            transform: scale(1.05);
          }
          50% { 
            top: 55%; 
            left: 50%; 
            transform: scale(0.95);
          }
          75% { 
            top: 40%; 
            left: 20%; 
            transform: scale(1.02);
          }
        }
        
        @keyframes scanVertical {
          0%, 100% { top: 0%; opacity: 0.3; }
          10% { opacity: 1; }
          50% { top: 100%; opacity: 1; }
          90% { opacity: 1; }
        }
        
        @keyframes glitch {
          0% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
          100% { transform: translate(0); }
        }
        
        .animate-glitch {
          animation: glitch 0.15s ease-in-out;
        }
      `}</style>
    </div>
  );
};
