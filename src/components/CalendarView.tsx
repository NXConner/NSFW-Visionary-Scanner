import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useData, ScanEntry, DiaryEntry } from "@/contexts/DataContext";
import { useSettings } from "@/contexts/SettingsContext";
import { formatLength } from "@/lib/measurementsComparison";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Scan,
  BookOpen,
  Activity,
  Target,
  Ruler,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface DayData {
  scans: ScanEntry[];
  diary: DiaryEntry[];
}

export const CalendarView = () => {
  const { scans, diaryEntries } = useData();
  const { measurementUnits } = useSettings();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDayData, setSelectedDayData] = useState<DayData | null>(null);

  // Build a map of dates to entries
  const dateMap = useMemo(() => {
    const map = new Map<string, DayData>();

    scans.forEach(scan => {
      const dateKey = format(new Date(scan.created_at), "yyyy-MM-dd");
      const existing = map.get(dateKey) || { scans: [], diary: [] };
      existing.scans.push(scan);
      map.set(dateKey, existing);
    });

    diaryEntries.forEach(entry => {
      const dateKey = format(new Date(entry.entry_date), "yyyy-MM-dd");
      const existing = map.get(dateKey) || { scans: [], diary: [] };
      existing.diary.push(entry);
      map.set(dateKey, existing);
    });

    return map;
  }, [scans, diaryEntries]);

  // Get calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const handleDayClick = (date: Date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    const dayData = dateMap.get(dateKey);

    if (dayData && (dayData.scans.length > 0 || dayData.diary.length > 0)) {
      setSelectedDate(date);
      setSelectedDayData(dayData);
    }
  };

  const getDayIndicators = (date: Date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    const dayData = dateMap.get(dateKey);

    if (!dayData) return null;

    return {
      hasScans: dayData.scans.length > 0,
      hasDiary: dayData.diary.length > 0,
      scanCount: dayData.scans.length,
      diaryCount: dayData.diary.length,
    };
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-6">
      <Card className="glass-card border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
              Health Calendar
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <span className="font-semibold min-w-[140px] text-center">
                {format(currentMonth, "MMMM yyyy")}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Week day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const indicators = getDayIndicators(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isCurrentDay = isToday(day);
              const hasEntries = indicators && (indicators.hasScans || indicators.hasDiary);
              const dateKey = format(day, "yyyy-MM-dd");

              return (
                <button
                  key={dateKey}
                  onClick={() => handleDayClick(day)}
                  disabled={!hasEntries}
                  className={`
                    relative aspect-square p-1 rounded-lg transition-all text-sm
                    ${!isCurrentMonth ? "text-muted-foreground/30" : ""}
                    ${isCurrentDay ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}
                    ${hasEntries ? "cursor-pointer hover:bg-secondary/50" : "cursor-default"}
                    ${hasEntries ? "bg-secondary/30" : ""}
                  `}
                >
                  <span
                    className={`
                    ${isCurrentDay ? "font-bold text-primary" : ""}
                    ${hasEntries && !isCurrentDay ? "font-medium" : ""}
                  `}
                  >
                    {format(day, "d")}
                  </span>

                  {/* Entry indicators */}
                  {indicators && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                      {indicators.hasScans && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" title="Scans" />
                      )}
                      {indicators.hasDiary && (
                        <div className="w-1.5 h-1.5 rounded-full bg-accent" title="Diary" />
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border/50 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-muted-foreground">Scans</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <span className="text-muted-foreground">Diary Entries</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded ring-2 ring-primary" />
              <span className="text-muted-foreground">Today</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="glass-card p-4 text-center">
          <Scan className="w-5 h-5 mx-auto mb-2 text-primary" />
          <div className="text-2xl font-bold">{scans.length}</div>
          <div className="text-xs text-muted-foreground">Total Scans</div>
        </Card>
        <Card className="glass-card p-4 text-center">
          <BookOpen className="w-5 h-5 mx-auto mb-2 text-accent" />
          <div className="text-2xl font-bold">{diaryEntries.length}</div>
          <div className="text-xs text-muted-foreground">Diary Entries</div>
        </Card>
        <Card className="glass-card p-4 text-center">
          <CalendarIcon className="w-5 h-5 mx-auto mb-2 text-success" />
          <div className="text-2xl font-bold">{dateMap.size}</div>
          <div className="text-xs text-muted-foreground">Active Days</div>
        </Card>
      </div>

      {/* Day Detail Dialog */}
      <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
              {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}
            </DialogTitle>
          </DialogHeader>

          {selectedDayData && (
            <div className="space-y-4">
              {/* Scans */}
              {selectedDayData.scans.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Scan className="w-4 h-4 text-primary" />
                    Scans ({selectedDayData.scans.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedDayData.scans.map(scan => (
                      <Card key={scan.id} className="p-3 bg-secondary/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {scan.image_data ? (
                              <img
                                src={scan.image_data}
                                alt="Scan"
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Activity className="w-6 h-6 text-primary" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-sm">
                                {scan.scan_type.toUpperCase()} Scan
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(scan.created_at), "h:mm a")}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-sm">
                              <Target className="w-3 h-3 text-warning" />
                              <span className="font-mono">{scan.curvature_angle}°</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Ruler className="w-3 h-3" />
                              {formatLength(scan.length, measurementUnits)} ×{" "}
                              {formatLength(scan.circumference, measurementUnits)}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Diary Entries */}
              {selectedDayData.diary.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-accent" />
                    Diary Entries ({selectedDayData.diary.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedDayData.diary.map(entry => (
                      <Card key={entry.id} className="p-3 bg-secondary/30">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(entry.created_at), "h:mm a")}
                            </p>
                            {entry.pain_level !== null && (
                              <Badge variant="outline" className="text-xs">
                                Pain: {entry.pain_level}/10
                              </Badge>
                            )}
                          </div>
                          {entry.symptoms && entry.symptoms.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {entry.symptoms.map((symptom, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {symptom}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {entry.notes && (
                            <p className="text-sm text-muted-foreground">{entry.notes}</p>
                          )}
                          {(entry.length || entry.circumference || entry.curvature_angle) && (
                            <div className="flex gap-4 text-xs text-muted-foreground pt-2 border-t border-border/50">
                              {entry.length && (
                                <span>Length: {formatLength(entry.length, measurementUnits)}</span>
                              )}
                              {entry.circumference && (
                                <span>
                                  Circ: {formatLength(entry.circumference, measurementUnits)}
                                </span>
                              )}
                              {entry.curvature_angle && (
                                <span>Angle: {entry.curvature_angle}°</span>
                              )}
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
