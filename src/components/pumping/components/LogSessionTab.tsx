import React, { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { triggerHaptic } from "@/lib/haptics";
import { toast } from "sonner";
import { CircleDot, Clock, Gauge, Plus, Ruler, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { formatLength, formatPressureFromInHg } from "@/lib/measurementsComparison";
import { useSettings } from "@/contexts/SettingsContext";

import type { PumpingSession, PumpingStats } from "@/components/pumping/types";

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const safeParseFloat = (raw: string): number | null => {
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : null;
};

const calcStats = (sessions: PumpingSession[]): PumpingStats | null => {
  if (sessions.length === 0) return null;
  const avgLengthGain =
    sessions.reduce((acc, s) => acc + (s.lengthAfter - s.lengthBefore), 0) / sessions.length;
  const avgGirthGain =
    sessions.reduce((acc, s) => acc + (s.girthAfter - s.girthBefore), 0) / sessions.length;
  const totalTime = sessions.reduce((acc, s) => acc + s.duration, 0);
  return { avgLengthGain, avgGirthGain, totalSessions: sessions.length, totalTime };
};

export function LogSessionTab({
  sessions,
  onAddSession,
  onDeleteSession,
}: {
  sessions: PumpingSession[];
  onAddSession: (session: PumpingSession) => void;
  onDeleteSession: (id: string) => void;
}) {
  const { measurementUnits, pressureUnits } = useSettings();
  // Form state
  const [duration, setDuration] = useState(15);
  const [pressure, setPressure] = useState(3);
  const [lengthBefore, setLengthBefore] = useState("");
  const [lengthAfter, setLengthAfter] = useState("");
  const [girthBefore, setGirthBefore] = useState("");
  const [girthAfter, setGirthAfter] = useState("");
  const [notes, setNotes] = useState("");

  const stats = useMemo(() => calcStats(sessions), [sessions]);

  const handleSave = () => {
    const lb = safeParseFloat(lengthBefore);
    const la = safeParseFloat(lengthAfter);
    const gb = safeParseFloat(girthBefore);
    const ga = safeParseFloat(girthAfter);

    if (lb === null || la === null || gb === null || ga === null) {
      toast.error("Please fill in all measurements");
      triggerHaptic("error");
      return;
    }

    const newSession: PumpingSession = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      duration: clamp(duration, 5, 30),
      pressure: clamp(pressure, 1, 10),
      lengthBefore: lb,
      lengthAfter: la,
      girthBefore: gb,
      girthAfter: ga,
      notes,
    };

    onAddSession(newSession);
    toast.success("Session logged successfully!");
    triggerHaptic("success");

    setLengthBefore("");
    setLengthAfter("");
    setGirthBefore("");
    setGirthAfter("");
    setNotes("");
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Session Form */}
      <Card variant="glass" className="animate-fade-in-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Log New Session
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Duration Slider */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Duration
              </Label>
              <span className="text-primary font-mono">{duration} min</span>
            </div>
            <Slider
              value={[duration]}
              onValueChange={([v]) => setDuration(v)}
              min={5}
              max={30}
              step={5}
            />
          </div>

          {/* Pressure Slider */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <Label className="flex items-center gap-2">
                <Gauge className="w-4 h-4" />
                Pressure
              </Label>
              <span className="text-primary font-mono">
                {formatPressureFromInHg(pressure, pressureUnits)}
              </span>
            </div>
            <Slider
              value={[pressure]}
              onValueChange={([v]) => setPressure(v)}
              min={1}
              max={10}
              step={0.5}
            />
          </div>

          {/* Measurements */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Ruler className="w-4 h-4" />
                Length Before (cm / in)
              </Label>
              <Input
                type="number"
                step="0.1"
                value={lengthBefore}
                onChange={e => setLengthBefore(e.target.value)}
                placeholder="0.0"
              />
              {Number.isFinite(Number(lengthBefore)) && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatLength(Number(lengthBefore), measurementUnits)}
                </p>
              )}
            </div>
            <div>
              <Label className="mb-2 block">Length After (cm / in)</Label>
              <Input
                type="number"
                step="0.1"
                value={lengthAfter}
                onChange={e => setLengthAfter(e.target.value)}
                placeholder="0.0"
              />
              {Number.isFinite(Number(lengthAfter)) && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatLength(Number(lengthAfter), measurementUnits)}
                </p>
              )}
            </div>
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <CircleDot className="w-4 h-4" />
                Girth Before (cm / in)
              </Label>
              <Input
                type="number"
                step="0.1"
                value={girthBefore}
                onChange={e => setGirthBefore(e.target.value)}
                placeholder="0.0"
              />
              {Number.isFinite(Number(girthBefore)) && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatLength(Number(girthBefore), measurementUnits)}
                </p>
              )}
            </div>
            <div>
              <Label className="mb-2 block">Girth After (cm / in)</Label>
              <Input
                type="number"
                step="0.1"
                value={girthAfter}
                onChange={e => setGirthAfter(e.target.value)}
                placeholder="0.0"
              />
              {Number.isFinite(Number(girthAfter)) && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatLength(Number(girthAfter), measurementUnits)}
                </p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label className="mb-2 block">Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="How did the session feel? Any observations..."
              rows={3}
            />
          </div>

          <Button variant="gradient" className="w-full" onClick={handleSave}>
            Save Session
          </Button>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="space-y-6">
        {stats && (
          <div className="grid grid-cols-2 gap-4 animate-fade-in-up">
            <Card variant="glass" className="p-4">
              <div className="text-center">
                <p className="text-muted-foreground text-sm">Avg Length Gain</p>
                <p className="text-2xl font-bold gradient-text">
                  +{formatLength(stats.avgLengthGain, measurementUnits)}
                </p>
              </div>
            </Card>
            <Card variant="glass" className="p-4">
              <div className="text-center">
                <p className="text-muted-foreground text-sm">Avg Girth Gain</p>
                <p className="text-2xl font-bold gradient-text">
                  +{formatLength(stats.avgGirthGain, measurementUnits)}
                </p>
              </div>
            </Card>
            <Card variant="glass" className="p-4">
              <div className="text-center">
                <p className="text-muted-foreground text-sm">Total Sessions</p>
                <p className="text-2xl font-bold">{stats.totalSessions}</p>
              </div>
            </Card>
            <Card variant="glass" className="p-4">
              <div className="text-center">
                <p className="text-muted-foreground text-sm">Total Time</p>
                <p className="text-2xl font-bold">{stats.totalTime} min</p>
              </div>
            </Card>
          </div>
        )}

        {/* Recent Sessions */}
        <Card variant="glass" className="animate-fade-in-up">
          <CardHeader>
            <CardTitle>Recent Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No sessions logged yet. Start tracking!
              </p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {sessions.slice(0, 10).map(session => (
                  <div
                    key={session.id}
                    className="p-3 rounded-lg bg-secondary/50 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">{format(new Date(session.date), "MMM d, yyyy")}</p>
                      <p className="text-sm text-muted-foreground">
                        {session.duration}min @{" "}
                        {formatPressureFromInHg(session.pressure, pressureUnits)}
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <div>
                        <p className="text-sm text-success">
                          +
                          {formatLength(
                            session.lengthAfter - session.lengthBefore,
                            measurementUnits,
                          )}
                        </p>
                        <p className="text-sm text-primary">
                          +
                          {formatLength(session.girthAfter - session.girthBefore, measurementUnits)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteSession(session.id)}
                        aria-label="Delete session"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
