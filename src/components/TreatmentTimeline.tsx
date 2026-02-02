import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { triggerHaptic } from "@/lib/haptics";
import { toast } from "sonner";
import {
  Calendar,
  Plus,
  Trash2,
  Stethoscope,
  Pill,
  Syringe,
  Activity,
  FileText,
  CheckCircle2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

interface TimelineEvent {
  id: string;
  date: string;
  type: "diagnosis" | "medication" | "injection" | "therapy" | "checkup" | "surgery" | "milestone";
  title: string;
  description: string;
  createdAt: string;
}

const TIMELINE_KEY = "morphoscan_treatment_timeline";

const eventTypes = [
  { value: "diagnosis", label: "Diagnosis", icon: FileText, color: "text-warning" },
  { value: "medication", label: "Medication Started", icon: Pill, color: "text-primary" },
  { value: "injection", label: "Injection", icon: Syringe, color: "text-accent" },
  { value: "therapy", label: "Therapy", icon: Activity, color: "text-success" },
  { value: "checkup", label: "Doctor Visit", icon: Stethoscope, color: "text-primary" },
  { value: "surgery", label: "Surgery", icon: Activity, color: "text-destructive" },
  { value: "milestone", label: "Milestone", icon: CheckCircle2, color: "text-success" },
];

export const TreatmentTimeline = () => {
  const [events, setEvents] = useState<TimelineEvent[]>(() => {
    const saved = localStorage.getItem(TIMELINE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [type, setType] = useState<TimelineEvent["type"]>("checkup");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const saveEvents = (newEvents: TimelineEvent[]) => {
    const sorted = newEvents.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    localStorage.setItem(TIMELINE_KEY, JSON.stringify(sorted));
    setEvents(sorted);
  };

  const resetForm = () => {
    setDate(format(new Date(), "yyyy-MM-dd"));
    setType("checkup");
    setTitle("");
    setDescription("");
  };

  const handleSave = () => {
    if (!title) {
      toast.error("Please enter an event title");
      triggerHaptic("error");
      return;
    }

    const newEvent: TimelineEvent = {
      id: crypto.randomUUID(),
      date,
      type,
      title,
      description,
      createdAt: new Date().toISOString(),
    };

    saveEvents([...events, newEvent]);
    toast.success("Event added to timeline");
    triggerHaptic("success");
    resetForm();
    setIsAddOpen(false);
  };

  const handleDelete = (id: string) => {
    saveEvents(events.filter(e => e.id !== id));
    toast.success("Event removed");
    triggerHaptic("light");
  };

  const getEventType = (type: string) => {
    return eventTypes.find(t => t.value === type) || eventTypes[0];
  };

  return (
    <Card variant="glass">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Treatment Timeline
        </CardTitle>
        <Dialog
          open={isAddOpen}
          onOpenChange={open => {
            setIsAddOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Timeline Event</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Event Type</Label>
                  <Select value={type} onValueChange={(v: TimelineEvent["type"]) => setType(v)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypes.map(et => (
                        <SelectItem key={et.value} value={et.value}>
                          <span className="flex items-center gap-2">
                            <et.icon className={`w-4 h-4 ${et.color}`} />
                            {et.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Title</Label>
                <Input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g., Started Pentoxifylline"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Description (optional)</Label>
                <Textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Add details about this event..."
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="gradient" className="flex-1" onClick={handleSave}>
                  Add Event
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No events in your timeline</p>
            <p className="text-sm">Track your treatment journey</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

            <div className="space-y-6">
              {events.map((event, index) => {
                const eventType = getEventType(event.type);
                const Icon = eventType.icon;

                return (
                  <div key={event.id} className="relative flex gap-4">
                    {/* Icon */}
                    <div
                      className={`relative z-10 w-12 h-12 rounded-full bg-card border-2 border-border flex items-center justify-center ${eventType.color}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-6">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(event.date), "MMMM d, yyyy")}
                          </p>
                          <h4 className="font-semibold">{event.title}</h4>
                          <span className={`text-xs ${eventType.color}`}>{eventType.label}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(event.id)}
                          className="opacity-50 hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                      {event.description && (
                        <p className="text-sm text-muted-foreground mt-2">{event.description}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
