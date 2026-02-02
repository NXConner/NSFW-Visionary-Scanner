import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, Plus } from "lucide-react";
import type { SupportTicket, SupportTicketMessage } from "@/lib/inAppMessaging";
import { StatusBadge } from "./StatusBadge";

export function SupportTicketsTab(props: {
  loading: boolean;
  tickets: SupportTicket[];
  selectedTicket: SupportTicket | null;
  setSelectedTicket: (t: SupportTicket) => void;
  ticketMessages: SupportTicketMessage[];
  newMessage: string;
  setNewMessage: (v: string) => void;
  showNewTicketForm: boolean;
  setShowNewTicketForm: (v: boolean) => void;
  newTicket: {
    subject: string;
    description: string;
    category: SupportTicket["category"];
    priority: SupportTicket["priority"];
  };
  setNewTicket: (v: {
    subject: string;
    description: string;
    category: SupportTicket["category"];
    priority: SupportTicket["priority"];
  }) => void;
  onCreateTicket: () => void;
  onSendMessage: () => void;
}) {
  const {
    loading,
    tickets,
    selectedTicket,
    setSelectedTicket,
    ticketMessages,
    newMessage,
    setNewMessage,
    showNewTicketForm,
    setShowNewTicketForm,
    newTicket,
    setNewTicket,
    onCreateTicket,
    onSendMessage,
  } = props;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Support Tickets</CardTitle>
              <Button
                size="sm"
                onClick={() => setShowNewTicketForm(!showNewTicketForm)}
                aria-label="Create new ticket"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showNewTicketForm && (
              <div className="mb-4 p-4 border rounded-lg space-y-3">
                <Input
                  placeholder="Subject"
                  value={newTicket.subject}
                  onChange={e => setNewTicket({ ...newTicket, subject: e.target.value })}
                />
                <Textarea
                  placeholder="Description"
                  value={newTicket.description}
                  onChange={e => setNewTicket({ ...newTicket, description: e.target.value })}
                  rows={3}
                />
                <label className="sr-only" htmlFor="ticket-category">
                  Ticket category
                </label>
                <select
                  id="ticket-category"
                  className="w-full p-2 border rounded"
                  value={newTicket.category}
                  onChange={e =>
                    setNewTicket({
                      ...newTicket,
                      category: e.target.value as SupportTicket["category"],
                    })
                  }
                >
                  <option value="general">General</option>
                  <option value="technical">Technical</option>
                  <option value="billing">Billing</option>
                  <option value="feature_request">Feature Request</option>
                  <option value="bug_report">Bug Report</option>
                  <option value="account">Account</option>
                  <option value="premium_support">Premium Support</option>
                </select>

                <label className="sr-only" htmlFor="ticket-priority">
                  Ticket priority
                </label>
                <select
                  id="ticket-priority"
                  className="w-full p-2 border rounded"
                  value={newTicket.priority}
                  onChange={e =>
                    setNewTicket({
                      ...newTicket,
                      priority: e.target.value as SupportTicket["priority"],
                    })
                  }
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>

                <Button onClick={onCreateTicket} className="w-full" disabled={loading}>
                  Create Ticket
                </Button>
              </div>
            )}

            <div className="space-y-2">
              {tickets.map(ticket => (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === "Enter" || e.key === " ") setSelectedTicket(ticket);
                  }}
                  className={`p-3 border rounded-lg cursor-pointer hover:bg-accent ${
                    selectedTicket?.id === ticket.id ? "bg-accent" : ""
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-sm">{ticket.subject}</h4>
                    <StatusBadge status={ticket.status} />
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{ticket.description}</p>
                  <div className="flex justify-between items-center mt-2">
                    <Badge variant="outline" className="text-xs">
                      {ticket.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        {selectedTicket ? (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>{selectedTicket.subject}</CardTitle>
                  <div className="flex gap-2 mt-2">
                    <StatusBadge status={selectedTicket.status} />
                    <Badge variant="outline">{selectedTicket.category}</Badge>
                    <Badge variant="outline">{selectedTicket.priority}</Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                {ticketMessages.map(message => (
                  <div
                    key={message.id}
                    className={`flex ${message.is_staff ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${message.is_staff ? "bg-muted" : "bg-primary text-primary-foreground"}`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <span className="text-xs opacity-70 mt-1 block">
                        {new Date(message.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  rows={2}
                />
                <Button
                  onClick={onSendMessage}
                  disabled={loading || !newMessage.trim()}
                  aria-label="Send ticket message"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center h-96">
              <p className="text-muted-foreground">Select a ticket to view messages</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
