/**
 * Prediction Card Component
 * Displays health predictions with confidence indicators
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Info,
  Target,
  Calendar,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  type Prediction,
  type HealthInsight,
  type TrendResult,
  getRiskLevelColor,
} from '@/lib/healthPrediction';

export interface PredictionCardProps {
  prediction?: Prediction;
  insight?: HealthInsight;
  trend?: TrendResult;
  title?: string;
  className?: string;
  compact?: boolean;
}

const trendIcons = {
  increasing: TrendingUp,
  decreasing: TrendingDown,
  stable: Minus,
  fluctuating: BarChart3,
};

const trendColors = {
  increasing: '#22C55E',
  decreasing: '#EF4444',
  stable: '#6B7280',
  fluctuating: '#F59E0B',
};

const insightIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  alert: AlertTriangle,
};

const insightColors = {
  info: '#3B82F6',
  success: '#22C55E',
  warning: '#F59E0B',
  alert: '#EF4444',
};

function TrendPredictionCard({ prediction, compact }: { prediction: Prediction; compact?: boolean }) {
  const Icon = prediction.predictedTrend ? trendIcons[prediction.predictedTrend] : Target;
  const color = prediction.predictedTrend ? trendColors[prediction.predictedTrend] : '#6B7280';

  return (
    <Card className={cn('overflow-hidden', compact && 'p-3')}>
      <CardHeader className={cn('pb-2', compact && 'p-0 pb-2')}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Icon className="h-4 w-4" style={{ color }} />
            Trend Prediction
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {prediction.timeframe}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className={cn(compact && 'p-0')}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold capitalize" style={{ color }}>
              {prediction.predictedTrend || 'Unknown'}
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Confidence</div>
                    <div className="font-semibold">{Math.round(prediction.confidence)}%</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Based on {prediction.factors.length} factors</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <Progress value={prediction.confidence} className="h-1" />

          {!compact && prediction.factors.length > 0 && (
            <div className="space-y-1 pt-2 border-t">
              <div className="text-xs text-muted-foreground">Contributing factors:</div>
              {prediction.factors.slice(0, 3).map((factor, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <span
                    className={cn(
                      'w-2 h-2 rounded-full',
                      factor.impact === 'positive' ? 'bg-green-500' :
                      factor.impact === 'negative' ? 'bg-red-500' : 'bg-gray-400'
                    )}
                  />
                  <span className="text-muted-foreground">{factor.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ValuePredictionCard({ prediction, compact }: { prediction: Prediction; compact?: boolean }) {
  return (
    <Card className={cn('overflow-hidden', compact && 'p-3')}>
      <CardHeader className={cn('pb-2', compact && 'p-0 pb-2')}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {prediction.timeframe} Forecast
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {Math.round(prediction.confidence)}% confidence
          </Badge>
        </div>
      </CardHeader>
      <CardContent className={cn(compact && 'p-0')}>
        <div className="space-y-2">
          {prediction.predictedRange && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Expected range:</span>
              <span className="font-semibold">
                {prediction.predictedRange.min.toFixed(1)} - {prediction.predictedRange.max.toFixed(1)}
              </span>
            </div>
          )}
          {prediction.predictedValue !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Predicted value:</span>
              <span className="text-xl font-bold">{prediction.predictedValue.toFixed(2)}</span>
            </div>
          )}
          <Progress value={prediction.confidence} className="h-1" />
        </div>
      </CardContent>
    </Card>
  );
}

function InsightCard({ insight, compact }: { insight: HealthInsight; compact?: boolean }) {
  const Icon = insightIcons[insight.severity];
  const color = insightColors[insight.severity];

  return (
    <Card
      className={cn(
        'overflow-hidden border-l-4',
        compact && 'p-3'
      )}
      style={{ borderLeftColor: color }}
    >
      <CardContent className={cn('pt-4', compact && 'p-0')}>
        <div className="flex items-start gap-3">
          <div
            className="p-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon className="h-4 w-4" style={{ color }} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm">{insight.title}</h4>
            <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
            {insight.suggestedAction && (
              <p className="text-sm text-primary mt-2">
                💡 {insight.suggestedAction}
              </p>
            )}
          </div>
          <Badge variant="secondary" className="text-xs capitalize">
            {insight.category}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function TrendOverviewCard({ trend, compact }: { trend: TrendResult; compact?: boolean }) {
  const Icon = trendIcons[trend.direction];
  const color = trendColors[trend.direction];

  return (
    <Card className={cn('overflow-hidden', compact && 'p-3')}>
      <CardHeader className={cn('pb-2', compact && 'p-0 pb-2')}>
        <CardTitle className="text-sm font-medium">Trend Overview</CardTitle>
      </CardHeader>
      <CardContent className={cn(compact && 'p-0')}>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div
              className="p-3 rounded-full"
              style={{ backgroundColor: `${color}20` }}
            >
              <Icon className="h-6 w-6" style={{ color }} />
            </div>
            <div>
              <div className="text-lg font-bold capitalize" style={{ color }}>
                {trend.direction}
              </div>
              <div className="text-sm text-muted-foreground">
                {trend.strength} trend • {trend.percentChange.toFixed(1)}% change
              </div>
            </div>
          </div>

          {!compact && (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t text-sm">
              <div>
                <div className="text-muted-foreground">Mean</div>
                <div className="font-medium">{trend.meanValue.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Std Dev</div>
                <div className="font-medium">{trend.standardDeviation.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Data Points</div>
                <div className="font-medium">{trend.dataPoints}</div>
              </div>
              <div>
                <div className="text-muted-foreground">R² Score</div>
                <div className="font-medium">{(trend.rSquared * 100).toFixed(0)}%</div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function PredictionCard({
  prediction,
  insight,
  trend,
  title,
  className,
  compact = false,
}: PredictionCardProps) {
  if (prediction) {
    if (prediction.type === 'trend') {
      return <TrendPredictionCard prediction={prediction} compact={compact} />;
    }
    return <ValuePredictionCard prediction={prediction} compact={compact} />;
  }

  if (insight) {
    return <InsightCard insight={insight} compact={compact} />;
  }

  if (trend) {
    return <TrendOverviewCard trend={trend} compact={compact} />;
  }

  return (
    <Card className={cn(className, compact && 'p-3')}>
      <CardContent className={cn('pt-4', compact && 'p-0')}>
        <div className="text-center text-muted-foreground">
          <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No prediction data available</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default PredictionCard;
