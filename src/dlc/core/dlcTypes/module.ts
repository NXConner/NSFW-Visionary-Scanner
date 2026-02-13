// ============================================
// Module Types
// ============================================

export interface DLCModule {
  id: string;
  name: string;
  version: string;
  packageId: string;

  // Components
  components: Record<string, React.ComponentType<unknown>>;

  // Routes
  routes: DLCRoute[];

  // Navigation
  navigationItems: DLCNavigationItem[];

  // Features
  features: string[];

  // Lifecycle
  onLoad?: () => Promise<void>;
  onUnload?: () => Promise<void>;
}

export interface DLCRoute {
  path: string;
  component: string;
  exact?: boolean;
  protected?: boolean;
}

export interface DLCNavigationItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  order: number;
  badge?: string;
}
