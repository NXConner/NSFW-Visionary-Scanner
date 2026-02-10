/**
 * NotificationContext
 * Global notification management context
 */

import * as React from 'react';
import { createContext, useContext, useCallback, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

// ======= Types =======

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'achievement' | 'measurement' | 'reminder' | 'system';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  timestamp: string;
  read: boolean;
  dismissed: boolean;
  persistent: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  metadata?: Record<string, unknown>;
  expiresAt?: string;
  category?: string;
  icon?: string;
}

export interface NotificationPrefs {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  typeSettings: Record<NotificationType, boolean>;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPrefs;
  isOpen: boolean;
}

type NotificationAction =
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'MARK_READ'; payload: string }
  | { type: 'MARK_ALL_READ' }
  | { type: 'DISMISS'; payload: string }
  | { type: 'DISMISS_ALL' }
  | { type: 'CLEAR_ALL' }
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<NotificationPrefs> }
  | { type: 'SET_OPEN'; payload: boolean }
  | { type: 'LOAD_STATE'; payload: Partial<NotificationState> };

interface NotificationContextValue extends NotificationState {
  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read' | 'dismissed'> & Partial<Pick<Notification, 'id' | 'timestamp' | 'read' | 'dismissed'>>) => string;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
  clearAll: () => void;
  updatePreferences: (prefs: Partial<NotificationPrefs>) => void;
  setOpen: (open: boolean) => void;
  toggleOpen: () => void;
  
  // Helpers
  notify: (title: string, message: string, type?: NotificationType) => string;
  notifySuccess: (title: string, message: string) => string;
  notifyError: (title: string, message: string) => string;
  notifyWarning: (title: string, message: string) => string;
  notifyAchievement: (title: string, message: string, metadata?: Record<string, unknown>) => string;
  notifyMeasurement: (title: string, message: string, metadata?: Record<string, unknown>) => string;
}

// ======= Default Values =======

const DEFAULT_PREFERENCES: NotificationPrefs = {
  enabled: true,
  sound: true,
  vibration: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  typeSettings: {
    info: true,
    success: true,
    warning: true,
    error: true,
    achievement: true,
    measurement: true,
    reminder: true,
    system: true,
  },
};

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  preferences: DEFAULT_PREFERENCES,
  isOpen: false,
};

const STORAGE_KEY = 'morphoscan_notifications';

// ======= Reducer =======

function notificationReducer(state: NotificationState, action: NotificationAction): NotificationState {
  switch (action.type) {
    case 'ADD_NOTIFICATION': {
      const notifications = [action.payload, ...state.notifications].slice(0, 100); // Keep max 100
      return {
        ...state,
        notifications,
        unreadCount: notifications.filter(n => !n.read && !n.dismissed).length,
      };
    }

    case 'REMOVE_NOTIFICATION': {
      const notifications = state.notifications.filter(n => n.id !== action.payload);
      return {
        ...state,
        notifications,
        unreadCount: notifications.filter(n => !n.read && !n.dismissed).length,
      };
    }

    case 'MARK_READ': {
      const notifications = state.notifications.map(n =>
        n.id === action.payload ? { ...n, read: true } : n
      );
      return {
        ...state,
        notifications,
        unreadCount: notifications.filter(n => !n.read && !n.dismissed).length,
      };
    }

    case 'MARK_ALL_READ': {
      const notifications = state.notifications.map(n => ({ ...n, read: true }));
      return {
        ...state,
        notifications,
        unreadCount: 0,
      };
    }

    case 'DISMISS': {
      const notifications = state.notifications.map(n =>
        n.id === action.payload ? { ...n, dismissed: true } : n
      );
      return {
        ...state,
        notifications,
        unreadCount: notifications.filter(n => !n.read && !n.dismissed).length,
      };
    }

    case 'DISMISS_ALL': {
      const notifications = state.notifications.map(n =>
        n.persistent ? n : { ...n, dismissed: true }
      );
      return {
        ...state,
        notifications,
        unreadCount: notifications.filter(n => !n.read && !n.dismissed).length,
      };
    }

    case 'CLEAR_ALL':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.persistent),
        unreadCount: 0,
      };

    case 'UPDATE_PREFERENCES':
      return {
        ...state,
        preferences: { ...state.preferences, ...action.payload },
      };

    case 'SET_OPEN':
      return { ...state, isOpen: action.payload };

    case 'LOAD_STATE':
      return { ...state, ...action.payload };

    default:
      return state;
  }
}

// ======= Context =======

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  // Load from storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        dispatch({
          type: 'LOAD_STATE',
          payload: {
            notifications: parsed.notifications || [],
            preferences: { ...DEFAULT_PREFERENCES, ...parsed.preferences },
          },
        });
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }, []);

  // Persist to storage on change
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          notifications: state.notifications,
          preferences: state.preferences,
        })
      );
    } catch (error) {
      console.error('Failed to persist notifications:', error);
    }
  }, [state.notifications, state.preferences]);

  // Clean up expired notifications
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      state.notifications.forEach(n => {
        if (n.expiresAt && new Date(n.expiresAt) < now) {
          dispatch({ type: 'REMOVE_NOTIFICATION', payload: n.id });
        }
      });
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [state.notifications]);

  // Check if in quiet hours
  const isQuietHours = useCallback((): boolean => {
    if (!state.preferences.quietHoursEnabled) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const { quietHoursStart, quietHoursEnd } = state.preferences;

    if (quietHoursStart <= quietHoursEnd) {
      return currentTime >= quietHoursStart && currentTime < quietHoursEnd;
    } else {
      // Overnight quiet hours (e.g., 22:00 - 08:00)
      return currentTime >= quietHoursStart || currentTime < quietHoursEnd;
    }
  }, [state.preferences]);

  // Play notification sound
  const playSound = useCallback(() => {
    if (state.preferences.sound && !isQuietHours()) {
      // Use Web Audio API for notification sound
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.1;
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
      } catch (error) {
        // Audio not supported or blocked
      }
    }
  }, [state.preferences.sound, isQuietHours]);

  // Vibrate
  const vibrate = useCallback(() => {
    if (state.preferences.vibration && !isQuietHours() && navigator.vibrate) {
      navigator.vibrate(100);
    }
  }, [state.preferences.vibration, isQuietHours]);

  // Actions
  const addNotification = useCallback(
    (notification: Omit<Notification, 'id' | 'timestamp' | 'read' | 'dismissed'> & Partial<Pick<Notification, 'id' | 'timestamp' | 'read' | 'dismissed'>>): string => {
      if (!state.preferences.enabled) return '';
      if (!state.preferences.typeSettings[notification.type]) return '';
      if (isQuietHours() && notification.priority !== 'urgent') return '';

      const id = notification.id || uuidv4();
      const fullNotification: Notification = {
        ...notification,
        id,
        timestamp: notification.timestamp || new Date().toISOString(),
        read: notification.read ?? false,
        dismissed: notification.dismissed ?? false,
        persistent: notification.persistent ?? false,
      };

      dispatch({ type: 'ADD_NOTIFICATION', payload: fullNotification });

      if (!fullNotification.read) {
        playSound();
        vibrate();
      }

      return id;
    },
    [state.preferences, isQuietHours, playSound, vibrate]
  );

  const removeNotification = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  }, []);

  const markAsRead = useCallback((id: string) => {
    dispatch({ type: 'MARK_READ', payload: id });
  }, []);

  const markAllAsRead = useCallback(() => {
    dispatch({ type: 'MARK_ALL_READ' });
  }, []);

  const dismiss = useCallback((id: string) => {
    dispatch({ type: 'DISMISS', payload: id });
  }, []);

  const dismissAll = useCallback(() => {
    dispatch({ type: 'DISMISS_ALL' });
  }, []);

  const clearAll = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' });
  }, []);

  const updatePreferences = useCallback((prefs: Partial<NotificationPrefs>) => {
    dispatch({ type: 'UPDATE_PREFERENCES', payload: prefs });
  }, []);

  const setOpen = useCallback((open: boolean) => {
    dispatch({ type: 'SET_OPEN', payload: open });
  }, []);

  const toggleOpen = useCallback(() => {
    dispatch({ type: 'SET_OPEN', payload: !state.isOpen });
  }, [state.isOpen]);

  // Helper methods
  const notify = useCallback(
    (title: string, message: string, type: NotificationType = 'info') => {
      return addNotification({ type, title, message, priority: 'normal' });
    },
    [addNotification]
  );

  const notifySuccess = useCallback(
    (title: string, message: string) => addNotification({ type: 'success', title, message, priority: 'normal' }),
    [addNotification]
  );

  const notifyError = useCallback(
    (title: string, message: string) => addNotification({ type: 'error', title, message, priority: 'high' }),
    [addNotification]
  );

  const notifyWarning = useCallback(
    (title: string, message: string) => addNotification({ type: 'warning', title, message, priority: 'normal' }),
    [addNotification]
  );

  const notifyAchievement = useCallback(
    (title: string, message: string, metadata?: Record<string, unknown>) =>
      addNotification({ type: 'achievement', title, message, priority: 'high', metadata }),
    [addNotification]
  );

  const notifyMeasurement = useCallback(
    (title: string, message: string, metadata?: Record<string, unknown>) =>
      addNotification({ type: 'measurement', title, message, priority: 'normal', metadata }),
    [addNotification]
  );

  const value: NotificationContextValue = {
    ...state,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    dismiss,
    dismissAll,
    clearAll,
    updatePreferences,
    setOpen,
    toggleOpen,
    notify,
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyAchievement,
    notifyMeasurement,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

export default NotificationContext;
