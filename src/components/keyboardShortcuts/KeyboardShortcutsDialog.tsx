import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { APP_EVENT_OPEN_SHORTCUTS_HELP } from "@/lib/appEvents";
import {
  formatShortcutKeys,
  KEYBOARD_SHORTCUT_DEFINITIONS,
  type KeyboardShortcutCategory,
} from "@/hooks/keyboardShortcuts";

const CATEGORY_LABELS: Record<KeyboardShortcutCategory, string> = {
  navigation: "Navigation",
  actions: "Actions",
  admin: "Admin",
  content: "Content",
  media: "Media",
  accessibility: "Accessibility",
};

const CATEGORY_ORDER: KeyboardShortcutCategory[] = [
  "navigation",
  "actions",
  "accessibility",
  "admin",
  "content",
  "media",
];

export function KeyboardShortcutsDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(APP_EVENT_OPEN_SHORTCUTS_HELP, onOpen);
    return () => window.removeEventListener(APP_EVENT_OPEN_SHORTCUTS_HELP, onOpen);
  }, []);

  const grouped = useMemo(() => {
    const byCategory = new Map<KeyboardShortcutCategory, typeof KEYBOARD_SHORTCUT_DEFINITIONS>();
    for (const category of CATEGORY_ORDER) byCategory.set(category, []);
    for (const def of KEYBOARD_SHORTCUT_DEFINITIONS) {
      const list = byCategory.get(def.category) ?? [];
      list.push(def);
      byCategory.set(def.category, list);
    }
    return byCategory;
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>
            Power-user navigation and accessibility shortcuts. On macOS, use ⌘ instead of Ctrl.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 md:grid-cols-2">
          {CATEGORY_ORDER.map(category => {
            const items = grouped.get(category) ?? [];
            if (items.length === 0) return null;
            return (
              <div key={category} className="rounded-xl border border-border/60 bg-card/40 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{CATEGORY_LABELS[category]}</h3>
                  <Badge variant="secondary" className="text-[10px]">
                    {items.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {items.map(item => (
                    <div
                      key={`${item.category}:${formatShortcutKeys(item)}`}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-background/40 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{item.description}</p>
                      </div>
                      <kbd className="shrink-0 rounded-md border border-border/60 bg-muted/30 px-2 py-1 text-[11px] font-medium">
                        {formatShortcutKeys(item)}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
