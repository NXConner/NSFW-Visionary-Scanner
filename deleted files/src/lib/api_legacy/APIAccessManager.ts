// API Access Manager with Webhooks
import { v4 as uuidv4 } from "uuid";

export interface APIKey {
  id: string;
  name: string;
  key: string;
  prefix: string;
  scopes: APIScope[];
  rateLimit: number; // requests per minute
  createdAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
  isActive: boolean;
  usageCount: number;
}

export type APIScope =
  | "read:scans"
  | "write:scans"
  | "read:measurements"
  | "read:health"
  | "write:health"
  | "read:profile"
  | "webhooks:manage";

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  isActive: boolean;
  createdAt: string;
  lastTriggeredAt?: string;
  failureCount: number;
  headers?: Record<string, string>;
}

export type WebhookEvent =
  | "scan.created"
  | "scan.completed"
  | "measurement.created"
  | "health.updated"
  | "achievement.unlocked"
  | "medication.reminder";

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  payload: any;
  status: "pending" | "success" | "failed";
  statusCode?: number;
  response?: string;
  timestamp: string;
  duration?: number;
}

export interface APIUsageStats {
  totalRequests: number;
  requestsToday: number;
  requestsThisMonth: number;
  topEndpoints: { endpoint: string; count: number }[];
  errorRate: number;
  avgResponseTime: number;
}

const KEYS_STORAGE = "api_keys";
const WEBHOOKS_STORAGE = "api_webhooks";
const DELIVERIES_STORAGE = "webhook_deliveries";

export class APIAccessManager {
  private keys: Map<string, APIKey> = new Map();
  private webhooks: Map<string, Webhook> = new Map();
  private deliveries: WebhookDelivery[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const keysData = localStorage.getItem(KEYS_STORAGE);
      if (keysData) {
        const parsed = JSON.parse(keysData);
        parsed.forEach((key: APIKey) => this.keys.set(key.id, key));
      }

      const webhooksData = localStorage.getItem(WEBHOOKS_STORAGE);
      if (webhooksData) {
        const parsed = JSON.parse(webhooksData);
        parsed.forEach((wh: Webhook) => this.webhooks.set(wh.id, wh));
      }

      const deliveriesData = localStorage.getItem(DELIVERIES_STORAGE);
      if (deliveriesData) {
        this.deliveries = JSON.parse(deliveriesData);
      }
    } catch (e) {
      console.error("Failed to load API data:", e);
    }
  }

  private save(): void {
    try {
      localStorage.setItem(KEYS_STORAGE, JSON.stringify(Array.from(this.keys.values())));
      localStorage.setItem(WEBHOOKS_STORAGE, JSON.stringify(Array.from(this.webhooks.values())));
      localStorage.setItem(DELIVERIES_STORAGE, JSON.stringify(this.deliveries.slice(-100)));
      this.notifyListeners();
    } catch (e) {
      console.error("Failed to save API data:", e);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(cb => cb());
  }

  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // API Keys
  private generateAPIKey(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let key = "";
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  }

  createAPIKey(
    name: string,
    scopes: APIScope[],
    rateLimit: number = 60,
    expiresInDays?: number,
  ): APIKey {
    const key = this.generateAPIKey();
    const prefix = key.substring(0, 8);

    const apiKey: APIKey = {
      id: uuidv4(),
      name,
      key,
      prefix,
      scopes,
      rateLimit,
      createdAt: new Date().toISOString(),
      expiresAt: expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : undefined,
      isActive: true,
      usageCount: 0,
    };

    this.keys.set(apiKey.id, apiKey);
    this.save();
    return apiKey;
  }

  getAPIKeys(): APIKey[] {
    return Array.from(this.keys.values()).map(k => ({
      ...k,
      key: `${k.prefix}${"*".repeat(24)}`, // Mask the key
    }));
  }

  getAPIKey(id: string, includeFullKey: boolean = false): APIKey | undefined {
    const key = this.keys.get(id);
    if (!key) return undefined;
    if (includeFullKey) return key;
    return { ...key, key: `${key.prefix}${"*".repeat(24)}` };
  }

  updateAPIKey(
    id: string,
    updates: Partial<Pick<APIKey, "name" | "scopes" | "rateLimit" | "isActive">>,
  ): APIKey | null {
    const key = this.keys.get(id);
    if (!key) return null;

    const updated = { ...key, ...updates };
    this.keys.set(id, updated);
    this.save();
    return { ...updated, key: `${updated.prefix}${"*".repeat(24)}` };
  }

  revokeAPIKey(id: string): boolean {
    const result = this.keys.delete(id);
    if (result) this.save();
    return result;
  }

  regenerateAPIKey(id: string): APIKey | null {
    const existing = this.keys.get(id);
    if (!existing) return null;

    const newKey = this.generateAPIKey();
    existing.key = newKey;
    existing.prefix = newKey.substring(0, 8);
    this.keys.set(id, existing);
    this.save();
    return existing; // Return full key only on regeneration
  }

  validateAPIKey(key: string): { valid: boolean; apiKey?: APIKey; error?: string } {
    const apiKey = Array.from(this.keys.values()).find(k => k.key === key);

    if (!apiKey) {
      return { valid: false, error: "Invalid API key" };
    }
    if (!apiKey.isActive) {
      return { valid: false, error: "API key is inactive" };
    }
    if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
      return { valid: false, error: "API key has expired" };
    }

    // Update usage
    apiKey.lastUsedAt = new Date().toISOString();
    apiKey.usageCount++;
    this.keys.set(apiKey.id, apiKey);
    this.save();

    return { valid: true, apiKey };
  }

  // Webhooks
  private generateWebhookSecret(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let secret = "whsec_";
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  }

  createWebhook(
    name: string,
    url: string,
    events: WebhookEvent[],
    headers?: Record<string, string>,
  ): Webhook {
    const webhook: Webhook = {
      id: uuidv4(),
      name,
      url,
      events,
      secret: this.generateWebhookSecret(),
      isActive: true,
      createdAt: new Date().toISOString(),
      failureCount: 0,
      headers,
    };

    this.webhooks.set(webhook.id, webhook);
    this.save();
    return webhook;
  }

  getWebhooks(): Webhook[] {
    return Array.from(this.webhooks.values());
  }

  getWebhook(id: string): Webhook | undefined {
    return this.webhooks.get(id);
  }

  updateWebhook(
    id: string,
    updates: Partial<Pick<Webhook, "name" | "url" | "events" | "isActive" | "headers">>,
  ): Webhook | null {
    const webhook = this.webhooks.get(id);
    if (!webhook) return null;

    const updated = { ...webhook, ...updates };
    this.webhooks.set(id, updated);
    this.save();
    return updated;
  }

  deleteWebhook(id: string): boolean {
    const result = this.webhooks.delete(id);
    if (result) this.save();
    return result;
  }

  regenerateWebhookSecret(id: string): Webhook | null {
    const webhook = this.webhooks.get(id);
    if (!webhook) return null;

    webhook.secret = this.generateWebhookSecret();
    this.webhooks.set(id, webhook);
    this.save();
    return webhook;
  }

  async triggerWebhook(event: WebhookEvent, payload: any): Promise<void> {
    const webhooks = this.getWebhooks().filter(wh => wh.isActive && wh.events.includes(event));

    for (const webhook of webhooks) {
      const delivery: WebhookDelivery = {
        id: uuidv4(),
        webhookId: webhook.id,
        event,
        payload,
        status: "pending",
        timestamp: new Date().toISOString(),
      };

      try {
        const startTime = Date.now();
        // In production, this would be an actual HTTP request
        // For now, we simulate the delivery
        await new Promise(resolve => setTimeout(resolve, 100));

        delivery.status = "success";
        delivery.statusCode = 200;
        delivery.duration = Date.now() - startTime;

        webhook.lastTriggeredAt = new Date().toISOString();
        webhook.failureCount = 0;
      } catch (error: any) {
        delivery.status = "failed";
        delivery.response = error.message;
        webhook.failureCount++;

        // Disable webhook after 10 consecutive failures
        if (webhook.failureCount >= 10) {
          webhook.isActive = false;
        }
      }

      this.deliveries.push(delivery);
      this.webhooks.set(webhook.id, webhook);
    }

    this.save();
  }

  getDeliveries(webhookId?: string, limit: number = 20): WebhookDelivery[] {
    let deliveries = [...this.deliveries].reverse();
    if (webhookId) {
      deliveries = deliveries.filter(d => d.webhookId === webhookId);
    }
    return deliveries.slice(0, limit);
  }

  // Test webhook
  async testWebhook(id: string): Promise<WebhookDelivery> {
    const webhook = this.webhooks.get(id);
    if (!webhook) throw new Error("Webhook not found");

    const delivery: WebhookDelivery = {
      id: uuidv4(),
      webhookId: webhook.id,
      event: "scan.created",
      payload: { test: true, message: "This is a test webhook delivery" },
      status: "pending",
      timestamp: new Date().toISOString(),
    };

    try {
      const startTime = Date.now();
      // Simulated delivery
      await new Promise(resolve => setTimeout(resolve, 200));

      delivery.status = "success";
      delivery.statusCode = 200;
      delivery.duration = Date.now() - startTime;
    } catch (error: any) {
      delivery.status = "failed";
      delivery.response = error.message;
    }

    this.deliveries.push(delivery);
    this.save();
    return delivery;
  }

  // Stats
  getUsageStats(): APIUsageStats {
    const allKeys = Array.from(this.keys.values());
    const today = new Date().toISOString().split("T")[0];
    const thisMonth = new Date().toISOString().substring(0, 7);

    return {
      totalRequests: allKeys.reduce((sum, k) => sum + k.usageCount, 0),
      requestsToday: 0, // Would need request logging to track this
      requestsThisMonth: 0,
      topEndpoints: [],
      errorRate: 0,
      avgResponseTime: 0,
    };
  }

  // Scopes
  getAvailableScopes(): { scope: APIScope; name: string; description: string }[] {
    return [
      { scope: "read:scans", name: "Read Scans", description: "Access scan history and results" },
      { scope: "write:scans", name: "Write Scans", description: "Create and modify scans" },
      {
        scope: "read:measurements",
        name: "Read Measurements",
        description: "Access measurement data",
      },
      {
        scope: "read:health",
        name: "Read Health",
        description: "Access health predictions and trends",
      },
      { scope: "write:health", name: "Write Health", description: "Create health entries" },
      { scope: "read:profile", name: "Read Profile", description: "Access profile information" },
      {
        scope: "webhooks:manage",
        name: "Manage Webhooks",
        description: "Create and manage webhooks",
      },
    ];
  }

  getAvailableEvents(): { event: WebhookEvent; name: string; description: string }[] {
    return [
      { event: "scan.created", name: "Scan Created", description: "When a new scan is initiated" },
      {
        event: "scan.completed",
        name: "Scan Completed",
        description: "When a scan finishes processing",
      },
      {
        event: "measurement.created",
        name: "Measurement Created",
        description: "When a new measurement is recorded",
      },
      {
        event: "health.updated",
        name: "Health Updated",
        description: "When health data is updated",
      },
      {
        event: "achievement.unlocked",
        name: "Achievement Unlocked",
        description: "When user unlocks an achievement",
      },
      {
        event: "medication.reminder",
        name: "Medication Reminder",
        description: "When a medication reminder triggers",
      },
    ];
  }
}

let instance: APIAccessManager | null = null;
export function getAPIAccessManager(): APIAccessManager {
  if (!instance) instance = new APIAccessManager();
  return instance;
}
