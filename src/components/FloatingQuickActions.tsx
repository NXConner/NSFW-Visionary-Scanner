import { useState } from "react";
import { Command, LogIn, NotebookPen, Settings, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface FloatingQuickActionsProps {
  onNavigate: (tab: string) => void;
}

const actions = [
  { id: "scanner", label: "Start Scan", icon: Scan },
  { id: "diary", label: "Log Diary Entry", icon: NotebookPen },
  { id: "profile", label: "Profile & Settings", icon: Settings },
  { id: "questionnaire", label: "Assessment", icon: LogIn },
];

export const FloatingQuickActions = ({ onNavigate }: FloatingQuickActionsProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-4 z-40 md:hidden">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg shadow-primary/30"
            aria-label="Quick actions"
          >
            <Command className="h-5 w-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-60 rounded-2xl border-border/60 bg-background/95">
          <p className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">Quick actions</p>
          <div className="space-y-2">
            {actions.map(action => (
              <button
                key={action.id}
                type="button"
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border border-border/50 bg-secondary/30 px-3 py-2 text-left transition hover:border-primary/50",
                )}
                onClick={() => {
                  onNavigate(action.id);
                  setOpen(false);
                }}
              >
                <action.icon className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
