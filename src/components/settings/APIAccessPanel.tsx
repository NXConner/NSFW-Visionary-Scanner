// API Access Settings Panel
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Key, Webhook, Plus, Copy, Trash2, RefreshCw, Eye, EyeOff, 
  Check, AlertCircle, Clock, Activity, ChevronDown, ChevronRight, X, Send
} from 'lucide-react';
import { 
  getAPIAccessManager, APIKey, Webhook as WebhookType, 
  APIScope, WebhookEvent, WebhookDelivery 
} from '@/lib/api/APIAccessManager';
import { cn } from '@/lib/utils';

interface APIAccessPanelProps {
  className?: string;
}

export const APIAccessPanel: React.FC<APIAccessPanelProps> = ({ className }) => {
  const [activeTab, setActiveTab] = useState<'keys' | 'webhooks'>('keys');
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookType[]>([]);
  const [showCreateKey, setShowCreateKey] = useState(false);
  const [showCreateWebhook, setShowCreateWebhook] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedWebhooks, setExpandedWebhooks] = useState<Set<string>>(new Set());
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const manager = getAPIAccessManager();

  // Form states
  const [keyForm, setKeyForm] = useState({ name: '', scopes: [] as APIScope[], rateLimit: 60 });
  const [webhookForm, setWebhookForm] = useState({ name: '', url: '', events: [] as WebhookEvent[] });

  useEffect(() => {
    refresh();
    return manager.subscribe(refresh);
  }, []);

  const refresh = () => {
    setApiKeys(manager.getAPIKeys());
    setWebhooks(manager.getWebhooks());
    setDeliveries(manager.getDeliveries());
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleRevealKey = (id: string) => {
    const newRevealed = new Set(revealedKeys);
    if (newRevealed.has(id)) newRevealed.delete(id);
    else newRevealed.add(id);
    setRevealedKeys(newRevealed);
  };

  const toggleExpandWebhook = (id: string) => {
    const newExpanded = new Set(expandedWebhooks);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedWebhooks(newExpanded);
  };

  const handleCreateKey = () => {
    if (!keyForm.name || keyForm.scopes.length === 0) return;
    const newKey = manager.createAPIKey(keyForm.name, keyForm.scopes, keyForm.rateLimit);
    // Briefly reveal the new key
    setRevealedKeys(new Set([newKey.id]));
    setKeyForm({ name: '', scopes: [], rateLimit: 60 });
    setShowCreateKey(false);
    refresh();
  };

  const handleDeleteKey = (id: string) => {
    if (confirm('Revoke this API key? This cannot be undone.')) {
      manager.revokeAPIKey(id);
      refresh();
    }
  };

  const handleRegenerateKey = (id: string) => {
    if (confirm('Regenerate this API key? The old key will stop working immediately.')) {
      const newKey = manager.regenerateAPIKey(id);
      if (newKey) {
        setRevealedKeys(new Set([id]));
      }
      refresh();
    }
  };

  const handleCreateWebhook = () => {
    if (!webhookForm.name || !webhookForm.url || webhookForm.events.length === 0) return;
    manager.createWebhook(webhookForm.name, webhookForm.url, webhookForm.events);
    setWebhookForm({ name: '', url: '', events: [] });
    setShowCreateWebhook(false);
    refresh();
  };

  const handleDeleteWebhook = (id: string) => {
    if (confirm('Delete this webhook?')) {
      manager.deleteWebhook(id);
      refresh();
    }
  };

  const handleTestWebhook = async (id: string) => {
    await manager.testWebhook(id);
    refresh();
  };

  const toggleScope = (scope: APIScope) => {
    const scopes = keyForm.scopes.includes(scope)
      ? keyForm.scopes.filter(s => s !== scope)
      : [...keyForm.scopes, scope];
    setKeyForm({ ...keyForm, scopes });
  };

  const toggleEvent = (event: WebhookEvent) => {
    const events = webhookForm.events.includes(event)
      ? webhookForm.events.filter(e => e !== event)
      : [...webhookForm.events, event];
    setWebhookForm({ ...webhookForm, events });
  };

  return (
    <div className={cn('p-4 space-y-6', className)}>
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-800/50 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('keys')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all',
            activeTab === 'keys' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
          )}
        >
          <Key className="w-4 h-4" /> API Keys
        </button>
        <button
          onClick={() => setActiveTab('webhooks')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all',
            activeTab === 'webhooks' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
          )}
        >
          <Webhook className="w-4 h-4" /> Webhooks
        </button>
      </div>

      {/* API Keys Tab */}
      {activeTab === 'keys' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Key className="w-5 h-5 text-blue-400" /> API Keys
            </h3>
            <button
              onClick={() => setShowCreateKey(!showCreateKey)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Create Key
            </button>
          </div>

          {/* Create Key Form */}
          <AnimatePresence>
            {showCreateKey && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 space-y-4"
              >
                <input
                  type="text"
                  placeholder="Key name (e.g., Production API)"
                  value={keyForm.name}
                  onChange={(e) => setKeyForm({ ...keyForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
                
                <div>
                  <label className="text-sm text-gray-400 block mb-2">Scopes</label>
                  <div className="flex flex-wrap gap-2">
                    {manager.getAvailableScopes().map(s => (
                      <button
                        key={s.scope}
                        onClick={() => toggleScope(s.scope)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg border text-sm transition-all',
                          keyForm.scopes.includes(s.scope)
                            ? 'bg-blue-500/30 border-blue-500 text-blue-300'
                            : 'bg-gray-700 border-gray-600 hover:border-gray-500'
                        )}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-2">Rate Limit (requests/min)</label>
                  <input
                    type="number"
                    value={keyForm.rateLimit}
                    onChange={(e) => setKeyForm({ ...keyForm, rateLimit: parseInt(e.target.value) || 60 })}
                    className="w-32 px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowCreateKey(false)} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm">Cancel</button>
                  <button 
                    onClick={handleCreateKey} 
                    disabled={!keyForm.name || keyForm.scopes.length === 0}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm disabled:opacity-50"
                  >
                    Create Key
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* API Keys List */}
          <div className="space-y-3">
            {apiKeys.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Key className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No API keys created yet</p>
              </div>
            ) : (
              apiKeys.map(apiKey => {
                const fullKey = revealedKeys.has(apiKey.id) 
                  ? manager.getAPIKey(apiKey.id, true)?.key 
                  : apiKey.key;
                return (
                  <motion.div
                    key={apiKey.id}
                    layout
                    className={cn(
                      'bg-gray-800/50 rounded-xl p-4 border',
                      apiKey.isActive ? 'border-gray-700' : 'border-red-500/30 opacity-60'
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold flex items-center gap-2">
                          {apiKey.name}
                          {!apiKey.isActive && <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded">Inactive</span>}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-xs bg-gray-900 px-2 py-1 rounded font-mono">
                            {fullKey}
                          </code>
                          <button 
                            onClick={() => toggleRevealKey(apiKey.id)}
                            className="p-1 hover:bg-gray-700 rounded text-gray-400"
                          >
                            {revealedKeys.has(apiKey.id) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                          <button 
                            onClick={() => copyToClipboard(fullKey || '', apiKey.id)}
                            className="p-1 hover:bg-gray-700 rounded text-gray-400"
                          >
                            {copiedId === apiKey.id ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => handleRegenerateKey(apiKey.id)}
                          className="p-2 hover:bg-gray-700 rounded-lg text-gray-400"
                          title="Regenerate"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteKey(apiKey.id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400"
                          title="Revoke"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {apiKey.scopes.map(scope => (
                        <span key={scope} className="text-xs px-2 py-0.5 bg-gray-700 rounded">{scope}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Rate: {apiKey.rateLimit}/min</span>
                      <span>Used: {apiKey.usageCount}x</span>
                      {apiKey.lastUsedAt && (
                        <span>Last: {new Date(apiKey.lastUsedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Webhooks Tab */}
      {activeTab === 'webhooks' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Webhook className="w-5 h-5 text-purple-400" /> Webhooks
            </h3>
            <button
              onClick={() => setShowCreateWebhook(!showCreateWebhook)}
              className="flex items-center gap-2 px-3 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Create Webhook
            </button>
          </div>

          {/* Create Webhook Form */}
          <AnimatePresence>
            {showCreateWebhook && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 space-y-4"
              >
                <input
                  type="text"
                  placeholder="Webhook name"
                  value={webhookForm.name}
                  onChange={(e) => setWebhookForm({ ...webhookForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                />
                <input
                  type="url"
                  placeholder="https://your-server.com/webhook"
                  value={webhookForm.url}
                  onChange={(e) => setWebhookForm({ ...webhookForm, url: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                />
                
                <div>
                  <label className="text-sm text-gray-400 block mb-2">Events</label>
                  <div className="flex flex-wrap gap-2">
                    {manager.getAvailableEvents().map(e => (
                      <button
                        key={e.event}
                        onClick={() => toggleEvent(e.event)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg border text-sm transition-all',
                          webhookForm.events.includes(e.event)
                            ? 'bg-purple-500/30 border-purple-500 text-purple-300'
                            : 'bg-gray-700 border-gray-600 hover:border-gray-500'
                        )}
                      >
                        {e.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowCreateWebhook(false)} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm">Cancel</button>
                  <button 
                    onClick={handleCreateWebhook}
                    disabled={!webhookForm.name || !webhookForm.url || webhookForm.events.length === 0}
                    className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-sm disabled:opacity-50"
                  >
                    Create Webhook
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Webhooks List */}
          <div className="space-y-3">
            {webhooks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Webhook className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No webhooks configured yet</p>
              </div>
            ) : (
              webhooks.map(webhook => {
                const webhookDeliveries = deliveries.filter(d => d.webhookId === webhook.id);
                return (
                  <motion.div
                    key={webhook.id}
                    layout
                    className={cn(
                      'bg-gray-800/50 rounded-xl border overflow-hidden',
                      webhook.isActive ? 'border-gray-700' : 'border-red-500/30 opacity-60'
                    )}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold flex items-center gap-2">
                            {webhook.name}
                            {!webhook.isActive && <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded">Inactive</span>}
                            {webhook.failureCount > 0 && (
                              <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> {webhook.failureCount} failures
                              </span>
                            )}
                          </h4>
                          <code className="text-xs text-gray-400 break-all">{webhook.url}</code>
                        </div>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => handleTestWebhook(webhook.id)}
                            className="p-2 hover:bg-gray-700 rounded-lg text-gray-400"
                            title="Test"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => toggleExpandWebhook(webhook.id)}
                            className="p-2 hover:bg-gray-700 rounded-lg text-gray-400"
                          >
                            {expandedWebhooks.has(webhook.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                          <button 
                            onClick={() => handleDeleteWebhook(webhook.id)}
                            className="p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {webhook.events.map(event => (
                          <span key={event} className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded">{event}</span>
                        ))}
                      </div>
                    </div>

                    {/* Deliveries */}
                    <AnimatePresence>
                      {expandedWebhooks.has(webhook.id) && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          className="border-t border-gray-700 overflow-hidden"
                        >
                          <div className="p-4 space-y-2">
                            <h5 className="text-sm font-medium text-gray-400">Recent Deliveries</h5>
                            {webhookDeliveries.length === 0 ? (
                              <p className="text-xs text-gray-500">No deliveries yet</p>
                            ) : (
                              webhookDeliveries.slice(0, 5).map(delivery => (
                                <div key={delivery.id} className="flex items-center justify-between text-xs bg-gray-900/50 p-2 rounded">
                                  <div className="flex items-center gap-2">
                                    {delivery.status === 'success' ? (
                                      <Check className="w-3 h-3 text-green-400" />
                                    ) : delivery.status === 'failed' ? (
                                      <AlertCircle className="w-3 h-3 text-red-400" />
                                    ) : (
                                      <Clock className="w-3 h-3 text-amber-400" />
                                    )}
                                    <span>{delivery.event}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-500">
                                    {delivery.duration && <span>{delivery.duration}ms</span>}
                                    <span>{new Date(delivery.timestamp).toLocaleTimeString()}</span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default APIAccessPanel;
