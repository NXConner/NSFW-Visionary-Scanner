import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useData } from '@/contexts/DataContext';
import { format, subDays, subMonths, isAfter, isBefore, differenceInDays } from 'date-fns';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, 
  ReferenceLine, ReferenceArea, Cell
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Minus, BarChart3, Activity, Target, Ruler, 
  CircleDot, Calendar, GitCompare, Award, Zap, ArrowUpRight, ArrowDownRight,
  Clock, Percent, Scale, ChevronRight
} from 'lucide-react';

type TimeRange = '7d' | '30d' | '90d' | '6m' | '1y' | 'all';
type ChartView = 'trends' | 'comparison' | 'distribution';

interface PeriodData {
  label: string;
  data: any[];
  stats: {
    length: { avg: number; min: number; max: number; change: number };
    circumference: { avg: number; min: number; max: number; change: number };
    curvature: { avg: number; min: number; max: number; change: number };
    count: number;
  };
}

export const ProgressCharts = () => {
  const { scans, diaryEntries } = useData();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [chartType, setChartType] = useState<'line' | 'area'>('area');
  const [chartView, setChartView] = useState<ChartView>('trends');
  const [showComparison, setShowComparison] = useState(false);
  const [showMilestones, setShowMilestones] = useState(true);

  // Get all data combined
  const allData = useMemo(() => {
    return [
      ...scans.map(s => ({
        date: new Date(s.created_at),
        length: s.length,
        circumference: s.circumference,
        curvatureAngle: s.curvature_angle,
        source: 'scan' as const,
      })),
      ...diaryEntries.filter(d => d.length || d.circumference || d.curvature_angle).map(d => ({
        date: new Date(d.entry_date),
        length: d.length,
        circumference: d.circumference,
        curvatureAngle: d.curvature_angle,
        source: 'diary' as const,
      })),
    ].sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [scans, diaryEntries]);

  // Get cutoff dates for current and comparison periods
  const getDateRanges = (range: TimeRange) => {
    const now = new Date();
    let currentStart: Date;
    let previousStart: Date;
    let previousEnd: Date;
    
    switch (range) {
      case '7d': 
        currentStart = subDays(now, 7);
        previousEnd = subDays(now, 7);
        previousStart = subDays(now, 14);
        break;
      case '30d': 
        currentStart = subDays(now, 30);
        previousEnd = subDays(now, 30);
        previousStart = subDays(now, 60);
        break;
      case '90d': 
        currentStart = subMonths(now, 3);
        previousEnd = subMonths(now, 3);
        previousStart = subMonths(now, 6);
        break;
      case '6m':
        currentStart = subMonths(now, 6);
        previousEnd = subMonths(now, 6);
        previousStart = subMonths(now, 12);
        break;
      case '1y':
        currentStart = subMonths(now, 12);
        previousEnd = subMonths(now, 12);
        previousStart = subMonths(now, 24);
        break;
      default: 
        currentStart = new Date(0);
        previousStart = new Date(0);
        previousEnd = new Date(0);
    }
    
    return { now, currentStart, previousStart, previousEnd };
  };

  // Filter and process data
  const { currentPeriod, previousPeriod, filteredData } = useMemo(() => {
    const { now, currentStart, previousStart, previousEnd } = getDateRanges(timeRange);
    
    const processData = (data: typeof allData) => data.map(e => ({
      ...e,
      dateLabel: format(e.date, 'MMM d'),
      fullDate: format(e.date, 'MMM d, yyyy'),
    }));

    const calcStats = (data: typeof allData) => {
      const lengths = data.map(d => d.length).filter(Boolean) as number[];
      const circumferences = data.map(d => d.circumference).filter(Boolean) as number[];
      const angles = data.map(d => d.curvatureAngle).filter(Boolean) as number[];

      const calc = (arr: number[]) => {
        if (arr.length === 0) return { min: 0, max: 0, avg: 0, change: 0, stdDev: 0 };
        const min = Math.min(...arr);
        const max = Math.max(...arr);
        const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
        const change = arr.length > 1 ? arr[arr.length - 1] - arr[0] : 0;
        const variance = arr.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / arr.length;
        const stdDev = Math.sqrt(variance);
        return { min, max, avg: +avg.toFixed(1), change: +change.toFixed(1), stdDev: +stdDev.toFixed(2) };
      };

      return {
        length: calc(lengths),
        circumference: calc(circumferences),
        curvature: calc(angles),
        count: data.length,
      };
    };

    const currentData = allData.filter(e => isAfter(e.date, currentStart));
    const previousData = timeRange !== 'all' 
      ? allData.filter(e => isAfter(e.date, previousStart) && isBefore(e.date, previousEnd))
      : [];

    return {
      currentPeriod: { label: 'Current', data: processData(currentData), stats: calcStats(currentData) },
      previousPeriod: { label: 'Previous', data: processData(previousData), stats: calcStats(previousData) },
      filteredData: processData(currentData),
    };
  }, [allData, timeRange]);

  // Calculate percentage changes between periods
  const periodComparison = useMemo(() => {
    if (!showComparison || previousPeriod.stats.count === 0) return null;
    
    const calcChange = (current: number, previous: number) => {
      if (previous === 0) return 0;
      return +((current - previous) / previous * 100).toFixed(1);
    };

    return {
      length: calcChange(currentPeriod.stats.length.avg, previousPeriod.stats.length.avg),
      circumference: calcChange(currentPeriod.stats.circumference.avg, previousPeriod.stats.circumference.avg),
      curvature: calcChange(currentPeriod.stats.curvature.avg, previousPeriod.stats.curvature.avg),
      entries: currentPeriod.stats.count - previousPeriod.stats.count,
    };
  }, [currentPeriod, previousPeriod, showComparison]);

  // Generate comparison bar data
  const comparisonBarData = useMemo(() => {
    return [
      {
        metric: 'Length',
        current: currentPeriod.stats.length.avg,
        previous: previousPeriod.stats.length.avg,
        unit: 'cm',
      },
      {
        metric: 'Circumference',
        current: currentPeriod.stats.circumference.avg,
        previous: previousPeriod.stats.circumference.avg,
        unit: 'cm',
      },
      {
        metric: 'Curvature',
        current: currentPeriod.stats.curvature.avg,
        previous: previousPeriod.stats.curvature.avg,
        unit: '°',
      },
    ];
  }, [currentPeriod, previousPeriod]);

  // Calculate milestones and achievements
  const milestones = useMemo(() => {
    if (allData.length < 2) return [];
    
    const achievements: { icon: React.ReactNode; label: string; date: string; type: 'positive' | 'neutral' | 'negative' }[] = [];
    
    // First measurement
    if (allData.length > 0) {
      achievements.push({
        icon: <Award className="w-4 h-4" />,
        label: 'First measurement recorded',
        date: format(allData[0].date, 'MMM d, yyyy'),
        type: 'positive',
      });
    }

    // Lowest curvature
    const curvatures = allData.filter(d => d.curvatureAngle).map(d => ({ angle: d.curvatureAngle!, date: d.date }));
    if (curvatures.length > 0) {
      const lowest = curvatures.reduce((min, c) => c.angle < min.angle ? c : min);
      achievements.push({
        icon: <TrendingDown className="w-4 h-4" />,
        label: `Lowest curvature: ${lowest.angle}°`,
        date: format(lowest.date, 'MMM d, yyyy'),
        type: 'positive',
      });
    }

    // Most consistent tracking
    const daysTracked = differenceInDays(allData[allData.length - 1].date, allData[0].date);
    if (daysTracked > 0) {
      const trackingRate = (allData.length / daysTracked * 100).toFixed(0);
      achievements.push({
        icon: <Clock className="w-4 h-4" />,
        label: `${trackingRate}% tracking consistency`,
        date: `${allData.length} entries over ${daysTracked} days`,
        type: parseInt(trackingRate) > 50 ? 'positive' : 'neutral',
      });
    }

    return achievements.slice(0, 4);
  }, [allData]);

  const TrendIndicator = ({ value, inverse = false }: { value: number; inverse?: boolean }) => {
    const isPositive = inverse ? value < 0 : value > 0;
    const isNegative = inverse ? value > 0 : value < 0;
    
    if (isPositive) return <TrendingUp className="w-4 h-4 text-success" />;
    if (isNegative) return <TrendingDown className="w-4 h-4 text-destructive" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const PercentBadge = ({ value, inverse = false }: { value: number; inverse?: boolean }) => {
    const isPositive = inverse ? value < 0 : value > 0;
    const isNegative = inverse ? value > 0 : value < 0;
    
    return (
      <Badge 
        variant="outline" 
        className={`text-[10px] ${
          isPositive ? 'text-success border-success/30 bg-success/10' :
          isNegative ? 'text-destructive border-destructive/30 bg-destructive/10' :
          'text-muted-foreground'
        }`}
      >
        {value > 0 ? '+' : ''}{value}%
      </Badge>
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="glass p-3 rounded-lg border border-border/50 text-sm">
        <p className="font-medium mb-2">{payload[0]?.payload?.fullDate || label}</p>
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium">
              {entry.value}{entry.name === 'Curvature' || entry.dataKey === 'curvatureAngle' ? '°' : ' cm'}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const ComparisonTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const data = payload[0]?.payload;
    return (
      <div className="glass p-3 rounded-lg border border-border/50 text-sm">
        <p className="font-medium mb-2">{data?.metric}</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-muted-foreground">Current:</span>
            <span className="font-medium">{data?.current} {data?.unit}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-muted-foreground" />
            <span className="text-muted-foreground">Previous:</span>
            <span className="font-medium">{data?.previous} {data?.unit}</span>
          </div>
        </div>
      </div>
    );
  };

  if (filteredData.length < 2) {
    return (
      <Card className="glass-card border-border/50">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 rounded-full bg-muted/30 mb-4">
            <BarChart3 className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Not Enough Data</h3>
          <p className="text-muted-foreground text-sm max-w-md">
            You need at least 2 measurements to see progress charts. Keep tracking to visualize your trends!
          </p>
        </CardContent>
      </Card>
    );
  }

  const ChartComponent = chartType === 'area' ? AreaChart : LineChart;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Progress Analysis</h3>
          <Badge variant="outline" className="ml-2">
            {currentPeriod.stats.count} entries
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <SelectTrigger className="w-32 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="6m">Last 6 months</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Tabs value={chartView} onValueChange={(v) => setChartView(v as ChartView)}>
            <TabsList className="h-9">
              <TabsTrigger value="trends" className="text-xs px-3">Trends</TabsTrigger>
              <TabsTrigger value="comparison" className="text-xs px-3">Compare</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Period Comparison Toggle */}
      {timeRange !== 'all' && chartView === 'trends' && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
          <div className="flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Compare with previous period</span>
          </div>
          <Switch checked={showComparison} onCheckedChange={setShowComparison} />
        </div>
      )}

      {/* Period Comparison Stats */}
      {showComparison && periodComparison && chartView === 'trends' && (
        <Card className="glass-card border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <GitCompare className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Period Comparison</span>
              <Badge variant="outline" className="text-[10px]">vs previous {timeRange}</Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Ruler className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Length</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">{currentPeriod.stats.length.avg} cm</span>
                  <PercentBadge value={periodComparison.length} />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CircleDot className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Circumference</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">{currentPeriod.stats.circumference.avg} cm</span>
                  <PercentBadge value={periodComparison.circumference} />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Target className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Curvature</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">{currentPeriod.stats.curvature.avg}°</span>
                  <PercentBadge value={periodComparison.curvature} inverse />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Activity className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Entries</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">{currentPeriod.stats.count}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {periodComparison.entries >= 0 ? '+' : ''}{periodComparison.entries}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <Ruler className="w-4 h-4 text-primary" />
            <TrendIndicator value={currentPeriod.stats.length.change} />
          </div>
          <div className="text-2xl font-bold">{currentPeriod.stats.length.avg} cm</div>
          <div className="text-xs text-muted-foreground">Avg Length</div>
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className={currentPeriod.stats.length.change > 0 ? 'text-success' : currentPeriod.stats.length.change < 0 ? 'text-destructive' : 'text-muted-foreground'}>
              {currentPeriod.stats.length.change > 0 ? '+' : ''}{currentPeriod.stats.length.change} cm
            </span>
            <span className="text-muted-foreground">
              {currentPeriod.stats.length.min}-{currentPeriod.stats.length.max}
            </span>
          </div>
        </Card>
        <Card className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <CircleDot className="w-4 h-4 text-accent" />
            <TrendIndicator value={currentPeriod.stats.circumference.change} />
          </div>
          <div className="text-2xl font-bold">{currentPeriod.stats.circumference.avg} cm</div>
          <div className="text-xs text-muted-foreground">Avg Circumference</div>
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className={currentPeriod.stats.circumference.change > 0 ? 'text-success' : currentPeriod.stats.circumference.change < 0 ? 'text-destructive' : 'text-muted-foreground'}>
              {currentPeriod.stats.circumference.change > 0 ? '+' : ''}{currentPeriod.stats.circumference.change} cm
            </span>
            <span className="text-muted-foreground">
              {currentPeriod.stats.circumference.min}-{currentPeriod.stats.circumference.max}
            </span>
          </div>
        </Card>
        <Card className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-4 h-4 text-warning" />
            <TrendIndicator value={currentPeriod.stats.curvature.change} inverse />
          </div>
          <div className="text-2xl font-bold">{currentPeriod.stats.curvature.avg}°</div>
          <div className="text-xs text-muted-foreground">Avg Curvature</div>
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className={currentPeriod.stats.curvature.change < 0 ? 'text-success' : currentPeriod.stats.curvature.change > 0 ? 'text-destructive' : 'text-muted-foreground'}>
              {currentPeriod.stats.curvature.change > 0 ? '+' : ''}{currentPeriod.stats.curvature.change}°
            </span>
            <span className="text-muted-foreground">
              {currentPeriod.stats.curvature.min}°-{currentPeriod.stats.curvature.max}°
            </span>
          </div>
        </Card>
        <Card className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-4 h-4 text-success" />
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold">{currentPeriod.stats.count}</div>
          <div className="text-xs text-muted-foreground">Total Entries</div>
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>This period</span>
            <span>{previousPeriod.stats.count} prev</span>
          </div>
        </Card>
      </div>

      {/* Milestones */}
      {milestones.length > 0 && showMilestones && (
        <Card className="glass-card border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="w-4 h-4 text-warning" />
                Milestones & Achievements
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs"
                onClick={() => setShowMilestones(false)}
              >
                Hide
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {milestones.map((milestone, i) => (
                <div 
                  key={i}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    milestone.type === 'positive' ? 'bg-success/5 border-success/20' :
                    milestone.type === 'negative' ? 'bg-destructive/5 border-destructive/20' :
                    'bg-muted/30 border-border/50'
                  }`}
                >
                  <div className={`p-2 rounded-full ${
                    milestone.type === 'positive' ? 'bg-success/10 text-success' :
                    milestone.type === 'negative' ? 'bg-destructive/10 text-destructive' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {milestone.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{milestone.label}</p>
                    <p className="text-xs text-muted-foreground">{milestone.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Chart - Trends View */}
      {chartView === 'trends' && (
        <>
          <Card className="glass-card border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Measurement Trends</CardTitle>
                  <CardDescription>Track your progress over time</CardDescription>
                </div>
                <Tabs value={chartType} onValueChange={(v) => setChartType(v as 'line' | 'area')}>
                  <TabsList className="h-8">
                    <TabsTrigger value="area" className="text-xs px-2">Area</TabsTrigger>
                    <TabsTrigger value="line" className="text-xs px-2">Line</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ChartComponent data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="lengthGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="circumGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis 
                      dataKey="dateLabel" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      width={40}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      wrapperStyle={{ paddingTop: 20 }}
                      formatter={(value) => <span className="text-xs">{value}</span>}
                    />
                    {chartType === 'area' ? (
                      <>
                        <Area 
                          type="monotone" 
                          dataKey="length" 
                          name="Length" 
                          stroke="hsl(var(--primary))" 
                          fill="url(#lengthGradient)"
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
                          activeDot={{ r: 5, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="circumference" 
                          name="Circumference" 
                          stroke="hsl(var(--accent))" 
                          fill="url(#circumGradient)"
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--accent))', strokeWidth: 0, r: 3 }}
                          activeDot={{ r: 5, stroke: 'hsl(var(--accent))', strokeWidth: 2 }}
                        />
                      </>
                    ) : (
                      <>
                        <Line 
                          type="monotone" 
                          dataKey="length" 
                          name="Length" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
                          activeDot={{ r: 5, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="circumference" 
                          name="Circumference" 
                          stroke="hsl(var(--accent))" 
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--accent))', strokeWidth: 0, r: 3 }}
                          activeDot={{ r: 5, stroke: 'hsl(var(--accent))', strokeWidth: 2 }}
                        />
                      </>
                    )}
                  </ChartComponent>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Curvature Chart */}
          <Card className="glass-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="w-4 h-4 text-warning" />
                Curvature Progression
              </CardTitle>
              <CardDescription>Monitor curvature angle changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="curvatureGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--warning))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--warning))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis 
                      dataKey="dateLabel" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      width={40}
                      domain={[0, 90]}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceArea y1={0} y2={30} fill="hsl(var(--success))" fillOpacity={0.1} />
                    <ReferenceArea y1={30} y2={60} fill="hsl(var(--warning))" fillOpacity={0.1} />
                    <ReferenceArea y1={60} y2={90} fill="hsl(var(--destructive))" fillOpacity={0.1} />
                    <ReferenceLine y={30} stroke="hsl(var(--success))" strokeDasharray="5 5" />
                    <ReferenceLine y={60} stroke="hsl(var(--destructive))" strokeDasharray="5 5" />
                    <Area 
                      type="monotone" 
                      dataKey="curvatureAngle" 
                      name="Curvature" 
                      stroke="hsl(var(--warning))" 
                      fill="url(#curvatureGradient)"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--warning))', strokeWidth: 0, r: 4 }}
                      activeDot={{ r: 6, stroke: 'hsl(var(--warning))', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-4 mt-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-success/30" />
                  <span>Normal (&lt;30°)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-warning/30" />
                  <span>Moderate (30-60°)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-destructive/30" />
                  <span>Severe (&gt;60°)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Comparison View */}
      {chartView === 'comparison' && (
        <Card className="glass-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-primary" />
              Period Comparison
            </CardTitle>
            <CardDescription>
              Current {timeRange} vs Previous {timeRange}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {previousPeriod.stats.count === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <GitCompare className="w-10 h-10 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No data available for the previous period</p>
              </div>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonBarData} layout="vertical" margin={{ top: 10, right: 30, left: 80, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} horizontal={false} />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis 
                      type="category" 
                      dataKey="metric" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12}
                      width={70}
                    />
                    <Tooltip content={<ComparisonTooltip />} />
                    <Legend 
                      wrapperStyle={{ paddingTop: 20 }}
                      formatter={(value) => <span className="text-xs">{value}</span>}
                    />
                    <Bar dataKey="previous" name="Previous" fill="hsl(var(--muted-foreground))" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="current" name="Current" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
