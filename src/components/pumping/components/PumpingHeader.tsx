import React from "react";

import { TrendingUp } from "lucide-react";

export function PumpingHeader() {
  return (
    <div className="text-center mb-12 animate-fade-in-up">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
        <TrendingUp className="w-4 h-4 text-primary" />
        <span className="text-sm text-primary font-medium">Pumping Progress</span>
      </div>
      <h2 className="text-3xl md:text-4xl font-bold mb-4">
        <span className="gradient-text">Growth</span> Tracker
      </h2>
      <p className="text-muted-foreground max-w-2xl mx-auto">
        Track your pumping sessions, monitor gains, and follow safe routines.
      </p>
    </div>
  );
}
