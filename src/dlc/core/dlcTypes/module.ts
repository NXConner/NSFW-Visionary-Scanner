export type DLCRoute = {
  path: string;
  component: string;
  protected?: boolean;
};

export type DLCNavigationItem = {
  id: string;
  label: string;
  icon?: string;
  path: string;
  order: number;
};

export type DLCModule = {
  id: string;
  name: string;
  version: string;
  packageId: string;
  components: Record<string, React.ComponentType<unknown>>;
  routes: DLCRoute[];
  navigationItems: DLCNavigationItem[];
  features: string[];
  onLoad?: () => Promise<void>;
  onUnload?: () => Promise<void>;
};

