import { useState, useMemo, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useData } from '@/contexts/DataContext';
import { format, differenceInDays, subDays, subMonths, isAfter } from 'date-fns';
import {
  LineChart, Line, AreaChart, Area, ComposedChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ReferenceLine, Brush
} from 'recharts';
import {
  TrendingUp, TrendingDown, Minus, GitCompare, Calendar, Ruler,
  CircleDot, Target, Activity, ArrowRight, Eye, EyeOff, Layers,
  ChevronLeft, ChevronRight, BarChart3, Scale, Award, Sparkles,
  Clock, ArrowUpRight, ArrowDownRight, Zap
} from 'lucide-react';

type TimeRange = '7d' | '30d' | '90d' | '6m' | '1y' | 'all';
type CompareMode = 'side-by-side' | 'overlay' | 'difference';

interface ScanEntry {
  id: string;
  date: Date;
  dateLabel: string;
  fullDate: string;
  length: number | null;
  circumference: number | null;
  curvatureAngle: number | null;
  source: 'scan' | 'diary';
}

const TrendIndicator = memo(({ value, inverse = false }: { value: number; inverse?: boolean }) => {
  const isPositive = inverse ? value < 0 : value > 0;
  const isNegative = inverse ? value > 0 : value < 0;
  
  if (isPositive) return <TrendingUp className="w-4 h-4 text-success" />;
  if (isNegative) return <TrendingDown className="w-4 h-4 text-destructive" />;
  return <Minus className="w-4 h-4 text-muted-foreground" />;
});

TrendIndicator.displayName = 'TrendIndicator';

const StatCard = memo(({ 
  icon: Icon, 
  label, 
  value, 
  unit, 
  change, 
  inverse = false,
  color = 'primary'
}: { 
  icon: any; 
  label: string; 
  value: number; 
  unit: string; 
  change: number; 
  inverse?: boolean;
  color?: 'primary' | 'accent' | 'success';
}) => {
  const colorClasses = {
    primary: 'text-primary bg-primary/10',
    accent: 'text-accent bg-accent/10',
    success: 'text-success bg-success/10',
  };

  return (
    <Card className="glass-card border-border/50 hover:border-primary/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-4 h-4" />
          </div>
          <TrendIndicator value={change} inverse={inverse} />
        </div>
        <div className="text-2xl font-bold">{value.toFixed(1)}{unit}</div>
        <div className="text-xs text-muted-foreground mt-1">{label}</div>
        <div className={`text-xs mt-2 ${change > 0 ? (inverse ? 'text-destructive' : 'text-success') : change < 0 ? (inverse ? 'text-success' : 'text-destructive') : 'text-muted-foreground'}`}>
          {change > 0 ? '+' : ''}{change.toFixed(1)} {unit} from baseline
        </div>
      </CardContent>
    </Card>
  );
});

StatCard.displayName = 'StatCard';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass p-3 rounded-lg border border-border/50 text-sm shadow-xl">
      <p className="font-medium mb-2 text-primary">{payload[0]?.payload?.fullDate || label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium font-mono">
            {entry.value?.toFixed(1)}{entry.dataKey?.includes('curvature') || entry.dataKey?.includes('Angle') ? '°' : ' cm'}
          </span>
        </div>
      ))}
    </div>
  );
};

export const ScanHistoryComparison = memo(() => {
  const { scans, diaryEntries } = useData();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [compareMode, setCompareMode] = useState<CompareMode>('overlay');
  const [selectedScans, setSelectedScans] = useState<string[]>([]);
  const [showLength, setShowLength] = useState(true);
  const [showCircumference, setShowCircumference] = useState(true);
  const [showCurvature, setShowCurvature] = useState(true);

  // Combine and process all data
  const allData = useMemo<ScanEntry[]>(() => {
    const combined = [
      ...scans.map(s => ({
        id: s.id,
        date: new Date(s.created_at),
        dateLabel: format(new Date(s.created_at), 'MMM d'),
        fullDate: format(new Date(s.created_at), 'MMM d, yyyy HH:mm'),
        length: s.length,
        circumference: s.circumference,
        curvatureAngle: s.curvature_angle,
        source: 'scan' as const,
      })),
      ...diaryEntries.filter(d => d.length || d.circumference || d.curvature_angle).map(d => ({
        id: d.id,
        date: new Date(d.entry_date),
        dateLabel: format(new Date(d.entry_date), 'MMM d'),
        fullDate: format(new Date(d.entry_date), 'MMM d, yyyy'),
        length: d.length,
        circumference: d.circumference,
        curvatureAngle: d.curvature_angle,
        source: 'diary' as const,
      })),
    ];
    return combined.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [scans, diaryEntries]);

  // Filter by time range
  const filteredData = useMemo(() => {
    const now = new Date();
    let cutoff: Date;
    
    switch (timeRange) {
      case '7d': cutoff = subDays(now, 7); break;
      case '30d': cutoff = subDays(now, 30); break;
      case '90d': cutoff = subMonths(now, 3); break;
      case '6m': cutoff = subMonths(now, 6); break;
      case '1y': cutoff = subMonths(now, 12); break;
      default: cutoff = new Date(0);
    }
    
    return allData.filter(e => isAfter(e.date, cutoff));
  }, [allData, timeRange]);

  // Calculate statistics
  const stats = useMemo(() => {
    const calc = (arr: (number | null)[]) => {
      const valid = arr.filter((v): v is number => v !== null && v !== undefined);
      if (valid.length === 0) return { min: 0, max: 0, avg: 0, change: 0, first: 0, last: 0 };
      return {
        min: Math.min(...valid),
        max: Math.max(...valid),
        avg: valid.reduce((a, b) => a + b, 0) / valid.length,
        change: valid.length > 1 ? valid[valid.length - 1] - valid[0] : 0,
        first: valid[0],
        last: valid[valid.length - 1],
      };
    };

    return {
      length: calc(filteredData.map(d => d.length)),
      circumference: calc(filteredData.map(d => d.circumference)),
      curvature: calc(filteredData.map(d => d.curvatureAngle)),
      totalEntries: filteredData.length,
      daysCovered: filteredData.length > 1 
        ? differenceInDays(filteredData[filteredData.length - 1].date, filteredData[0].date)
        : 0,
    };
  }, [filteredData]);

  // Calculate rate of change
  const rateOfChange = useMemo(() => {
    if (stats.daysCovered === 0) return { length: 0, circumference: 0, curvature: 0 };
    return {
      length: (stats.length.change / stats.daysCovered) * 30, // per month
      circumference: (stats.circumference.change / stats.daysCovered) * 30,
      curvature: (stats.curvature.change / stats.daysCovered) * 30,
    };
  }, [stats]);

  // Comparison data for selected scans
  const comparisonData = useMemo(() => {
    if (selectedScans.length < 2) return null;
    
    const selected = selectedScans.map(id => filteredData.find(d => d.id === id)).filter(Boolean) as ScanEntry[];
    if (selected.length < 2) return null;
    
    const [first, second] = [selected[0], selected[selected.length - 1]];
    return {
      first,
      second,
      daysBetween: differenceInDays(second.date, first.date),
      lengthDiff: (second.length ?? 0) - (first.length ?? 0),
      circumferenceDiff: (second.circumference ?? 0) - (first.circumference ?? 0),
      curvatureDiff: (second.curvatureAngle ?? 0) - (first.curvatureAngle ?? 0),
    };
  }, [selectedScans, filteredData]);

  if (filteredData.length < 2) {
    return (
      <Card className="glass-card border-border/50">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 rounded-full bg-muted/30 mb-4">
            <GitCompare className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Not Enough Data</h3>
          <p className="text-muted-foreground max-w-md">
            Record at least 2 measurements to see comparison charts and track your progress over time.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <GitCompare className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Scan History Comparison</h3>
            <p className="text-sm text-muted-foreground">
              {stats.totalEntries} entries over {stats.daysCovered} days
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <SelectTrigger className="w-32 h-9">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 days</SelectItem>
              <SelectItem value="30d">30 days</SelectItem>
              <SelectItem value="90d">90 days</SelectItem>
              <SelectItem value="6m">6 months</SelectItem>
              <SelectItem value="1y">1 year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={Ruler} 
          label="Length" 
          value={stats.length.avg} 
          unit=" cm" 
          change={stats.length.change}
          color="primary"
        />
        <StatCard 
          icon={CircleDot} 
          label="Circumference" 
          value={stats.circumference.avg} 
          unit=" cm" 
          change={stats.circumference.change}
          color="accent"
        />
        <StatCard 
          icon={Target} 
          label="Curvature" 
          value={stats.curvature.avg} 
          unit="°" 
          change={stats.curvature.change}
          inverse
          color="success"
        />
        <Card className="glass-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-warning/10 text-warning">
                <Zap className="w-4 h-4" />
              </div>
              <Badge variant="outline" className="text-[10px]">per month</Badge>
            </div>
            <div className="text-2xl font-bold">{rateOfChange.length > 0 ? '+' : ''}{rateOfChange.length.toFixed(2)} cm</div>
            <div className="text-xs text-muted-foreground mt-1">Growth Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Metric Toggles */}
      <div className="flex flex-wrap gap-2">
        <Button 
          variant={showLength ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setShowLength(!showLength)}
          className="gap-2"
        >
          {showLength ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          Length
        </Button>
        <Button 
          variant={showCircumference ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setShowCircumference(!showCircumference)}
          className="gap-2"
        >
          {showCircumference ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          Circumference
        </Button>
        <Button 
          variant={showCurvature ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setShowCurvature(!showCurvature)}
          className="gap-2"
        >
          {showCurvature ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          Curvature
        </Button>
      </div>

      {/* Main Chart */}
      <Card className="glass-card border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Measurement Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={filteredData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
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
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  yAxisId="left"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickFormatter={(v) => `${v}cm`}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickFormatter={(v) => `${v}°`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                
                {showLength && (
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="length"
                    name="Length"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#lengthGradient)"
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                  />
                )}
                {showCircumference && (
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="circumference"
                    name="Circumference"
                    stroke="hsl(var(--accent))"
                    strokeWidth={2}
                    fill="url(#circumGradient)"
                    dot={{ fill: 'hsl(var(--accent))', strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, stroke: 'hsl(var(--accent))', strokeWidth: 2 }}
                  />
                )}
                {showCurvature && (
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="curvatureAngle"
                    name="Curvature"
                    stroke="hsl(var(--success))"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: 'hsl(var(--success))', strokeWidth: 0, r: 3 }}
                  />
                )}
                
                {/* Reference lines for targets */}
                <ReferenceLine 
                  yAxisId="right" 
                  y={0} 
                  stroke="hsl(var(--success))" 
                  strokeDasharray="3 3" 
                  opacity={0.5}
                  label={{ value: 'Target', fill: 'hsl(var(--success))', fontSize: 10 }}
                />
                
                <Brush 
                  dataKey="dateLabel" 
                  height={30} 
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--secondary))"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Individual Entry Comparison */}
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            Individual Scan Comparison
          </CardTitle>
          <CardDescription>
            Select two scans to compare side-by-side
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48 pr-4">
            <div className="space-y-2">
              {filteredData.map((entry, i) => (
                <div
                  key={entry.id}
                  onClick={() => {
                    if (selectedScans.includes(entry.id)) {
                      setSelectedScans(selectedScans.filter(id => id !== entry.id));
                    } else if (selectedScans.length < 2) {
                      setSelectedScans([...selectedScans, entry.id]);
                    } else {
                      setSelectedScans([selectedScans[1], entry.id]);
                    }
                  }}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedScans.includes(entry.id) 
                      ? 'bg-primary/10 border-primary/30' 
                      : 'bg-secondary/30 border-transparent hover:border-border/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-mono ${
                      selectedScans.includes(entry.id) ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{entry.fullDate}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.source === 'scan' ? 'Camera Scan' : 'Manual Entry'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    {entry.length && <span className="text-primary">{entry.length}cm</span>}
                    {entry.curvatureAngle && <span className="text-muted-foreground ml-2">{entry.curvatureAngle}°</span>}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Comparison Result */}
          {comparisonData && (
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="font-semibold">Comparison Results</span>
                <Badge variant="outline" className="text-[10px]">
                  {comparisonData.daysBetween} days apart
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="text-xs text-muted-foreground">FROM</div>
                  <div className="p-3 rounded-lg bg-background/50">
                    <p className="font-medium">{comparisonData.first.fullDate}</p>
                    <div className="mt-2 space-y-1 text-sm">
                      {comparisonData.first.length && <p>Length: {comparisonData.first.length} cm</p>}
                      {comparisonData.first.circumference && <p>Circ: {comparisonData.first.circumference} cm</p>}
                      {comparisonData.first.curvatureAngle && <p>Curvature: {comparisonData.first.curvatureAngle}°</p>}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="text-xs text-muted-foreground">TO</div>
                  <div className="p-3 rounded-lg bg-background/50">
                    <p className="font-medium">{comparisonData.second.fullDate}</p>
                    <div className="mt-2 space-y-1 text-sm">
                      {comparisonData.second.length && <p>Length: {comparisonData.second.length} cm</p>}
                      {comparisonData.second.circumference && <p>Circ: {comparisonData.second.circumference} cm</p>}
                      {comparisonData.second.curvatureAngle && <p>Curvature: {comparisonData.second.curvatureAngle}°</p>}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="text-center p-2 rounded-lg bg-primary/10">
                  <div className={`text-lg font-bold ${comparisonData.lengthDiff > 0 ? 'text-success' : comparisonData.lengthDiff < 0 ? 'text-destructive' : ''}`}>
                    {comparisonData.lengthDiff > 0 ? '+' : ''}{comparisonData.lengthDiff.toFixed(1)} cm
                  </div>
                  <div className="text-[10px] text-muted-foreground">Length Change</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-accent/10">
                  <div className={`text-lg font-bold ${comparisonData.circumferenceDiff > 0 ? 'text-success' : comparisonData.circumferenceDiff < 0 ? 'text-destructive' : ''}`}>
                    {comparisonData.circumferenceDiff > 0 ? '+' : ''}{comparisonData.circumferenceDiff.toFixed(1)} cm
                  </div>
                  <div className="text-[10px] text-muted-foreground">Circ Change</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-success/10">
                  <div className={`text-lg font-bold ${comparisonData.curvatureDiff < 0 ? 'text-success' : comparisonData.curvatureDiff > 0 ? 'text-destructive' : ''}`}>
                    {comparisonData.curvatureDiff > 0 ? '+' : ''}{comparisonData.curvatureDiff.toFixed(1)}°
                  </div>
                  <div className="text-[10px] text-muted-foreground">Curvature Change</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress Milestones */}
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="w-4 h-4 text-warning" />
            Progress Milestones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 text-center">
              <div className="text-3xl font-bold gradient-text">{stats.totalEntries}</div>
              <div className="text-xs text-muted-foreground mt-1">Total Entries</div>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 text-center">
              <div className="text-3xl font-bold text-accent">{stats.daysCovered}</div>
              <div className="text-xs text-muted-foreground mt-1">Days Tracked</div>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-success/10 to-success/5 text-center">
              <div className="text-3xl font-bold text-success">
                {stats.curvature.first > 0 && stats.curvature.last > 0 
                  ? Math.round(((stats.curvature.first - stats.curvature.last) / stats.curvature.first) * 100) 
                  : 0}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">Curvature Reduction</div>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-warning/10 to-warning/5 text-center">
              <div className="text-3xl font-bold text-warning">
                {stats.daysCovered > 0 ? Math.round((stats.totalEntries / stats.daysCovered) * 7) : 0}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Avg per Week</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

ScanHistoryComparison.displayName = 'ScanHistoryComparison';