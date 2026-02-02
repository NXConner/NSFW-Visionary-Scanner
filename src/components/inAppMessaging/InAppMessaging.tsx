import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MessageSquare, Ticket, Users } from "lucide-react";
import { ConsultationsTab } from "./ConsultationsTab";
import { DirectMessagesTab } from "./DirectMessagesTab";
import { GroupChatsTab } from "./GroupChatsTab";
import { SupportTicketsTab } from "./SupportTicketsTab";
import { useInAppMessaging, type InAppMessagingTab } from "./useInAppMessaging";

export const InAppMessaging = () => {
  const m = useInAppMessaging();

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">In-App Messaging</h1>
        <p className="text-muted-foreground">
          Direct messages, support tickets, consultations, and group chats
        </p>
      </div>

      <Tabs value={m.activeTab} onValueChange={v => m.setActiveTab(v as InAppMessagingTab)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="direct">
            <MessageSquare className="w-4 h-4 mr-2" />
            Direct Messages
          </TabsTrigger>
          <TabsTrigger value="tickets">
            <Ticket className="w-4 h-4 mr-2" />
            Support Tickets
          </TabsTrigger>
          <TabsTrigger value="consultations">
            <Calendar className="w-4 h-4 mr-2" />
            Consultations
          </TabsTrigger>
          <TabsTrigger value="groups">
            <Users className="w-4 h-4 mr-2" />
            Group Chats
          </TabsTrigger>
        </TabsList>

        <TabsContent value="direct" className="mt-4">
          <DirectMessagesTab
            userId={m.user?.id ?? ""}
            loading={m.loading}
            directMessages={m.directMessages as unknown[]}
            selectedConversation={m.selectedConversation}
            setSelectedConversation={m.setSelectedConversation}
            directThread={m.directThread as unknown[]}
            directDraft={m.directDraft}
            setDirectDraft={m.setDirectDraft}
            newDirectRecipientId={m.newDirectRecipientId}
            setNewDirectRecipientId={m.setNewDirectRecipientId}
            showNewDirectMessage={m.showNewDirectMessage}
            setShowNewDirectMessage={m.setShowNewDirectMessage}
            onOpenNew={m.handleOpenNewDirectMessage}
            onStartConversation={m.handleStartConversation}
            onSend={m.handleSendDirectMessage}
            loadDirectThread={m.loadDirectThread}
          />
        </TabsContent>

        <TabsContent value="tickets" className="mt-4">
          <SupportTicketsTab
            loading={m.loading}
            tickets={m.tickets}
            selectedTicket={m.selectedTicket}
            setSelectedTicket={m.setSelectedTicket}
            ticketMessages={m.ticketMessages}
            newMessage={m.newMessage}
            setNewMessage={m.setNewMessage}
            showNewTicketForm={m.showNewTicketForm}
            setShowNewTicketForm={m.setShowNewTicketForm}
            newTicket={m.newTicket}
            setNewTicket={m.setNewTicket}
            onCreateTicket={m.handleCreateTicket}
            onSendMessage={m.handleSendTicketMessage}
          />
        </TabsContent>

        <TabsContent value="consultations" className="mt-4">
          <ConsultationsTab
            loading={m.loading}
            consultations={m.consultations}
            showBookingForm={m.showBookingForm}
            setShowBookingForm={m.setShowBookingForm}
            newConsultation={m.newConsultation}
            setNewConsultation={m.setNewConsultation}
            onBook={m.handleBookConsultation}
          />
        </TabsContent>

        <TabsContent value="groups" className="mt-4">
          <GroupChatsTab
            loading={m.loading}
            groupChats={m.groupChats}
            selectedGroup={m.selectedGroup}
            setSelectedGroup={m.setSelectedGroup}
            groupMessages={m.groupMessages}
            newMessage={m.newMessage}
            setNewMessage={m.setNewMessage}
            onSendMessage={m.handleSendGroupMessage}
            showNewGroupForm={m.showNewGroupForm}
            setShowNewGroupForm={m.setShowNewGroupForm}
            newGroup={m.newGroup}
            setNewGroup={m.setNewGroup}
            onCreateGroup={m.handleCreateGroup}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
