import { useState, memo } from "react";
import {
  Command,
  NotebookPen,
  Settings,
  Scan,
  Heart,
  Brain,
  TrendingUp,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface FloatingQuickActionsProps {
  onNavigate: (tab: string) => void;
}

const actions = [
  { id: "scanner", label: "Start Scan", icon: Scan, color: "text-primary" },
  { id: "diary", label: "Log Entry", icon: NotebookPen, color: "text-cyan-glow" },
  { id: "health-dashboard", label: "Dashboard", icon: Heart, color: "text-pink-500" },
  { id: "ai-insights", label: "AI Insights", icon: Brain, color: "text-purple-accent" },
  { id: "pumping", label: "Pumping", icon: TrendingUp, color: "text-green-500" },
  { id: "settings", label: "Settings", icon: Settings, color: "text-muted-foreground" },
];

export const FloatingQuickActions = memo(function FloatingQuickActions({
  onNavigate,
}: FloatingQuickActionsProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-20 right-4 z-40 md:bottom-6">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute bottom-16 right-0 w-52 rounded-2xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl shadow-primary/10 p-3 mb-2"
          >
            <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground font-medium">
              Quick actions
            </p>
            <div className="grid grid-cols-2 gap-2">
              {actions.map((action, index) => (
                <motion.button
                  key={action.id}
                  type="button"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.15 }}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl border border-border/40 bg-secondary/30 p-2.5 text-center transition-all duration-200",
                    "hover:border-primary/50 hover:bg-primary/10 hover:scale-105 active:scale-95"
                  )}
                  onClick={() => {
                    onNavigate(action.id);
                    setOpen(false);
                  }}
                >
                  <action.icon className={cn("h-5 w-5", action.color)} />
                  <span className="text-[10px] font-medium leading-tight">
                    {action.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        size="lg"
        variant={open ? "outline" : "glow"}
        className={cn(
          "h-14 w-14 rounded-full shadow-lg transition-all duration-300",
          open
            ? "bg-destructive/10 border-destructive/50 hover:bg-destructive/20"
            : "shadow-primary/30 hover:shadow-primary/50 hover:scale-105"
        )}
        aria-label={open ? "Close quick actions" : "Open quick actions"}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <motion.div
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {open ? <X className="h-5 w-5" /> : <Command className="h-5 w-5" />}
        </motion.div>
      </Button>
    </div>
  );
});
