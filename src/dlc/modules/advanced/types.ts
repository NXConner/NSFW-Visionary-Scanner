/**
 * Advanced Features Module Types
 */

// Multi-Camera Recording Types
export interface RecordingSession {
  id: string;
  name: string;
  cameras: CameraSource[];
  duration: number; // seconds
  status: RecordingStatus;
  startedAt?: Date;
  endedAt?: Date;
  outputPath?: string;
  thumbnails?: string[];
  isEncrypted: boolean;
}

export interface CameraSource {
  id: string;
  name: string;
  type: "front" | "back" | "external";
  isActive: boolean;
  position: { x: number; y: number; width: number; height: number };
  quality: VideoQuality;
  audio: boolean;
}

export type RecordingStatus =
  | "idle"
  | "recording"
  | "paused"
  | "processing"
  | "completed"
  | "failed";
export type VideoQuality = "480p" | "720p" | "1080p" | "4k";

export interface RecordingSettings {
  maxDuration: number;
  quality: VideoQuality;
  audioEnabled: boolean;
  autoEncrypt: boolean;
  saveLocation: "local" | "cloud";
  gridLayout: GridLayout;
}

export type GridLayout = "1x1" | "2x1" | "2x2" | "pip";

// Intimate Date Planner Types
export interface IntimateDate {
  id: string;
  title: string;
  description?: string;
  scheduledFor: Date;
  duration: number; // minutes
  activities: DateActivity[];
  mood: DateMood;
  location?: string;
  notes?: string;
  reminder?: DateReminder;
  isSharedWithPartner: boolean;
  partnerConfirmed: boolean;
  status: DateStatus;
  createdAt: Date;
}

export interface DateActivity {
  id: string;
  name: string;
  description: string;
  duration: number;
  order: number;
  category: ActivityCategory;
  supplies?: string[];
}

export type ActivityCategory =
  | "foreplay"
  | "massage"
  | "intimacy"
  | "aftercare"
  | "romantic"
  | "playful"
  | "exploration";

export type DateMood =
  | "romantic"
  | "passionate"
  | "playful"
  | "relaxed"
  | "adventurous"
  | "spontaneous";

export interface DateReminder {
  type: "notification" | "email" | "both";
  beforeMinutes: number;
}

export type DateStatus = "planned" | "confirmed" | "completed" | "cancelled";

export interface DateTemplate {
  id: string;
  name: string;
  description: string;
  duration: number;
  activities: DateActivity[];
  mood: DateMood;
  rating: number;
  useCount: number;
  isBuiltIn: boolean;
}

// AI Companion Types
export interface AICompanionChat {
  id: string;
  messages: AIMessage[];
  topic?: string;
  mood?: ChatMood;
  createdAt: Date;
  lastMessageAt: Date;
}

export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestions?: string[];
  resources?: AIResource[];
}

export interface AIResource {
  id: string;
  type: "article" | "video" | "position" | "tip";
  title: string;
  url: string;
  thumbnail?: string;
}

export type ChatMood = "curious" | "playful" | "serious" | "advice-seeking";

export interface AICompanionSettings {
  personality: AIPersonality;
  responseTone: ResponseTone;
  suggestResources: boolean;
  rememberContext: boolean;
  maxContextMessages: number;
}

export type AIPersonality = "friendly" | "professional" | "playful" | "empathetic";
export type ResponseTone = "casual" | "formal" | "encouraging" | "direct";

// Partner Video Sync Types
export interface VideoSyncSession {
  id: string;
  sessionCode: string;
  hostId: string;
  participantId?: string;
  status: SyncSessionStatus;
  videoId?: string;
  currentTime: number;
  isPlaying: boolean;
  createdAt: Date;
  connectedAt?: Date;
  endedAt?: Date;
}

export type SyncSessionStatus = "waiting" | "connected" | "active" | "ended";

export interface SyncInvite {
  sessionCode: string;
  expiresAt: Date;
  shareUrl: string;
}

// Advanced State
export interface AdvancedState {
  // Recording
  recordingSessions: RecordingSession[];
  currentRecording?: RecordingSession;
  recordingSettings: RecordingSettings;

  // Date Planner
  dates: IntimateDate[];
  dateTemplates: DateTemplate[];
  upcomingDate?: IntimateDate;

  // AI Companion
  chats: AICompanionChat[];
  currentChat?: AICompanionChat;
  companionSettings: AICompanionSettings;

  // Partner Sync
  syncSession?: VideoSyncSession;
  syncInvite?: SyncInvite;

  // General
  isLoading: boolean;
  error: string | null;
}
