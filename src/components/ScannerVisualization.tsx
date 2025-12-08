import { useEffect, useState } from "react";

export const ScannerVisualization = () => {
  const [scanProgress, setScanProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setScanProgress((prev) => (prev >= 100 ? 0 : prev + 1));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-80 h-80 md:w-96 md:h-96">
      {/* Outer rotating ring */}
      <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-rotate-slow" />
      
      {/* Pulsing rings */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute inset-4 rounded-full border border-primary/30 animate-pulse-ring"
          style={{ animationDelay: `${i * 0.5}s` }}
        />
      ))}
      
      {/* Center scanner area */}
      <div className="absolute inset-8 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 backdrop-blur-sm border border-primary/20 overflow-hidden">
        {/* Scan line */}
        <div 
          className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-line"
          style={{ top: '0%' }}
        />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-20">
          {[...Array(8)].map((_, i) => (
            <div
              key={`h-${i}`}
              className="absolute left-0 right-0 h-px bg-primary/40"
              style={{ top: `${(i + 1) * 12.5}%` }}
            />
          ))}
          {[...Array(8)].map((_, i) => (
            <div
              key={`v-${i}`}
              className="absolute top-0 bottom-0 w-px bg-primary/40"
              style={{ left: `${(i + 1) * 12.5}%` }}
            />
          ))}
        </div>
        
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-full gradient-primary opacity-20 animate-pulse-ring" />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg 
                className="w-10 h-10 text-primary" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" 
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      {/* Corner brackets */}
      <div className="absolute top-0 left-0 w-12 h-12">
        <div className="absolute top-0 left-0 w-full h-0.5 bg-primary" />
        <div className="absolute top-0 left-0 h-full w-0.5 bg-primary" />
      </div>
      <div className="absolute top-0 right-0 w-12 h-12">
        <div className="absolute top-0 right-0 w-full h-0.5 bg-primary" />
        <div className="absolute top-0 right-0 h-full w-0.5 bg-primary" />
      </div>
      <div className="absolute bottom-0 left-0 w-12 h-12">
        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />
        <div className="absolute bottom-0 left-0 h-full w-0.5 bg-primary" />
      </div>
      <div className="absolute bottom-0 right-0 w-12 h-12">
        <div className="absolute bottom-0 right-0 w-full h-0.5 bg-primary" />
        <div className="absolute bottom-0 right-0 h-full w-0.5 bg-primary" />
      </div>
      
      {/* Data points */}
      {[...Array(12)].map((_, i) => {
        const angle = (i * 30 * Math.PI) / 180;
        const radius = 155;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        return (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-primary animate-pulse"
            style={{
              left: `calc(50% + ${x}px - 3px)`,
              top: `calc(50% + ${y}px - 3px)`,
              animationDelay: `${i * 0.1}s`,
            }}
          />
        );
      })}
      
      {/* Progress indicator */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
        <span className="text-xs font-mono text-muted-foreground">SCANNING</span>
        <span className="text-sm font-mono text-primary">{scanProgress}%</span>
      </div>
    </div>
  );
};
