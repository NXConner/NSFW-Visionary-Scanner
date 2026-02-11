import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export type HubTabConfig = {
  id: string;
  label: string;
  icon: React.ElementType;
  description?: string;
  content: ReactNode;
};

export function HubTabs({
  title,
  description,
  tabs,
  initialTab,
}: {
  title: string;
  description?: string;
  tabs: HubTabConfig[];
  initialTab?: string;
}): JSX.Element {
  const tabIds = useMemo(() => tabs.map(t => t.id), [tabs]);
  const defaultTab = tabIds[0] ?? "";
  const [activeTab, setActiveTab] = useState(
    initialTab && tabIds.includes(initialTab) ? initialTab : defaultTab,
  );

  useEffect(() => {
    if (!initialTab) return;
    if (!tabIds.includes(initialTab)) return;
    setActiveTab(initialTab);
  }, [initialTab, tabIds]);

  const activeDescription = useMemo(
    () => tabs.find(t => t.id === activeTab)?.description ?? description ?? "",
    [tabs, activeTab, description],
  );

  return (
    <div className="min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{title}</h1>
        {activeDescription ? (
          <p className="text-sm text-muted-foreground mt-1">{activeDescription}</p>
        ) : null}
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50 py-3">
          <TabsList className="w-full h-auto flex flex-wrap justify-start gap-1 bg-muted/30 p-1.5 rounded-lg">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-md transition-all",
                    "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
                    "data-[state=active]:shadow-md hover:bg-muted/50",
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>
        {tabs.map(tab => (
          <TabsContent key={tab.id} value={tab.id} className="mt-6 focus-visible:outline-none">
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
