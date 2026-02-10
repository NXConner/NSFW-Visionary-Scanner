/**
 * Achievement Toast
 * Notification toast for unlocked achievements
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  type Achievement,
  getRarityColor,
} from '@/lib/achievements/achievementDefinitions';

export interface AchievementToastProps {
  achievement: Achievement | null;
  isVisible: boolean;
  onDismiss: () => void;
  autoHideDuration?: number;
  className?: string;
}

export function AchievementToast({
  achievement,
  isVisible,
  onDismiss,
  autoHideDuration = 5000,
  className,
}: AchievementToastProps) {
  // Auto-dismiss
  useEffect(() => {
    if (isVisible && autoHideDuration > 0) {
      const timer = setTimeout(onDismiss, autoHideDuration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, autoHideDuration, onDismiss]);

  if (!achievement) return null;

  const Icon = (LucideIcons as Record<string, React.FC<{ size?: number; className?: string }>>)[achievement.icon] || LucideIcons.Award;
  const rarityColor = getRarityColor(achievement.rarity);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={cn(
            'fixed top-4 right-4 z-[100] pointer-events-auto',
            className
          )}
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <div
            className="relative overflow-hidden rounded-lg shadow-2xl"
            style={{
              background: `linear-gradient(135deg, ${rarityColor}15, ${rarityColor}05)`,
              border: `1px solid ${rarityColor}40`,
            }}
          >
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{ duration: 1.5, repeat: 2, repeatDelay: 0.5 }}
            />

            <div className="relative p-4 flex items-start gap-4 min-w-[320px]">
              {/* Badge */}
              <motion.div
                className="relative flex-shrink-0"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${rarityColor}, ${rarityColor}80)`,
                    boxShadow: `0 0 20px ${rarityColor}60`,
                  }}
                >
                  <Icon size={28} className="text-white" />
                </div>
                {/* Sparkles */}
                <motion.div
                  className="absolute -top-1 -right-1"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <LucideIcons.Sparkles size={20} style={{ color: rarityColor }} />
                </motion.div>
              </motion.div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: rarityColor }}>
                    Achievement Unlocked!
                  </div>
                  <div className="font-bold text-lg text-foreground truncate">
                    {achievement.name}
                  </div>
                  <div className="text-sm text-muted-foreground line-clamp-2">
                    {achievement.description}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full capitalize"
                      style={{ backgroundColor: `${rarityColor}20`, color: rarityColor }}
                    >
                      {achievement.rarity}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <LucideIcons.Star size={12} style={{ color: rarityColor }} />
                      <span>+{achievement.points} points</span>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={onDismiss}
              >
                <LucideIcons.X size={14} />
              </Button>
            </div>

            {/* Progress bar */}
            <motion.div
              className="h-1"
              style={{ backgroundColor: rarityColor }}
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: autoHideDuration / 1000, ease: 'linear' }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AchievementToast;
