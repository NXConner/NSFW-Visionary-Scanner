/**
 * NotificationCenter
 * UI component for displaying and managing notifications
 */

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  useNotifications,
  type Notification,
  type NotificationType,
} from "@/contexts/NotificationContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell,
  BellOff,
  X,
  Check,
  CheckCheck,
  Trash2,
  Trophy,
  Ruler,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Clock,
  Settings,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export interface NotificationCenterProps {
  className?: string;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  maxHeight?: number;
}

export function NotificationCenter({
  className,
  position = "top-right",
  maxHeight = 400,
}: NotificationCenterProps) {
  const {
    notifications,
    unreadCount,
    isOpen,
    preferences,
    setOpen,
    toggleOpen,
    markAsRead,
    markAllAsRead,
    dismiss,
    dismissAll,
    clearAll,
  } = useNotifications();

  const visibleNotifications = notifications.filter(n => !n.dismissed);

  // Get icon for notification type
  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case "achievement":
        return <Trophy className="w-4 h-4 text-purple-400" />;
      case "measurement":
        return <Ruler className="w-4 h-4 text-blue-400" />;
      case "reminder":
        return <Clock className="w-4 h-4 text-orange-400" />;
      case "system":
        return <Settings className="w-4 h-4 text-gray-400" />;
      default:
        return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  // Get background color for notification type
  const getTypeBgColor = (type: NotificationType, read: boolean) => {
    const opacity = read ? "10" : "20";
    switch (type) {
      case "success":
        return `rgba(34, 197, 94, 0.${opacity})`;
      case "error":
        return `rgba(239, 68, 68, 0.${opacity})`;
      case "warning":
        return `rgba(234, 179, 8, 0.${opacity})`;
      case "achievement":
        return `rgba(168, 85, 247, 0.${opacity})`;
      case "measurement":
        return `rgba(59, 130, 246, 0.${opacity})`;
      default:
        return `rgba(255, 255, 255, 0.0${read ? "5" : "8"})`;
    }
  };

  // Position classes
  const positionClasses = {
    "top-right": "top-0 right-0",
    "top-left": "top-0 left-0",
    "bottom-right": "bottom-0 right-0",
    "bottom-left": "bottom-0 left-0",
  };

  return (
    <div className={cn("relative", className)}>
      {/* Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={toggleOpen}
        aria-label="Notifications"
      >
        {preferences.enabled ? (
          <Bell className="w-5 h-5" />
        ) : (
          <BellOff className="w-5 h-5 text-muted-foreground" />
        )}

        {/* Unread badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1"
            >
              <Badge
                variant="destructive"
                className="h-5 min-w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            </motion.div>
          )}
        </AnimatePresence>
      </Button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={cn(
                "absolute z-50 w-80 sm:w-96 rounded-xl overflow-hidden",
                "bg-background/95 backdrop-blur-xl border shadow-2xl",
                positionClasses[position],
                "mt-2",
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/50">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  <span className="font-semibold">Notifications</span>
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {unreadCount} new
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Actions Bar */}
              {visibleNotifications.length > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/30">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={markAllAsRead}
                    disabled={unreadCount === 0}
                  >
                    <CheckCheck className="w-3 h-3 mr-1" />
                    Mark all read
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={dismissAll}>
                    <Trash2 className="w-3 h-3 mr-1" />
                    Dismiss all
                  </Button>
                </div>
              )}

              {/* Notifications List */}
              <ScrollArea style={{ maxHeight }}>
                {visibleNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Bell className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-sm">No notifications</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {visibleNotifications.map(notification => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        icon={getIcon(notification.type)}
                        bgColor={getTypeBgColor(notification.type, notification.read)}
                        onMarkRead={() => markAsRead(notification.id)}
                        onDismiss={() => dismiss(notification.id)}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Footer */}
              {visibleNotifications.length > 5 && (
                <div className="px-4 py-2 border-t bg-muted/30 text-center">
                  <Button
                    variant="link"
                    size="sm"
                    className="text-xs text-muted-foreground"
                    onClick={clearAll}
                  >
                    Clear all notifications
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Individual notification item
function NotificationItem({
  notification,
  icon,
  bgColor,
  onMarkRead,
  onDismiss,
}: {
  notification: Notification;
  icon: React.ReactNode;
  bgColor: string;
  onMarkRead: () => void;
  onDismiss: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn(
        "relative px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer group",
        !notification.read && "border-l-2 border-l-primary",
      )}
      style={{ backgroundColor: bgColor }}
      onClick={onMarkRead}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">{icon}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p
              className={cn("text-sm font-medium truncate", !notification.read && "font-semibold")}
            >
              {notification.title}
            </p>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {notification.message}
          </p>

          {/* Action button */}
          {notification.action && (
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 mt-1 text-xs"
              onClick={e => {
                e.stopPropagation();
                notification.action?.onClick();
              }}
            >
              {notification.action.label}
            </Button>
          )}
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!notification.read && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={e => {
                e.stopPropagation();
                onMarkRead();
              }}
              title="Mark as read"
            >
              <Check className="w-3 h-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={e => {
              e.stopPropagation();
              onDismiss();
            }}
            title="Dismiss"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Unread indicator */}
      {!notification.read && (
        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
      )}
    </motion.div>
  );
}

export default NotificationCenter;
