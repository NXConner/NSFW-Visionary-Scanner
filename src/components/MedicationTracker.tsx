import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { triggerHaptic } from "@/lib/haptics";
import { toast } from "sonner";
import {
  Pill,
  Plus,
  Trash2,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Edit2,
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

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  time: string;
  notes: string;
  active: boolean;
  createdAt: string;
}

interface MedicationLog {
  id: string;
  medicationId: string;
  takenAt: string;
  notes: string;
}

const MEDICATIONS_KEY = "morphoscan_medications";
const MEDICATION_LOGS_KEY = "morphoscan_medication_logs";

export const MedicationTracker = () => {
  const [medications, setMedications] = useState<Medication[]>(() => {
    const saved = localStorage.getItem(MEDICATIONS_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [logs, setLogs] = useState<MedicationLog[]>(() => {
    const saved = localStorage.getItem(MEDICATION_LOGS_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [time, setTime] = useState("09:00");
  const [notes, setNotes] = useState("");

  const saveMedications = (meds: Medication[]) => {
    localStorage.setItem(MEDICATIONS_KEY, JSON.stringify(meds));
    setMedications(meds);
  };

  const saveLogs = (newLogs: MedicationLog[]) => {
    localStorage.setItem(MEDICATION_LOGS_KEY, JSON.stringify(newLogs));
    setLogs(newLogs);
  };

  const resetForm = () => {
    setName("");
    setDosage("");
    setFrequency("daily");
    setTime("09:00");
    setNotes("");
    setEditingMed(null);
  };

  const handleSave = () => {
    if (!name || !dosage) {
      toast.error("Please fill in medication name and dosage");
      triggerHaptic("error");
      return;
    }

    if (editingMed) {
      const updated = medications.map(m =>
        m.id === editingMed.id ? { ...m, name, dosage, frequency, time, notes } : m,
      );
      saveMedications(updated);
      toast.success("Medication updated");
    } else {
      const newMed: Medication = {
        id: crypto.randomUUID(),
        name,
        dosage,
        frequency,
        time,
        notes,
        active: true,
        createdAt: new Date().toISOString(),
      };
      saveMedications([...medications, newMed]);
      toast.success("Medication added");
    }

    triggerHaptic("success");
    resetForm();
    setIsAddOpen(false);
  };

  const handleDelete = (id: string) => {
    saveMedications(medications.filter(m => m.id !== id));
    toast.success("Medication removed");
    triggerHaptic("light");
  };

  const toggleActive = (id: string) => {
    saveMedications(medications.map(m => (m.id === id ? { ...m, active: !m.active } : m)));
    triggerHaptic("selection");
  };

  const logDose = (medicationId: string) => {
    const newLog: MedicationLog = {
      id: crypto.randomUUID(),
      medicationId,
      takenAt: new Date().toISOString(),
      notes: "",
    };
    saveLogs([newLog, ...logs]);
    toast.success("Dose logged!");
    triggerHaptic("success");
  };

  const getTodayLogs = (medicationId: string) => {
    const today = new Date().toDateString();
    return logs.filter(
      l => l.medicationId === medicationId && new Date(l.takenAt).toDateString() === today,
    );
  };

  const openEdit = (med: Medication) => {
    setEditingMed(med);
    setName(med.name);
    setDosage(med.dosage);
    setFrequency(med.frequency);
    setTime(med.time);
    setNotes(med.notes);
    setIsAddOpen(true);
  };

  return (
    <Card variant="glass">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Pill className="w-5 h-5 text-primary" />
          Medication Tracker
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
              Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingMed ? "Edit Medication" : "Add Medication"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Medication Name</Label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g., Pentoxifylline"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Dosage</Label>
                <Input
                  value={dosage}
                  onChange={e => setDosage(e.target.value)}
                  placeholder="e.g., 400mg"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Frequency</Label>
                  <Select value={frequency} onValueChange={setFrequency}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="once">Once daily</SelectItem>
                      <SelectItem value="twice">Twice daily</SelectItem>
                      <SelectItem value="three">Three times daily</SelectItem>
                      <SelectItem value="asneeded">As needed</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Time</Label>
                  <Input
                    type="time"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label>Notes (optional)</Label>
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Take with food, etc."
                  className="mt-1"
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="gradient" className="flex-1" onClick={handleSave}>
                  {editingMed ? "Update" : "Add"} Medication
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
        {medications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Pill className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No medications tracked yet</p>
            <p className="text-sm">Add medications to track your treatment</p>
          </div>
        ) : (
          <div className="space-y-4">
            {medications.map(med => {
              const todayLogs = getTodayLogs(med.id);
              const expectedDoses =
                med.frequency === "twice" ? 2 : med.frequency === "three" ? 3 : 1;
              const completed = todayLogs.length >= expectedDoses;

              return (
                <div
                  key={med.id}
                  className={`p-4 rounded-xl border transition-all ${
                    med.active
                      ? "bg-secondary/50 border-border"
                      : "bg-muted/30 border-muted opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{med.name}</h4>
                        {completed && <CheckCircle2 className="w-4 h-4 text-success" />}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {med.dosage} •{" "}
                        {med.frequency === "once"
                          ? "Once daily"
                          : med.frequency === "twice"
                            ? "Twice daily"
                            : med.frequency === "three"
                              ? "3x daily"
                              : med.frequency === "weekly"
                                ? "Weekly"
                                : "As needed"}
                      </p>
                      {med.notes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">{med.notes}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{med.time}</span>
                        {todayLogs.length > 0 && (
                          <span className="text-primary">
                            • {todayLogs.length}/{expectedDoses} doses today
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={med.active} onCheckedChange={() => toggleActive(med.id)} />
                      <Button variant="ghost" size="icon" onClick={() => openEdit(med)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(med.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {med.active && !completed && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full"
                      onClick={() => logDose(med.id)}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Log Dose
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
