/**
 * Partner Sync System
 * Enables data sharing and synchronization between connected partners.
 * Partner connections are configured via environment variables for security.
 */

import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { v4 as uuidv4 } from "uuid";

// ============================================
// Types
// ============================================

export type PartnerStatus = "pending" | "connected" | "rejected" | "blocked";

export type SharePermission = 
  | "measurements"
  | "progress"
  | "achievements"
  | "routines"
  | "health_data"
  | "all";

export interface PartnerConnection {
  id: string;
  userId: string;
  partnerUserId: string | null;
  partnerEmail: string;
  status: PartnerStatus;
  permissions: SharePermission[];
  createdAt: Date;
  updatedAt: Date;
  connectedAt: Date | null;
  nickname?: string;
}

export interface PartnerInvite {
  id: string;
  fromUserId: string;
  fromEmail: string;
  toEmail: string;
  permissions: SharePermission[];
  status: "pending" | "accepted" | "rejected" | "expired";
  createdAt: Date;
  expiresAt: Date;
  message?: string;
}

export interface SharedData {
  type: SharePermission;
  data: any;
  sharedAt: Date;
  fromUserId: string;
}

// ============================================
// Storage Keys
// ============================================

const PARTNER_CONNECTIONS_KEY = "partner_connections";
const PARTNER_INVITES_KEY = "partner_invites";
const SHARED_DATA_KEY = "partner_shared_data";

// ============================================
// Environment Configuration
// ============================================

/**
 * Get pre-configured partner emails from environment
 * These are partners that are automatically connected when users sign up
 */
function getConfiguredPartnerEmails(): string[] {
  const partners: string[] = [];
  
  // Primary partner email
  const primaryPartner = import.meta.env.VITE_PARTNER_EMAIL;
  if (primaryPartner) {
    partners.push(primaryPartner.toLowerCase().trim());
  }
  
  // Additional partners (comma-separated)
  const additionalPartners = import.meta.env.VITE_ADDITIONAL_PARTNERS;
  if (additionalPartners) {
    const extras = additionalPartners.split(",").map((e: string) => e.toLowerCase().trim()).filter(Boolean);
    partners.push(...extras);
  }
  
  return [...new Set(partners)];
}

// ============================================
// Local Storage Helpers
// ============================================

function getStoredConnections(userId: string): PartnerConnection[] {
  try {
    const stored = localStorage.getItem(`${PARTNER_CONNECTIONS_KEY}_${userId}`);
    if (stored) {
      const connections = JSON.parse(stored);
      return connections.map((c: any) => ({
        ...c,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt),
        connectedAt: c.connectedAt ? new Date(c.connectedAt) : null,
      }));
    }
  } catch {
    // localStorage may not be available
  }
  return [];
}

function setStoredConnections(userId: string, connections: PartnerConnection[]): void {
  try {
    localStorage.setItem(`${PARTNER_CONNECTIONS_KEY}_${userId}`, JSON.stringify(connections));
  } catch {
    // localStorage may not be available
  }
}

function getStoredInvites(userId: string): PartnerInvite[] {
  try {
    const stored = localStorage.getItem(`${PARTNER_INVITES_KEY}_${userId}`);
    if (stored) {
      const invites = JSON.parse(stored);
      return invites.map((i: any) => ({
        ...i,
        createdAt: new Date(i.createdAt),
        expiresAt: new Date(i.expiresAt),
      }));
    }
  } catch {
    // localStorage may not be available
  }
  return [];
}

function setStoredInvites(userId: string, invites: PartnerInvite[]): void {
  try {
    localStorage.setItem(`${PARTNER_INVITES_KEY}_${userId}`, JSON.stringify(invites));
  } catch {
    // localStorage may not be available
  }
}

function getStoredSharedData(userId: string): SharedData[] {
  try {
    const stored = localStorage.getItem(`${SHARED_DATA_KEY}_${userId}`);
    if (stored) {
      const data = JSON.parse(stored);
      return data.map((d: any) => ({
        ...d,
        sharedAt: new Date(d.sharedAt),
      }));
    }
  } catch {
    // localStorage may not be available
  }
  return [];
}

function setStoredSharedData(userId: string, data: SharedData[]): void {
  try {
    localStorage.setItem(`${SHARED_DATA_KEY}_${userId}`, JSON.stringify(data));
  } catch {
    // localStorage may not be available
  }
}

// ============================================
// Partner Sync Class
// ============================================

export class PartnerSyncManager {
  private userId: string | null = null;
  private userEmail: string | null = null;
  private connections: PartnerConnection[] = [];
  private invites: PartnerInvite[] = [];
  private listeners: Set<() => void> = new Set();

  /**
   * Initialize the partner sync manager for a user
   */
  async initialize(user: User): Promise<void> {
    this.userId = user.id;
    this.userEmail = user.email || null;
    
    // Load existing connections
    this.connections = getStoredConnections(user.id);
    this.invites = getStoredInvites(user.id);
    
    // Auto-connect with configured partners
    await this.autoConnectConfiguredPartners();
    
    // Check for pending invites
    await this.checkPendingInvites();
    
    logger.info("[partnerSync] Initialized", { userId: user.id });
  }

  /**
   * Auto-connect with partners configured in environment
   */
  private async autoConnectConfiguredPartners(): Promise<void> {
    if (!this.userId || !this.userEmail) return;
    
    const configuredPartners = getConfiguredPartnerEmails();
    
    for (const partnerEmail of configuredPartners) {
      // Skip if already connected
      const existing = this.connections.find(
        c => c.partnerEmail.toLowerCase() === partnerEmail
      );
      
      if (!existing) {
        // Create auto-connection
        const connection: PartnerConnection = {
          id: uuidv4(),
          userId: this.userId,
          partnerUserId: null, // Will be resolved when partner logs in
          partnerEmail: partnerEmail,
          status: "connected",
          permissions: ["all"], // Full sharing for configured partners
          createdAt: new Date(),
          updatedAt: new Date(),
          connectedAt: new Date(),
          nickname: "Partner",
        };
        
        this.connections.push(connection);
        logger.info("[partnerSync] Auto-connected with configured partner", { partnerEmail });
      }
    }
    
    this.saveConnections();
  }

  /**
   * Check for pending invites for this user
   */
  private async checkPendingInvites(): Promise<void> {
    if (!this.userEmail) return;
    
    // In a real implementation, this would query the database
    // For now, we check localStorage for cross-user invites
    // This is a simplified local implementation
  }

  /**
   * Send a partner invitation
   */
  async sendInvite(
    toEmail: string,
    permissions: SharePermission[] = ["measurements", "progress"],
    message?: string
  ): Promise<{ success: boolean; error?: string; invite?: PartnerInvite }> {
    if (!this.userId || !this.userEmail) {
      return { success: false, error: "Not authenticated" };
    }
    
    // Check if already connected
    const existing = this.connections.find(
      c => c.partnerEmail.toLowerCase() === toEmail.toLowerCase()
    );
    
    if (existing && existing.status === "connected") {
      return { success: false, error: "Already connected with this partner" };
    }
    
    // Create invite
    const invite: PartnerInvite = {
      id: uuidv4(),
      fromUserId: this.userId,
      fromEmail: this.userEmail,
      toEmail: toEmail.toLowerCase(),
      permissions,
      status: "pending",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      message,
    };
    
    this.invites.push(invite);
    this.saveInvites();
    
    // Create pending connection
    const connection: PartnerConnection = {
      id: uuidv4(),
      userId: this.userId,
      partnerUserId: null,
      partnerEmail: toEmail.toLowerCase(),
      status: "pending",
      permissions,
      createdAt: new Date(),
      updatedAt: new Date(),
      connectedAt: null,
    };
    
    this.connections.push(connection);
    this.saveConnections();
    
    this.notifyListeners();
    
    logger.info("[partnerSync] Invite sent", { toEmail });
    
    return { success: true, invite };
  }

  /**
   * Accept a partner invitation
   */
  async acceptInvite(inviteId: string): Promise<{ success: boolean; error?: string }> {
    const invite = this.invites.find(i => i.id === inviteId);
    
    if (!invite) {
      return { success: false, error: "Invite not found" };
    }
    
    if (invite.status !== "pending") {
      return { success: false, error: "Invite is no longer pending" };
    }
    
    if (new Date() > invite.expiresAt) {
      invite.status = "expired";
      this.saveInvites();
      return { success: false, error: "Invite has expired" };
    }
    
    // Update invite status
    invite.status = "accepted";
    this.saveInvites();
    
    // Create or update connection
    const existingConnection = this.connections.find(
      c => c.partnerEmail === invite.fromEmail
    );
    
    if (existingConnection) {
      existingConnection.status = "connected";
      existingConnection.connectedAt = new Date();
      existingConnection.updatedAt = new Date();
      existingConnection.partnerUserId = invite.fromUserId;
    } else {
      const connection: PartnerConnection = {
        id: uuidv4(),
        userId: this.userId!,
        partnerUserId: invite.fromUserId,
        partnerEmail: invite.fromEmail,
        status: "connected",
        permissions: invite.permissions,
        createdAt: new Date(),
        updatedAt: new Date(),
        connectedAt: new Date(),
      };
      this.connections.push(connection);
    }
    
    this.saveConnections();
    this.notifyListeners();
    
    logger.info("[partnerSync] Invite accepted", { inviteId });
    
    return { success: true };
  }

  /**
   * Reject a partner invitation
   */
  async rejectInvite(inviteId: string): Promise<{ success: boolean; error?: string }> {
    const invite = this.invites.find(i => i.id === inviteId);
    
    if (!invite) {
      return { success: false, error: "Invite not found" };
    }
    
    invite.status = "rejected";
    this.saveInvites();
    
    // Update connection status
    const connection = this.connections.find(
      c => c.partnerEmail === invite.fromEmail
    );
    
    if (connection) {
      connection.status = "rejected";
      connection.updatedAt = new Date();
      this.saveConnections();
    }
    
    this.notifyListeners();
    
    return { success: true };
  }

  /**
   * Remove a partner connection
   */
  async removeConnection(connectionId: string): Promise<{ success: boolean; error?: string }> {
    const index = this.connections.findIndex(c => c.id === connectionId);
    
    if (index === -1) {
      return { success: false, error: "Connection not found" };
    }
    
    this.connections.splice(index, 1);
    this.saveConnections();
    this.notifyListeners();
    
    logger.info("[partnerSync] Connection removed", { connectionId });
    
    return { success: true };
  }

  /**
   * Update connection permissions
   */
  updatePermissions(
    connectionId: string,
    permissions: SharePermission[]
  ): { success: boolean; error?: string } {
    const connection = this.connections.find(c => c.id === connectionId);
    
    if (!connection) {
      return { success: false, error: "Connection not found" };
    }
    
    connection.permissions = permissions;
    connection.updatedAt = new Date();
    this.saveConnections();
    this.notifyListeners();
    
    return { success: true };
  }

  /**
   * Share data with partners
   */
  async shareData(
    type: SharePermission,
    data: any
  ): Promise<{ success: boolean; sharedWith: string[] }> {
    if (!this.userId) {
      return { success: false, sharedWith: [] };
    }
    
    const sharedWith: string[] = [];
    
    for (const connection of this.connections) {
      if (connection.status !== "connected") continue;
      
      // Check if permission allows this data type
      const hasPermission = 
        connection.permissions.includes("all") ||
        connection.permissions.includes(type);
      
      if (!hasPermission) continue;
      
      // Store shared data (in real implementation, this would sync to server)
      const sharedData: SharedData = {
        type,
        data,
        sharedAt: new Date(),
        fromUserId: this.userId,
      };
      
      // Store for partner to receive
      if (connection.partnerUserId) {
        const partnerData = getStoredSharedData(connection.partnerUserId);
        partnerData.push(sharedData);
        setStoredSharedData(connection.partnerUserId, partnerData);
        sharedWith.push(connection.partnerEmail);
      }
    }
    
    logger.info("[partnerSync] Data shared", { type, sharedWith });
    
    return { success: true, sharedWith };
  }

  /**
   * Get data shared by partners
   */
  getSharedData(type?: SharePermission): SharedData[] {
    if (!this.userId) return [];
    
    const allData = getStoredSharedData(this.userId);
    
    if (type) {
      return allData.filter(d => d.type === type);
    }
    
    return allData;
  }

  /**
   * Get all connections
   */
  getConnections(): PartnerConnection[] {
    return [...this.connections];
  }

  /**
   * Get connected partners only
   */
  getConnectedPartners(): PartnerConnection[] {
    return this.connections.filter(c => c.status === "connected");
  }

  /**
   * Get pending invites
   */
  getPendingInvites(): PartnerInvite[] {
    return this.invites.filter(
      i => i.status === "pending" && new Date() < i.expiresAt
    );
  }

  /**
   * Check if connected with a specific email
   */
  isConnectedWith(email: string): boolean {
    return this.connections.some(
      c => c.partnerEmail.toLowerCase() === email.toLowerCase() && 
           c.status === "connected"
    );
  }

  /**
   * Subscribe to connection changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Clear all partner data (on logout)
   */
  clear(): void {
    this.userId = null;
    this.userEmail = null;
    this.connections = [];
    this.invites = [];
    this.notifyListeners();
  }

  private saveConnections(): void {
    if (this.userId) {
      setStoredConnections(this.userId, this.connections);
    }
  }

  private saveInvites(): void {
    if (this.userId) {
      setStoredInvites(this.userId, this.invites);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}

// ============================================
// Singleton Instance
// ============================================

export const partnerSync = new PartnerSyncManager();

export default partnerSync;
