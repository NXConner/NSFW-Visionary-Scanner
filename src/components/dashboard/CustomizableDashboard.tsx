// Customizable Dashboard Component
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  LayoutGrid, Plus, Settings, Lock, Unlock, Eye, EyeOff, Trash2, 
  Copy, RotateCcw, GripVertical, Maximize2, Minimize2, X,
  Camera, Clock, Heart, Trophy, Pill, Activity, TrendingUp, BarChart3, BookOpen, Zap
} from 'lucide-react';
import { getDashboardManager, DashboardWidget, DashboardLayout, WidgetType } from '@/lib/dashboard/DashboardManager';
import { cn } from '@/lib/utils';

interface CustomizableDashboardProps {
  className?: string;
  onWidgetClick?: (widget: DashboardWidget) => void;
}

const WIDGET_ICONS: Record<WidgetType, React.ElementType> = {
  quick_scan: Camera,
  recent_scans: Clock,
  health_summary: Heart,
  achievements: Trophy,
  medication_reminder: Pill,
  symptom_tracker: Activity,
  trend_chart: TrendingUp,
  stats_overview: BarChart3,
  tutorials_progress: BookOpen,
  quick_actions: Zap
};

export const CustomizableDashboard: React.FC<CustomizableDashboardProps> = ({ className, onWidgetClick }) => {
  const [layout, setLayout] = useState<DashboardLayout | null>(null);
  const [layouts, setLayouts] = useState<DashboardLayout[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const manager = getDashboardManager();

  useEffect(() => {
    refresh();
    return manager.subscribe(refresh);
  }, []);

  const refresh = () => {
    setLayout(manager.getCurrentLayout());
    setLayouts(manager.getLayouts());
  };

  const handleReorder = (newOrder: DashboardWidget[]) => {
    if (!layout) return;
    // Update positions based on new order
    newOrder.forEach((widget, index) => {
      manager.updateWidget(layout.id, widget.id, { 
        position: { x: index % 4, y: Math.floor(index / 4) } 
      });
    });
    refresh();
  };

  const toggleWidgetVisibility = (widgetId: string) => {
    if (!layout) return;
    const widget = layout.widgets.find(w => w.id === widgetId);
    if (widget) {
      manager.updateWidget(layout.id, widgetId, { visible: !widget.visible });
      refresh();
    }
  };

  const toggleWidgetLock = (widgetId: string) => {
    if (!layout) return;
    const widget = layout.widgets.find(w => w.id === widgetId);
    if (widget) {
      manager.updateWidget(layout.id, widgetId, { locked: !widget.locked });
      refresh();
    }
  };

  const removeWidget = (widgetId: string) => {
    if (!layout) return;
    manager.removeWidget(layout.id, widgetId);
    refresh();
  };

  const addWidget = (type: WidgetType, title: string) => {
    if (!layout) return;
    manager.addWidget(layout.id, type, title);
    setShowAddWidget(false);
    refresh();
  };

  const switchLayout = (layoutId: string) => {
    manager.switchLayout(layoutId);
    refresh();
  };

  const createNewLayout = () => {
    const name = prompt('Enter layout name:');
    if (name) {
      manager.createLayout(name);
      refresh();
    }
  };

  const duplicateLayout = () => {
    if (!layout) return;
    const name = prompt('Enter name for duplicate:');
    if (name) {
      manager.duplicateLayout(layout.id, name);
      refresh();
    }
  };

  const resetLayout = () => {
    if (!layout || !confirm('Reset layout to default?')) return;
    manager.resetLayout(layout.id);
    refresh();
  };

  const deleteLayout = () => {
    if (!layout || layout.isDefault || !confirm('Delete this layout?')) return;
    manager.deleteLayout(layout.id);
    refresh();
  };

  if (!layout) return null;

  const visibleWidgets = editMode ? layout.widgets : layout.widgets.filter(w => w.visible);

  return (
    <div className={cn('p-4 space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LayoutGrid className="w-5 h-5 text-blue-400" />
          <select
            value={layout.id}
            onChange={(e) => switchLayout(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
          >
            {layouts.map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
          <button 
            onClick={createNewLayout}
            className="p-1.5 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white"
            title="New Layout"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditMode(!editMode)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              editMode ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            )}
          >
            <Settings className="w-4 h-4" />
            {editMode ? 'Done' : 'Customize'}
          </button>
        </div>
      </div>

      {/* Edit Mode Toolbar */}
      <AnimatePresence>
        {editMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 p-3 bg-gray-800/50 rounded-lg border border-gray-700"
          >
            <button
              onClick={() => setShowAddWidget(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm"
            >
              <Plus className="w-4 h-4" /> Add Widget
            </button>
            <button
              onClick={duplicateLayout}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
            >
              <Copy className="w-4 h-4" /> Duplicate
            </button>
            <button
              onClick={resetLayout}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
            {!layout.isDefault && (
              <button
                onClick={deleteLayout}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm ml-auto"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Widget Grid */}
      <Reorder.Group
        axis="y"
        values={visibleWidgets}
        onReorder={handleReorder}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {visibleWidgets.map(widget => {
          const Icon = WIDGET_ICONS[widget.type];
          return (
            <Reorder.Item
              key={widget.id}
              value={widget}
              dragListener={editMode && !widget.locked}
              className={cn(
                'bg-gray-800/50 rounded-xl border transition-all',
                editMode ? 'border-blue-500/50' : 'border-gray-700 hover:border-gray-600',
                !widget.visible && 'opacity-50',
                widget.size.width === 2 && 'col-span-2',
                widget.size.width >= 3 && 'col-span-2 md:col-span-3',
                widget.size.width === 4 && 'col-span-2 md:col-span-4'
              )}
            >
              <div 
                className={cn(
                  'p-4 h-full',
                  widget.size.height >= 2 && 'min-h-[180px]'
                )}
              >
                {/* Widget Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {editMode && !widget.locked && (
                      <GripVertical className="w-4 h-4 text-gray-500 cursor-grab" />
                    )}
                    <Icon className="w-4 h-4 text-blue-400" />
                    <span className="font-medium text-sm">{widget.title}</span>
                  </div>
                  {editMode && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleWidgetVisibility(widget.id)}
                        className="p-1 hover:bg-gray-700 rounded text-gray-400"
                        title={widget.visible ? 'Hide' : 'Show'}
                      >
                        {widget.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={() => toggleWidgetLock(widget.id)}
                        className="p-1 hover:bg-gray-700 rounded text-gray-400"
                        title={widget.locked ? 'Unlock' : 'Lock'}
                      >
                        {widget.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={() => removeWidget(widget.id)}
                        className="p-1 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400"
                        title="Remove"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Widget Content Placeholder */}
                <div 
                  className="flex items-center justify-center h-[calc(100%-40px)] bg-gray-900/30 rounded-lg cursor-pointer"
                  onClick={() => !editMode && onWidgetClick?.(widget)}
                >
                  <div className="text-center text-gray-500">
                    <Icon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">Click to view {widget.title}</p>
                  </div>
                </div>
              </div>
            </Reorder.Item>
          );
        })}
      </Reorder.Group>

      {/* Add Widget Modal */}
      <AnimatePresence>
        {showAddWidget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddWidget(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-gray-800 rounded-xl border border-gray-700 max-w-md w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Add Widget</h3>
                <button onClick={() => setShowAddWidget(false)} className="p-1 hover:bg-gray-700 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-2">
                {manager.getAvailableWidgetTypes().map(widgetType => {
                  const Icon = WIDGET_ICONS[widgetType.type];
                  return (
                    <button
                      key={widgetType.type}
                      onClick={() => addWidget(widgetType.type, widgetType.name)}
                      className="w-full flex items-center gap-3 p-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors text-left"
                    >
                      <Icon className="w-5 h-5 text-blue-400" />
                      <div>
                        <div className="font-medium">{widgetType.name}</div>
                        <div className="text-xs text-gray-400">{widgetType.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomizableDashboard;
