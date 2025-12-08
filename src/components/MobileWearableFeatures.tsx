/**
 * Advanced Mobile Features & Wearable Integration
 * UI component for managing mobile widgets, app shortcuts, haptic feedback, and wearable devices
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  getMobileWidgets,
  createMobileWidget,
  getAppShortcuts,
  createAppShortcut,
  getHapticPreferences,
  updateHapticPreferences,
  getWearableDevices,
  connectWearableDevice,
  type MobileWidgetConfiguration,
  type AppShortcut,
  type HapticFeedbackPreferences,
  type WearableDevice
} from '@/lib/mobileWearableFeatures'
import { Smartphone, Watch, Zap, Layout, Loader2, Plus, CheckCircle2, X } from 'lucide-react'
import { toast } from 'sonner'

export const MobileWearableFeatures = () => {
  const [activeTab, setActiveTab] = useState('widgets')
  const [loading, setLoading] = useState(false)
  const [widgets, setWidgets] = useState<MobileWidgetConfiguration[]>([])
  const [shortcuts, setShortcuts] = useState<AppShortcut[]>([])
  const [hapticPrefs, setHapticPrefs] = useState<HapticFeedbackPreferences | null>(null)
  const [wearableDevices, setWearableDevices] = useState<WearableDevice[]>([])

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    setLoading(true)
    try {
      switch (activeTab) {
        case 'widgets': {
          const widgetsData = await getMobileWidgets()
          setWidgets(widgetsData)
          break
        }
        case 'shortcuts': {
          const shortcutsData = await getAppShortcuts()
          setShortcuts(shortcutsData)
          break
        }
        case 'haptics': {
          const prefs = await getHapticPreferences()
          setHapticPrefs(prefs)
          break
        }
        case 'wearables': {
          const devices = await getWearableDevices()
          setWearableDevices(devices)
          break
        }
      }
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateHaptic = async (updates: Partial<HapticFeedbackPreferences>) => {
    try {
      const success = await updateHapticPreferences(updates)
      if (success) {
        await loadData()
      }
    } catch (error) {
      toast.error('Failed to update preferences')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="glass-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="w-12 h-12 text-muted-foreground animate-spin mb-4" />
            <p className="text-muted-foreground">Loading mobile features...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-6 h-6" />
            Mobile & Wearable Features
          </CardTitle>
          <CardDescription>
            Configure mobile widgets, shortcuts, haptic feedback, and wearable device integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="widgets">Widgets</TabsTrigger>
              <TabsTrigger value="shortcuts">Shortcuts</TabsTrigger>
              <TabsTrigger value="haptics">Haptics</TabsTrigger>
              <TabsTrigger value="wearables">Wearables</TabsTrigger>
            </TabsList>

            <TabsContent value="widgets" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Mobile Widgets</h3>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Widget
                </Button>
              </div>
              {widgets.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No widgets configured yet
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {widgets.map(widget => (
                    <Card key={widget.id} className="glass-card border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">{widget.widget_name}</h4>
                            <p className="text-sm text-muted-foreground">{widget.widget_type}</p>
                          </div>
                          <Badge variant="secondary">{widget.platform}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="shortcuts" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">App Shortcuts</h3>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Shortcut
                </Button>
              </div>
              {shortcuts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No shortcuts configured yet
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {shortcuts.map(shortcut => (
                    <Card key={shortcut.id} className="glass-card border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">{shortcut.shortcut_name}</h4>
                            <p className="text-sm text-muted-foreground">{shortcut.shortcut_type}</p>
                            <p className="text-xs text-muted-foreground">
                              Used {shortcut.usage_count} times
                            </p>
                          </div>
                          <Badge variant="secondary">{shortcut.platform}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="haptics" className="space-y-4">
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle>Haptic Feedback Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {hapticPrefs ? (
                    <>
                      <div className="flex items-center justify-between">
                        <Label>Enable Haptic Feedback</Label>
                        <Switch
                          checked={hapticPrefs.haptic_enabled}
                          onCheckedChange={(checked) => handleUpdateHaptic({ haptic_enabled: checked })}
                        />
                      </div>
                      <div>
                        <Label>Haptic Intensity</Label>
                        <Select
                          value={hapticPrefs.haptic_intensity}
                          onValueChange={(value) => handleUpdateHaptic({ haptic_intensity: value as any })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="strong">Strong</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Disable on Low Battery</Label>
                        <Switch
                          checked={hapticPrefs.disable_on_low_battery}
                          onCheckedChange={(checked) => handleUpdateHaptic({ disable_on_low_battery: checked })}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading preferences...
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="wearables" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Wearable Devices</h3>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Connect Device
                </Button>
              </div>
              {wearableDevices.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No wearable devices connected yet
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {wearableDevices.map(device => (
                    <Card key={device.id} className="glass-card border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Watch className="w-5 h-5" />
                            <div>
                              <h4 className="font-semibold">{device.device_name}</h4>
                              <p className="text-sm text-muted-foreground">{device.device_type}</p>
                            </div>
                          </div>
                          {device.is_connected ? (
                            <Badge variant="default">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Connected
                            </Badge>
                          ) : (
                            <Badge variant="outline">Disconnected</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

