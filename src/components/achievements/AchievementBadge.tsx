/**
 * Achievement Badge Component
 * Displays an achievement badge with rarity styling
 */

import React from "react";
import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type Achievement,
  type AchievementRarity,
  getRarityColor,
} from "@/lib/achievements/achievementDefinitions";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface AchievementBadgeProps {
  achievement: Achievement;
  unlocked: boolean;
  unlockedAt?: string;
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
  showProgress?: boolean;
  progress?: { current: number; target: number; percentage: number };
  onClick?: () => void;
  className?: string;
}

const sizeClasses = {
  sm: "w-10 h-10",
  md: "w-14 h-14",
  lg: "w-20 h-20",
};

const iconSizes = {
  sm: 16,
  md: 24,
  lg: 32,
};

const rarityGlow: Record<AchievementRarity, string> = {
  common: "shadow-gray-400/50",
  uncommon: "shadow-green-500/50",
  rare: "shadow-blue-500/50",
  epic: "shadow-purple-500/50",
  legendary: "shadow-yellow-500/50",
};

export function AchievementBadge({
  achievement,
  unlocked,
  unlockedAt,
  size = "md",
  showTooltip = true,
  showProgress = false,
  progress,
  onClick,
  className,
}: AchievementBadgeProps) {
  const Icon =
    (LucideIcons as Record<string, React.FC<{ size?: number; className?: string }>>)[
      achievement.icon
    ] || LucideIcons.Award;
  const rarityColor = getRarityColor(achievement.rarity);

  const badge = (
    <motion.div
      className={cn(
        "relative rounded-full flex items-center justify-center cursor-pointer transition-all",
        sizeClasses[size],
        unlocked
          ? `bg-gradient-to-br from-white/20 to-transparent shadow-lg ${rarityGlow[achievement.rarity]}`
          : "bg-muted/50 grayscale opacity-50",
        onClick && "hover:scale-110",
        className,
      )}
      style={{
        borderColor: unlocked ? rarityColor : undefined,
        borderWidth: unlocked ? 2 : 1,
      }}
      onClick={onClick}
      whileHover={onClick ? { scale: 1.1 } : undefined}
      whileTap={onClick ? { scale: 0.95 } : undefined}
      initial={unlocked ? { scale: 0 } : undefined}
      animate={unlocked ? { scale: 1 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
    >
      {/* Background glow for unlocked */}
      {unlocked && (
        <div
          className="absolute inset-0 rounded-full blur-md opacity-30"
          style={{ backgroundColor: rarityColor }}
        />
      )}

      {/* Icon */}
      <Icon
        size={iconSizes[size]}
        className={cn("relative z-10", unlocked ? "text-white" : "text-muted-foreground")}
        style={{ color: unlocked ? rarityColor : undefined }}
      />

      {/* Rarity indicator */}
      {unlocked && (
        <div
          className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background"
          style={{ backgroundColor: rarityColor }}
        />
      )}

      {/* Progress ring */}
      {showProgress && progress && !unlocked && (
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-muted/30"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={rarityColor}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${progress.percentage * 2.83} ${283 - progress.percentage * 2.83}`}
          />
        </svg>
      )}

      {/* Secret badge overlay */}
      {achievement.secret && !unlocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
          <LucideIcons.HelpCircle size={iconSizes[size] * 0.6} className="text-muted-foreground" />
        </div>
      )}
    </motion.div>
  );

  if (!showTooltip) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent className="max-w-xs p-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">
                {achievement.secret && !unlocked ? "???" : achievement.name}
              </span>
              <span
                className="text-xs px-1.5 py-0.5 rounded-full capitalize"
                style={{ backgroundColor: `${rarityColor}20`, color: rarityColor }}
              >
                {achievement.rarity}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {achievement.secret && !unlocked
                ? "This is a secret achievement"
                : achievement.description}
            </p>
            {unlocked && unlockedAt && (
              <p className="text-xs text-muted-foreground">
                Unlocked {new Date(unlockedAt).toLocaleDateString()}
              </p>
            )}
            {!unlocked && progress && (
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span>Progress</span>
                  <span>
                    {progress.current} / {progress.target}
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${progress.percentage}%`, backgroundColor: rarityColor }}
                  />
                </div>
              </div>
            )}
            <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
              <LucideIcons.Star size={12} />
              <span>{achievement.points} points</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default AchievementBadge;
