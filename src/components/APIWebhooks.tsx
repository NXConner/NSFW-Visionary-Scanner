/**
 * API & Webhooks
 * UI component for managing API keys, webhooks, and API usage analytics
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  createAPIKey,
  getAPIKeys,
  revokeAPIKey,
  createWebhook,
  getWebhooks,
  verifyWebhook,
  type APIKey,
  type Webhook
} from '@/lib/apiWebhooks'
import { Key, Webhook as WebhookIcon, Plus, Trash2, Eye, EyeOff, Loader2, Copy, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

export const APIWebhooks = () => {
  const [activeTab, setActiveTab] = useState('api-keys')
  const [loading, setLoading] = useState(false)
  const [apiKeys, setApiKeys] = useState<APIKey[]>([])
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [showNewKeyForm, setShowNewKeyForm] = useState(false)
  const [showNewWebhookForm, setShowNewWebhookForm] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyTier, setNewKeyTier] = useState<'basic' | 'pro' | 'enterprise'>('basic')
  const [newWebhookName, setNewWebhookName] = useState('')
  const [newWebhookUrl, setNewWebhookUrl] = useState('')
  const [newWebhookEvents, setNewWebhookEvents] = useState<string[]>([])
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'api-keys') {
        const keys = await getAPIKeys()
        setApiKeys(keys)
      } else {
        const hooks = await getWebhooks()
        setWebhooks(hooks)
      }
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAPIKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a key name')
      return
    }

    try {
      const result = await createAPIKey(newKeyName, newKeyTier)
      if (result) {
        setNewKeyName('')
        setShowNewKeyForm(false)
        setRevealedKeys(new Set([result.apiKeyRecord.id]))
        await loadData()
        toast.success(`API key created! Key: ${result.api_key.substring(0, 20)}...`)
      }
    } catch (error) {
      toast.error('Failed to create API key')
    }
  }

  const handleCreateWebhook = async () => {
    if (!newWebhookName.trim() || !newWebhookUrl.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    try {
      const webhook = await createWebhook(newWebhookName, newWebhookUrl, newWebhookEvents)
      if (webhook) {
        setNewWebhookName('')
        setNewWebhookUrl('')
        setNewWebhookEvents([])
        setShowNewWebhookForm(false)
        await loadData()
      }
    } catch (error) {
      toast.error('Failed to create webhook')
    }
  }

  const handleRevokeKey = async (keyId: string) => {
    try {
      const success = await revokeAPIKey(keyId)
      if (success) {
        await loadData()
      }
    } catch (error) {
      toast.error('Failed to revoke key')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-6 h-6" />
            API & Webhooks
          </CardTitle>
          <CardDescription>
            Manage your API keys and webhooks for programmatic access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="api-keys">API Keys</TabsTrigger>
              <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            </TabsList>

            <TabsContent value="api-keys" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">API Keys</h3>
                <Button size="sm" onClick={() => setShowNewKeyForm(!showNewKeyForm)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create API Key
                </Button>
              </div>

              {showNewKeyForm && (
                <Card className="glass-card border-border/50">
                  <CardContent className="p-4 space-y-4">
                    <div>
                      <Label>Key Name</Label>
                      <Input
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        placeholder="My API Key"
                      />
                    </div>
                    <div>
                      <Label>Access Tier</Label>
                      <select
                        className="w-full p-2 border rounded"
                        value={newKeyTier}
                        onChange={(e) => setNewKeyTier(e.target.value as any)}
                      >
                        <option value="basic">Basic</option>
                        <option value="pro">Pro</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleCreateAPIKey} className="flex-1">Create</Button>
                      <Button variant="outline" onClick={() => setShowNewKeyForm(false)}>Cancel</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {apiKeys.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No API keys yet. Create one to get started.
                </div>
              ) : (
                <div className="space-y-2">
                  {apiKeys.map(key => (
                    <Card key={key.id} className="glass-card border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{key.key_name}</h4>
                              <Badge variant="secondary">{key.access_tier}</Badge>
                              {key.is_active ? (
                                <Badge variant="default">Active</Badge>
                              ) : (
                                <Badge variant="outline">Revoked</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Prefix: {key.api_key_prefix}... • {key.total_requests} requests
                            </p>
                            {key.last_used_at && (
                              <p className="text-xs text-muted-foreground">
                                Last used: {new Date(key.last_used_at).toLocaleString()}
                              </p>
                            )}
                          </div>
                          {key.is_active && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRevokeKey(key.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="webhooks" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Webhooks</h3>
                <Button size="sm" onClick={() => setShowNewWebhookForm(!showNewWebhookForm)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Webhook
                </Button>
              </div>

              {showNewWebhookForm && (
                <Card className="glass-card border-border/50">
                  <CardContent className="p-4 space-y-4">
                    <div>
                      <Label>Webhook Name</Label>
                      <Input
                        value={newWebhookName}
                        onChange={(e) => setNewWebhookName(e.target.value)}
                        placeholder="My Webhook"
                      />
                    </div>
                    <div>
                      <Label>Webhook URL</Label>
                      <Input
                        value={newWebhookUrl}
                        onChange={(e) => setNewWebhookUrl(e.target.value)}
                        placeholder="https://example.com/webhook"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleCreateWebhook} className="flex-1">Create</Button>
                      <Button variant="outline" onClick={() => setShowNewWebhookForm(false)}>Cancel</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {webhooks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No webhooks yet. Create one to get started.
                </div>
              ) : (
                <div className="space-y-2">
                  {webhooks.map(webhook => (
                    <Card key={webhook.id} className="glass-card border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{webhook.webhook_name}</h4>
                              {webhook.is_verified ? (
                                <Badge variant="default">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Verified
                                </Badge>
                              ) : (
                                <Badge variant="outline">Unverified</Badge>
                              )}
                              {webhook.is_active ? (
                                <Badge variant="secondary">Active</Badge>
                              ) : (
                                <Badge variant="outline">Inactive</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{webhook.webhook_url}</p>
                            <p className="text-xs text-muted-foreground">
                              {webhook.successful_deliveries} successful • {webhook.failed_deliveries} failed
                            </p>
                          </div>
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

