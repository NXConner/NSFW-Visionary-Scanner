import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Heart, Droplets, Thermometer } from "lucide-react";

interface HealthMetric {
  id: string;
  label: string;
  value: string;
  unit: string;
  change: number;
  icon: React.ElementType;
  status: 'normal' | 'warning' | 'alert';
}

export const HealthDashboard = () => {
  const metrics: HealthMetric[] = [
    { id: '1', label: 'Heart Rate', value: '72', unit: 'bpm', change: 2, icon: Heart, status: 'normal' },
    { id: '2', label: 'Blood Pressure', value: '120/80', unit: 'mmHg', change: -1, icon: Activity, status: 'normal' },
    { id: '3', label: 'Hydration', value: '68', unit: '%', change: 5, icon: Droplets, status: 'warning' },
    { id: '4', label: 'Body Temp', value: '98.6', unit: '°F', change: 0, icon: Thermometer, status: 'normal' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'text-success';
      case 'warning': return 'text-warning';
      case 'alert': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'normal': return 'bg-success/10';
      case 'warning': return 'bg-warning/10';
      case 'alert': return 'bg-destructive/10';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <Card 
          key={metric.id} 
          variant="interactive" 
          className="animate-fade-in-up"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${getStatusBg(metric.status)} flex items-center justify-center`}>
                <metric.icon className={`w-5 h-5 ${getStatusColor(metric.status)}`} />
              </div>
              <span className={`text-xs font-medium ${metric.change > 0 ? 'text-success' : metric.change < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {metric.change > 0 ? '+' : ''}{metric.change}%
              </span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">{metric.label}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">{metric.value}</span>
                <span className="text-sm text-muted-foreground">{metric.unit}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
