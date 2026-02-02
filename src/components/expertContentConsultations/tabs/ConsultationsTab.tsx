import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Calendar } from "lucide-react";
import {
  bookConsultation,
  getMyConsultations,
  type ConsultationBooking,
  type ExpertProfile,
} from "@/lib/expertContentConsultations";
import type { BookingType } from "../types";

type BookingState = {
  consultationType: BookingType;
  scheduledAt: string;
  durationMinutes: number;
  topic: string;
};

export function ConsultationsTab({
  isActive,
  expert,
}: {
  isActive: boolean;
  expert: ExpertProfile | null;
}): JSX.Element {
  const [loading, setLoading] = useState(false);
  const [myConsultations, setMyConsultations] = useState<ConsultationBooking[]>([]);
  const [bookingData, setBookingData] = useState<BookingState>({
    consultationType: "live_video",
    scheduledAt: "",
    durationMinutes: 60,
    topic: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const consultationsData = await getMyConsultations();
      setMyConsultations(consultationsData);
    } catch {
      toast.error("Failed to load consultations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isActive) return;
    void load();
  }, [isActive, load]);

  const canBook = useMemo(
    () => Boolean(expert && bookingData.scheduledAt && bookingData.topic.trim()),
    [bookingData, expert],
  );

  const handleBookConsultation = useCallback(async () => {
    if (!expert) {
      toast.error("Please select an expert first");
      return;
    }
    if (!canBook) {
      toast.error("Please select date/time and enter a topic");
      return;
    }

    setLoading(true);
    try {
      const result = await bookConsultation(expert.id, {
        consultationType: bookingData.consultationType,
        scheduledAt: bookingData.scheduledAt,
        durationMinutes: bookingData.durationMinutes,
        topic: bookingData.topic,
      });
      if (result) {
        toast.success("Consultation booked!");
        setBookingData(d => ({ ...d, scheduledAt: "", topic: "" }));
        await load();
      }
    } finally {
      setLoading(false);
    }
  }, [bookingData, canBook, expert, load]);

  return (
    <div className="space-y-4">
      {expert && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Book Consultation with {expert.display_name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Consultation Type</Label>
                <Select
                  value={bookingData.consultationType}
                  onValueChange={(v: BookingType) =>
                    setBookingData(d => ({ ...d, consultationType: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="live_video">Video Call</SelectItem>
                    <SelectItem value="live_audio">Audio Call</SelectItem>
                    <SelectItem value="chat">Chat</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="consultation-datetime">Scheduled Date &amp; Time</Label>
                <Input
                  id="consultation-datetime"
                  type="datetime-local"
                  value={bookingData.scheduledAt}
                  onChange={e => setBookingData(d => ({ ...d, scheduledAt: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Duration (minutes)</Label>
                <Select
                  value={String(bookingData.durationMinutes)}
                  onValueChange={v =>
                    setBookingData(d => ({ ...d, durationMinutes: parseInt(v, 10) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                    <SelectItem value="90">90 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="consultation-topic">Topic</Label>
                <Input
                  id="consultation-topic"
                  placeholder="What would you like to discuss?"
                  value={bookingData.topic}
                  onChange={e => setBookingData(d => ({ ...d, topic: e.target.value }))}
                />
              </div>
            </div>

            <Button onClick={handleBookConsultation} disabled={!canBook || loading}>
              <Calendar className="mr-2 h-4 w-4" />
              Book Consultation
            </Button>
          </CardContent>
        </Card>
      )}

      <div>
        <h3 className="font-semibold mb-4">My Consultations</h3>
        {loading && myConsultations.length === 0 ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : myConsultations.length === 0 ? (
          <p className="text-muted-foreground text-sm">No consultations booked yet</p>
        ) : (
          <div className="grid gap-4">
            {myConsultations.map(consultation => (
              <Card key={consultation.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{consultation.consultation_type}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(consultation.scheduled_at).toLocaleString()}
                      </p>
                    </div>
                    <Badge
                      variant={
                        consultation.status === "completed"
                          ? "default"
                          : consultation.status === "confirmed"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {consultation.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
