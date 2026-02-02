import * as React from "react";
import { SidebarProvider, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { AppTopBar } from "./AppTopBar";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";
import { useSidebar } from "@/components/ui/sidebar";
import { createPortal } from "react-dom";

function MobileNavPortal(props: { activeTab: string; onTabChange: (tab: string) => void }) {
  const { toggleSidebar } = useSidebar();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <MobileBottomNav
      activeTab={props.activeTab}
      onTabChange={props.onTabChange}
      onOpenMenu={toggleSidebar}
    />,
    document.body
  );
}

function TopNavPortal(props: { activeTab: string; onTabChange: (tab: string) => void }) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AppTopBar activeTab={props.activeTab} onTabChange={props.onTabChange} />,
    document.body
  );
}

export function AppShell(props: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
}): React.ReactElement {
  const { activeTab, onTabChange, children } = props;

  return (
    <SidebarProvider defaultOpen={true}>
      {/* Portaled to document.body for true fixed positioning */}
      <TopNavPortal activeTab={activeTab} onTabChange={onTabChange} />
      <MobileNavPortal activeTab={activeTab} onTabChange={onTabChange} />
      
      <AppSidebar activeTab={activeTab} onTabChange={onTabChange} />
      <SidebarRail />
      
      <SidebarInset className="flex flex-col min-h-screen w-full">
        <div className="relative flex-1 pt-14 pb-20 lg:pb-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
