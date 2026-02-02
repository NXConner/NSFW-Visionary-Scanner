import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  bookExpertConsultation,
  createGroupChat,
  createSupportTicket,
  getDirectConversationMessages,
  getDirectMessages,
  getExpertConsultations,
  getGroupChatMessages,
  getGroupChats,
  markDirectMessagesRead,
  sendDirectMessage,
  getSupportTicketMessages,
  getSupportTickets,
  sendGroupChatMessage,
  sendTicketMessage,
  type ExpertConsultation,
  type GroupChat,
  type GroupChatMessage,
  type SupportTicket,
  type SupportTicketMessage,
} from "@/lib/inAppMessaging";

export type InAppMessagingTab = "direct" | "tickets" | "consultations" | "groups";

export function useInAppMessaging() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<InAppMessagingTab>("direct");
  const [loading, setLoading] = useState(false);

  const [directMessages, setDirectMessages] = useState<unknown[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [directThread, setDirectThread] = useState<unknown[]>([]);
  const [directDraft, setDirectDraft] = useState("");
  const [newDirectRecipientId, setNewDirectRecipientId] = useState("");
  const [showNewDirectMessage, setShowNewDirectMessage] = useState(false);

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketMessages, setTicketMessages] = useState<SupportTicketMessage[]>([]);
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: "",
    description: "",
    category: "general" as SupportTicket["category"],
    priority: "medium" as SupportTicket["priority"],
  });

  const [consultations, setConsultations] = useState<ExpertConsultation[]>([]);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [newConsultation, setNewConsultation] = useState({
    expert_id: "",
    consultation_type: "text_chat" as ExpertConsultation["consultation_type"],
    topic: "",
    description: "",
    scheduled_at: "",
    duration_minutes: 30,
    price: 0,
  });

  const [groupChats, setGroupChats] = useState<GroupChat[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<GroupChat | null>(null);
  const [groupMessages, setGroupMessages] = useState<GroupChatMessage[]>([]);
  const [showNewGroupForm, setShowNewGroupForm] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    category: "general" as GroupChat["category"],
    is_private: false,
    is_premium: false,
  });

  const [newMessage, setNewMessage] = useState("");

  const isAuthed = useMemo(() => Boolean(user?.id), [user?.id]);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      switch (activeTab) {
        case "direct": {
          const messages = await getDirectMessages();
          setDirectMessages(messages as unknown[]);
          break;
        }
        case "tickets": {
          const ticketsData = await getSupportTickets();
          setTickets(ticketsData);
          break;
        }
        case "consultations": {
          const consultationsData = await getExpertConsultations();
          setConsultations(consultationsData);
          break;
        }
        case "groups": {
          const groupsData = await getGroupChats();
          setGroupChats(groupsData);
          break;
        }
      }
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [activeTab, user]);

  const loadDirectThread = useCallback(async (otherUserId: string) => {
    setLoading(true);
    try {
      const msgs = await getDirectConversationMessages(otherUserId, 200);
      setDirectThread(msgs as unknown[]);
      try {
        await markDirectMessagesRead(otherUserId);
      } catch {
        // ignore
      }
    } catch {
      toast.error("Failed to load conversation");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTicketMessages = useCallback(async (ticketId: string) => {
    setLoading(true);
    try {
      const msgs = await getSupportTicketMessages(ticketId, 200);
      setTicketMessages(msgs);
    } catch {
      toast.error("Failed to load ticket messages");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadGroupMessages = useCallback(async (groupId: string) => {
    setLoading(true);
    try {
      const msgs = await getGroupChatMessages(groupId, 200);
      setGroupMessages(msgs);
    } catch {
      toast.error("Failed to load group messages");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthed) return;
    void loadData();
  }, [isAuthed, loadData]);

  useEffect(() => {
    if (!isAuthed || !selectedConversation) return;
    void loadDirectThread(selectedConversation);
  }, [isAuthed, loadDirectThread, selectedConversation]);

  useEffect(() => {
    const tid = selectedTicket?.id ?? null;
    if (!isAuthed || !tid) return;
    void loadTicketMessages(tid);
  }, [isAuthed, loadTicketMessages, selectedTicket?.id]);

  useEffect(() => {
    const gid = selectedGroup?.id ?? null;
    if (!isAuthed || !gid) return;
    void loadGroupMessages(gid);
  }, [isAuthed, loadGroupMessages, selectedGroup?.id]);

  const handleOpenNewDirectMessage = () => {
    setNewDirectRecipientId("");
    setDirectDraft("");
    setShowNewDirectMessage(true);
  };

  const handleStartConversation = async () => {
    const rid = newDirectRecipientId.trim();
    if (!rid) {
      toast.error("Enter recipient contact code");
      return;
    }
    setShowNewDirectMessage(false);
    setSelectedConversation(rid);
    await loadDirectThread(rid);
  };

  const handleSendDirectMessage = async () => {
    if (!selectedConversation) return;
    const content = directDraft.trim();
    if (!content) return;
    setLoading(true);
    try {
      const ok = await sendDirectMessage(selectedConversation, content);
      if (ok) {
        setDirectDraft("");
        await loadDirectThread(selectedConversation);
        await loadData();
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to send message";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!newTicket.subject || !newTicket.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const ticket = await createSupportTicket(
        newTicket.subject,
        newTicket.description,
        newTicket.category,
        newTicket.priority,
      );
      if (ticket) {
        setTickets(prev => [ticket, ...prev]);
        setShowNewTicketForm(false);
        setNewTicket({ subject: "", description: "", category: "general", priority: "medium" });
        setSelectedTicket(ticket);
      }
    } catch {
      toast.error("Failed to create ticket");
    } finally {
      setLoading(false);
    }
  };

  const handleSendTicketMessage = async () => {
    if (!selectedTicket || !newMessage.trim()) return;
    setLoading(true);
    try {
      const success = await sendTicketMessage(selectedTicket.id, newMessage);
      if (success) {
        setNewMessage("");
        await loadTicketMessages(selectedTicket.id);
      }
    } catch {
      toast.error("Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const handleBookConsultation = async () => {
    if (!newConsultation.expert_id || !newConsultation.topic || !newConsultation.scheduled_at) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const consultation = await bookExpertConsultation(
        newConsultation.expert_id,
        newConsultation.consultation_type,
        newConsultation.topic,
        newConsultation.scheduled_at,
        newConsultation.duration_minutes,
        newConsultation.price,
        newConsultation.description,
      );
      if (consultation) {
        setConsultations(prev => [consultation, ...prev]);
        setShowBookingForm(false);
        setNewConsultation({
          expert_id: "",
          consultation_type: "text_chat",
          topic: "",
          description: "",
          scheduled_at: "",
          duration_minutes: 30,
          price: 0,
        });
      }
    } catch {
      toast.error("Failed to book consultation");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroup.name || !newGroup.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const group = await createGroupChat(
        newGroup.name,
        newGroup.description,
        newGroup.category,
        newGroup.is_private,
        newGroup.is_premium,
      );
      if (group) {
        setGroupChats(prev => [group, ...prev]);
        setShowNewGroupForm(false);
        setNewGroup({
          name: "",
          description: "",
          category: "general",
          is_private: false,
          is_premium: false,
        });
        setSelectedGroup(group);
      }
    } catch {
      toast.error("Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  const handleSendGroupMessage = async () => {
    if (!selectedGroup || !newMessage.trim()) return;
    setLoading(true);
    try {
      const success = await sendGroupChatMessage(selectedGroup.id, newMessage);
      if (success) {
        setNewMessage("");
        await loadGroupMessages(selectedGroup.id);
      }
    } catch {
      toast.error("Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    isAuthed,
    activeTab,
    setActiveTab,
    loading,

    directMessages,
    selectedConversation,
    setSelectedConversation,
    directThread,
    directDraft,
    setDirectDraft,
    newDirectRecipientId,
    setNewDirectRecipientId,
    showNewDirectMessage,
    setShowNewDirectMessage,
    loadDirectThread,
    handleOpenNewDirectMessage,
    handleStartConversation,
    handleSendDirectMessage,

    tickets,
    selectedTicket,
    setSelectedTicket,
    ticketMessages,
    showNewTicketForm,
    setShowNewTicketForm,
    newTicket,
    setNewTicket,
    handleCreateTicket,
    handleSendTicketMessage,

    consultations,
    showBookingForm,
    setShowBookingForm,
    newConsultation,
    setNewConsultation,
    handleBookConsultation,

    groupChats,
    selectedGroup,
    setSelectedGroup,
    groupMessages,
    showNewGroupForm,
    setShowNewGroupForm,
    newGroup,
    setNewGroup,
    handleCreateGroup,
    handleSendGroupMessage,

    newMessage,
    setNewMessage,
  };
}
