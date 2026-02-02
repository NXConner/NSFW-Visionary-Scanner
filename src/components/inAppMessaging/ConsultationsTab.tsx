import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Mail, MessageSquare, Phone, Plus, Video } from "lucide-react";
import type { ExpertConsultation } from "@/lib/inAppMessaging";
import { StatusBadge } from "./StatusBadge";

export function ConsultationsTab(props: {
  loading: boolean;
  consultations: ExpertConsultation[];
  showBookingForm: boolean;
  setShowBookingForm: (v: boolean) => void;
  newConsultation: {
    expert_id: string;
    consultation_type: ExpertConsultation["consultation_type"];
    topic: string;
    description: string;
    scheduled_at: string;
    duration_minutes: number;
    price: number;
  };
  setNewConsultation: (v: {
    expert_id: string;
    consultation_type: ExpertConsultation["consultation_type"];
    topic: string;
    description: string;
    scheduled_at: string;
    duration_minutes: number;
    price: number;
  }) => void;
  onBook: () => void;
}) {
  const {
    loading,
    consultations,
    showBookingForm,
    setShowBookingForm,
    newConsultation,
    setNewConsultation,
    onBook,
  } = props;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Expert Consultations</CardTitle>
          <Button size="sm" onClick={() => setShowBookingForm(!showBookingForm)}>
            <Plus className="w-4 h-4 mr-2" />
            Book Consultation
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showBookingForm && (
          <div className="mb-6 p-4 border rounded-lg space-y-3">
            <Input
              placeholder="Expert ID"
              value={newConsultation.expert_id}
              onChange={e => setNewConsultation({ ...newConsultation, expert_id: e.target.value })}
            />
            <Input
              placeholder="Topic"
              value={newConsultation.topic}
              onChange={e => setNewConsultation({ ...newConsultation, topic: e.target.value })}
            />
            <Textarea
              placeholder="Description"
              value={newConsultation.description}
              onChange={e =>
                setNewConsultation({ ...newConsultation, description: e.target.value })
              }
              rows={3}
            />
            <label className="sr-only" htmlFor="consult-type">
              Consultation type
            </label>
            <select
              id="consult-type"
              className="w-full p-2 border rounded"
              value={newConsultation.consultation_type}
              onChange={e =>
                setNewConsultation({
                  ...newConsultation,
                  consultation_type: e.target.value as ExpertConsultation["consultation_type"],
                })
              }
            >
              <option value="text_chat">Text Chat</option>
              <option value="voice_call">Voice Call</option>
              <option value="video_call">Video Call</option>
              <option value="email">Email</option>
            </select>
            <Input
              type="datetime-local"
              placeholder="Scheduled At"
              value={newConsultation.scheduled_at}
              onChange={e =>
                setNewConsultation({ ...newConsultation, scheduled_at: e.target.value })
              }
            />
            <Input
              type="number"
              placeholder="Duration (minutes)"
              value={newConsultation.duration_minutes}
              onChange={e =>
                setNewConsultation({
                  ...newConsultation,
                  duration_minutes: parseInt(e.target.value, 10) || 0,
                })
              }
            />
            <Input
              type="number"
              placeholder="Price"
              value={newConsultation.price}
              onChange={e =>
                setNewConsultation({ ...newConsultation, price: parseFloat(e.target.value) || 0 })
              }
            />
            <Button onClick={onBook} className="w-full" disabled={loading}>
              Book Consultation
            </Button>
          </div>
        )}

        <div className="space-y-4">
          {consultations.map(consultation => (
            <Card key={consultation.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold">{consultation.topic}</h4>
                    <p className="text-sm text-muted-foreground">{consultation.description}</p>
                  </div>
                  <StatusBadge status={consultation.status} />
                </div>
                <div className="flex gap-4 mt-4 text-sm flex-wrap">
                  <div className="flex items-center gap-1">
                    {consultation.consultation_type === "video_call" && (
                      <Video className="w-4 h-4" />
                    )}
                    {consultation.consultation_type === "voice_call" && (
                      <Phone className="w-4 h-4" />
                    )}
                    {consultation.consultation_type === "email" && <Mail className="w-4 h-4" />}
                    {consultation.consultation_type === "text_chat" && (
                      <MessageSquare className="w-4 h-4" />
                    )}
                    <span className="capitalize">
                      {consultation.consultation_type.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(consultation.scheduled_at).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="font-semibold">${consultation.price}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
