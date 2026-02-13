/**
 * DLC Content Loader
 * Dynamically loads and manages DLC content
 */

import { logger } from '@/lib/logger';
import { dlcManager } from './index';
import { DLC_MODULES, getModulesForPackage, MODULE_PACKAGE_MAP } from '../modules';
import type { DLCModule, DLCNavigationItem, DLCRoute } from './types';

// ============================================
// Types
// ============================================

interface LoadedContent {
  moduleId: string;
  components: Map<string, React.ComponentType<unknown>>;
  loadedAt: Date;
}

interface ContentLoaderState {
  loadedModules: Set<string>;
  loadedContent: Map<string, LoadedContent>;
  pendingLoads: Set<string>;
  errors: Map<string, string>;
}

// ============================================
// Content Loader Class
// ============================================

class DLCContentLoader {
  private state: ContentLoaderState = {
    loadedModules: new Set(),
    loadedContent: new Map(),
    pendingLoads: new Set(),
    errors: new Map(),
  };
  
  private listeners: Set<() => void> = new Set();
  
  /**
   * Subscribe to content loader state changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  /**
   * Notify listeners of state changes
   */
  private notify(): void {
    this.listeners.forEach(listener => listener());
  }
  
  /**
   * Load all content for installed packages
   */
  async loadInstalledContent(): Promise<void> {
    const installedPackages = dlcManager.getInstalledPackages();
    const packageIds = installedPackages.map(p => p.packageId);
    
    for (const packageId of packageIds) {
      await this.loadPackageContent(packageId);
    }
  }
  
  /**
   * Load content for a specific package
   */
  async loadPackageContent(packageId: string): Promise<void> {
    if (!dlcManager.isPackageInstalled(packageId)) {
      logger.warn('ContentLoader: Package not installed', { packageId });
      return;
    }
    
    const moduleIds = MODULE_PACKAGE_MAP[packageId] || [];
    
    for (const moduleId of moduleIds) {
      await this.loadModule(moduleId);
    }
  }
  
  /**
   * Load a specific module
   */
  async loadModule(moduleId: string): Promise<void> {
    // Skip if already loaded or loading
    if (this.state.loadedModules.has(moduleId) || this.state.pendingLoads.has(moduleId)) {
      return;
    }
    
    this.state.pendingLoads.add(moduleId);
    this.notify();
    
    try {
      logger.info('ContentLoader: Loading module', { moduleId });
      
      const module = DLC_MODULES[moduleId];
      if (!module) {
        throw new Error(`Module not found: ${moduleId}`);
      }
      
      // Call module's onLoad lifecycle hook
      if (module.onLoad) {
        await module.onLoad();
      }
      
      // Store loaded content
      const content: LoadedContent = {
        moduleId,
        components: new Map(Object.entries(module.components)),
        loadedAt: new Date(),
      };
      
      this.state.loadedContent.set(moduleId, content);
      this.state.loadedModules.add(moduleId);
      this.state.errors.delete(moduleId);
      
      logger.info('ContentLoader: Module loaded', { moduleId });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load module';
      this.state.errors.set(moduleId, message);
      logger.error('ContentLoader: Failed to load module', { moduleId, error });
    } finally {
      this.state.pendingLoads.delete(moduleId);
      this.notify();
    }
  }
  
  /**
   * Unload a module
   */
  async unloadModule(moduleId: string): Promise<void> {
    if (!this.state.loadedModules.has(moduleId)) {
      return;
    }
    
    try {
      logger.info('ContentLoader: Unloading module', { moduleId });
      
      const module = DLC_MODULES[moduleId];
      
      // Call module's onUnload lifecycle hook
      if (module?.onUnload) {
        await module.onUnload();
      }
      
      this.state.loadedContent.delete(moduleId);
      this.state.loadedModules.delete(moduleId);
      
      logger.info('ContentLoader: Module unloaded', { moduleId });
    } catch (error) {
      logger.error('ContentLoader: Failed to unload module', { moduleId, error });
    }
    
    this.notify();
  }
  
  /**
   * Check if a module is loaded
   */
  isModuleLoaded(moduleId: string): boolean {
    return this.state.loadedModules.has(moduleId);
  }
  
  /**
   * Check if a module is loading
   */
  isModuleLoading(moduleId: string): boolean {
    return this.state.pendingLoads.has(moduleId);
  }
  
  /**
   * Get module loading error
   */
  getModuleError(moduleId: string): string | undefined {
    return this.state.errors.get(moduleId);
  }
  
  /**
   * Get loaded modules
   */
  getLoadedModules(): string[] {
    return Array.from(this.state.loadedModules);
  }
  
  /**
   * Get a component from a loaded module
   */
  getComponent(moduleId: string, componentName: string): React.ComponentType<unknown> | undefined {
    const content = this.state.loadedContent.get(moduleId);
    return content?.components.get(componentName);
  }
  
  /**
   * Get navigation items for loaded modules
   */
  getNavigationItems(): DLCNavigationItem[] {
    const items: DLCNavigationItem[] = [];
    
    this.state.loadedModules.forEach(moduleId => {
      const module = DLC_MODULES[moduleId];
      if (module) {
        items.push(...module.navigationItems);
      }
    });
    
    return items.sort((a, b) => a.order - b.order);
  }
  
  /**
   * Get routes for loaded modules
   */
  getRoutes(): DLCRoute[] {
    const routes: DLCRoute[] = [];
    
    this.state.loadedModules.forEach(moduleId => {
      const module = DLC_MODULES[moduleId];
      if (module) {
        routes.push(...module.routes);
      }
    });
    
    return routes;
  }
  
  /**
   * Check if a feature is available (module loaded and feature included)
   */
  isFeatureAvailable(featureId: string): boolean {
    for (const moduleId of this.state.loadedModules) {
      const module = DLC_MODULES[moduleId];
      if (module?.features.includes(featureId)) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * Get all available features from loaded modules
   */
  getAvailableFeatures(): string[] {
    const features: string[] = [];
    
    this.state.loadedModules.forEach(moduleId => {
      const module = DLC_MODULES[moduleId];
      if (module) {
        module.features.forEach(feature => {
          if (!features.includes(feature)) {
            features.push(feature);
          }
        });
      }
    });
    
    return features;
  }
  
  /**
   * Clear all loaded content
   */
  async clearAll(): Promise<void> {
    const moduleIds = Array.from(this.state.loadedModules);
    
    for (const moduleId of moduleIds) {
      await this.unloadModule(moduleId);
    }
    
    this.state = {
      loadedModules: new Set(),
      loadedContent: new Map(),
      pendingLoads: new Set(),
      errors: new Map(),
    };
    
    this.notify();
  }
}

// Export singleton instance
export const dlcContentLoader = new DLCContentLoader();
