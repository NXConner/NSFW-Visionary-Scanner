/**
 * ProfileContext
 * Multi-profile support context for managing user profiles
 */

import * as React from 'react';
import { createContext, useContext, useCallback, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

// ======= Types =======

export interface UserProfile {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  isDefault: boolean;
  pin?: string; // Hashed PIN for profile protection
  settings?: Record<string, unknown>;
  metadata?: {
    measurementCount?: number;
    lastActive?: string;
    goals?: Record<string, unknown>;
  };
}

export interface ProfileSettings {
  multiProfileEnabled: boolean;
  maxProfiles: number;
  requirePinForSwitch: boolean;
  showProfileSwitcher: boolean;
  autoLockTimeout: number; // minutes, 0 = disabled
}

interface ProfileState {
  profiles: UserProfile[];
  activeProfileId: string | null;
  settings: ProfileSettings;
  isLocked: boolean;
  isLoading: boolean;
}

type ProfileAction =
  | { type: 'SET_PROFILES'; payload: UserProfile[] }
  | { type: 'ADD_PROFILE'; payload: UserProfile }
  | { type: 'UPDATE_PROFILE'; payload: { id: string; updates: Partial<UserProfile> } }
  | { type: 'DELETE_PROFILE'; payload: string }
  | { type: 'SET_ACTIVE_PROFILE'; payload: string }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<ProfileSettings> }
  | { type: 'SET_LOCKED'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOAD_STATE'; payload: Partial<ProfileState> };

interface ProfileContextValue extends ProfileState {
  // Profile management
  createProfile: (name: string, options?: Partial<Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>>) => UserProfile;
  updateProfile: (id: string, updates: Partial<UserProfile>) => void;
  deleteProfile: (id: string) => boolean;
  getProfile: (id: string) => UserProfile | undefined;
  getActiveProfile: () => UserProfile | undefined;
  
  // Profile switching
  switchProfile: (id: string, pin?: string) => Promise<boolean>;
  lockProfile: () => void;
  unlockProfile: (pin: string) => boolean;
  
  // Settings
  updateSettings: (settings: Partial<ProfileSettings>) => void;
  
  // Utilities
  canCreateProfile: boolean;
  profileCount: number;
}

// ======= Constants =======

const STORAGE_KEY = 'morphoscan_profiles';
const MAX_PROFILES = 10;

const PROFILE_COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f97316', // orange
  '#22c55e', // green
  '#14b8a6', // teal
  '#f59e0b', // amber
  '#ef4444', // red
  '#6366f1', // indigo
  '#84cc16', // lime
];

const DEFAULT_SETTINGS: ProfileSettings = {
  multiProfileEnabled: false,
  maxProfiles: 5,
  requirePinForSwitch: false,
  showProfileSwitcher: true,
  autoLockTimeout: 0,
};

// ======= Initial State =======

const createDefaultProfile = (): UserProfile => ({
  id: 'default',
  name: 'Default',
  color: PROFILE_COLORS[0],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDefault: true,
  metadata: {
    measurementCount: 0,
    lastActive: new Date().toISOString(),
  },
});

const initialState: ProfileState = {
  profiles: [createDefaultProfile()],
  activeProfileId: 'default',
  settings: DEFAULT_SETTINGS,
  isLocked: false,
  isLoading: true,
};

// ======= Reducer =======

function profileReducer(state: ProfileState, action: ProfileAction): ProfileState {
  switch (action.type) {
    case 'SET_PROFILES':
      return { ...state, profiles: action.payload };

    case 'ADD_PROFILE':
      return {
        ...state,
        profiles: [...state.profiles, action.payload],
      };

    case 'UPDATE_PROFILE': {
      const { id, updates } = action.payload;
      return {
        ...state,
        profiles: state.profiles.map(p =>
          p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
        ),
      };
    }

    case 'DELETE_PROFILE':
      return {
        ...state,
        profiles: state.profiles.filter(p => p.id !== action.payload),
        activeProfileId:
          state.activeProfileId === action.payload
            ? state.profiles.find(p => p.isDefault)?.id || state.profiles[0]?.id || null
            : state.activeProfileId,
      };

    case 'SET_ACTIVE_PROFILE':
      return { ...state, activeProfileId: action.payload, isLocked: false };

    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };

    case 'SET_LOCKED':
      return { ...state, isLocked: action.payload };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'LOAD_STATE':
      return { ...state, ...action.payload, isLoading: false };

    default:
      return state;
  }
}

// ======= Simple PIN hashing =======

function hashPin(pin: string): string {
  // Simple hash for demo - in production use bcrypt or similar
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `pin_${Math.abs(hash).toString(16)}`;
}

function verifyPin(pin: string, hashedPin: string): boolean {
  return hashPin(pin) === hashedPin;
}

// ======= Context =======

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(profileReducer, initialState);

  // Load from storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        dispatch({
          type: 'LOAD_STATE',
          payload: {
            profiles: parsed.profiles || [createDefaultProfile()],
            activeProfileId: parsed.activeProfileId || 'default',
            settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
          },
        });
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      console.error('Failed to load profiles:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Persist to storage on change
  useEffect(() => {
    if (state.isLoading) return;

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          profiles: state.profiles,
          activeProfileId: state.activeProfileId,
          settings: state.settings,
        })
      );
    } catch (error) {
      console.error('Failed to persist profiles:', error);
    }
  }, [state.profiles, state.activeProfileId, state.settings, state.isLoading]);

  // Auto-lock timeout
  useEffect(() => {
    if (!state.settings.autoLockTimeout || state.isLocked) return;

    const timeout = setTimeout(() => {
      const activeProfile = state.profiles.find(p => p.id === state.activeProfileId);
      if (activeProfile?.pin) {
        dispatch({ type: 'SET_LOCKED', payload: true });
      }
    }, state.settings.autoLockTimeout * 60 * 1000);

    return () => clearTimeout(timeout);
  }, [state.settings.autoLockTimeout, state.activeProfileId, state.isLocked, state.profiles]);

  // Profile management
  const createProfile = useCallback(
    (name: string, options: Partial<Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>> = {}): UserProfile => {
      const now = new Date().toISOString();
      const usedColors = state.profiles.map(p => p.color);
      const availableColor = PROFILE_COLORS.find(c => !usedColors.includes(c)) || PROFILE_COLORS[0];

      const profile: UserProfile = {
        id: uuidv4(),
        name,
        color: options.color || availableColor,
        createdAt: now,
        updatedAt: now,
        isDefault: false,
        pin: options.pin ? hashPin(options.pin) : undefined,
        avatar: options.avatar,
        settings: options.settings,
        metadata: {
          measurementCount: 0,
          lastActive: now,
          ...options.metadata,
        },
      };

      dispatch({ type: 'ADD_PROFILE', payload: profile });
      return profile;
    },
    [state.profiles]
  );

  const updateProfile = useCallback((id: string, updates: Partial<UserProfile>) => {
    // Hash PIN if being updated
    if (updates.pin) {
      updates = { ...updates, pin: hashPin(updates.pin) };
    }
    dispatch({ type: 'UPDATE_PROFILE', payload: { id, updates } });
  }, []);

  const deleteProfile = useCallback(
    (id: string): boolean => {
      const profile = state.profiles.find(p => p.id === id);
      if (!profile || profile.isDefault) {
        return false; // Can't delete default profile
      }
      if (state.profiles.length <= 1) {
        return false; // Must have at least one profile
      }
      dispatch({ type: 'DELETE_PROFILE', payload: id });
      return true;
    },
    [state.profiles]
  );

  const getProfile = useCallback(
    (id: string): UserProfile | undefined => {
      return state.profiles.find(p => p.id === id);
    },
    [state.profiles]
  );

  const getActiveProfile = useCallback((): UserProfile | undefined => {
    return state.profiles.find(p => p.id === state.activeProfileId);
  }, [state.profiles, state.activeProfileId]);

  // Profile switching
  const switchProfile = useCallback(
    async (id: string, pin?: string): Promise<boolean> => {
      const profile = state.profiles.find(p => p.id === id);
      if (!profile) return false;

      // Check if PIN is required
      if (state.settings.requirePinForSwitch && profile.pin) {
        if (!pin || !verifyPin(pin, profile.pin)) {
          return false;
        }
      }

      // Update last active on current profile
      if (state.activeProfileId) {
        dispatch({
          type: 'UPDATE_PROFILE',
          payload: {
            id: state.activeProfileId,
            updates: { metadata: { ...getActiveProfile()?.metadata, lastActive: new Date().toISOString() } },
          },
        });
      }

      dispatch({ type: 'SET_ACTIVE_PROFILE', payload: id });
      return true;
    },
    [state.profiles, state.settings.requirePinForSwitch, state.activeProfileId, getActiveProfile]
  );

  const lockProfile = useCallback(() => {
    dispatch({ type: 'SET_LOCKED', payload: true });
  }, []);

  const unlockProfile = useCallback(
    (pin: string): boolean => {
      const activeProfile = getActiveProfile();
      if (!activeProfile?.pin) return true;

      if (verifyPin(pin, activeProfile.pin)) {
        dispatch({ type: 'SET_LOCKED', payload: false });
        return true;
      }
      return false;
    },
    [getActiveProfile]
  );

  // Settings
  const updateSettings = useCallback((settings: Partial<ProfileSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
  }, []);

  // Computed values
  const canCreateProfile = state.profiles.length < Math.min(state.settings.maxProfiles, MAX_PROFILES);
  const profileCount = state.profiles.length;

  const value: ProfileContextValue = {
    ...state,
    createProfile,
    updateProfile,
    deleteProfile,
    getProfile,
    getActiveProfile,
    switchProfile,
    lockProfile,
    unlockProfile,
    updateSettings,
    canCreateProfile,
    profileCount,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfiles() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfiles must be used within a ProfileProvider');
  }
  return context;
}

export default ProfileContext;
