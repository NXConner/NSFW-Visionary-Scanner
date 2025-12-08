import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  createSupportTicket,
  getSupportTickets,
  getSupportTicketMessages,
  sendTicketMessage,
  bookExpertConsultation,
  getExpertConsultations,
  createGroupChat,
  getGroupChats,
  joinGroupChat,
  getGroupChatMessages,
  sendGroupChatMessage,
  getDirectMessages,
  sendDirectMessage,
  type SupportTicket,
  type SupportTicketMessage,
  type ExpertConsultation,
  type GroupChat,
  type GroupChatMessage
} from '@/lib/inAppMessaging'
import { MessageSquare, Plus, Send, Ticket, Users, Calendar, Video, Phone, Mail, Search, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

export const InAppMessaging = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('direct')
  const [loading, setLoading] = useState(false)

  // Direct Messages
  const [directMessages, setDirectMessages] = useState<any[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')

  // Support Tickets
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [ticketMessages, setTicketMessages] = useState<SupportTicketMessage[]>([])
  const [showNewTicketForm, setShowNewTicketForm] = useState(false)
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    category: 'general' as SupportTicket['category'],
    priority: 'medium' as SupportTicket['priority']
  })

  // Expert Consultations
  const [consultations, setConsultations] = useState<ExpertConsultation[]>([])
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [newConsultation, setNewConsultation] = useState({
    expert_id: '',
    consultation_type: 'text_chat' as ExpertConsultation['consultation_type'],
    topic: '',
    description: '',
    scheduled_at: '',
    duration_minutes: 30,
    price: 0
  })

  // Group Chats
  const [groupChats, setGroupChats] = useState<GroupChat[]>([])
  const [selectedGroup, setSelectedGroup] = useState<GroupChat | null>(null)
  const [groupMessages, setGroupMessages] = useState<GroupChatMessage[]>([])
  const [showNewGroupForm, setShowNewGroupForm] = useState(false)
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    category: 'general' as GroupChat['category'],
    is_private: false,
    is_premium: false
  })

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user, activeTab])

  useEffect(() => {
    if (selectedTicket) {
      loadTicketMessages()
    }
  }, [selectedTicket])

  useEffect(() => {
    if (selectedGroup) {
      loadGroupMessages()
    }
  }, [selectedGroup])

  const loadData = async () => {
    setLoading(true)
    try {
      switch (activeTab) {
        case 'direct': {
          const messages = await getDirectMessages()
          setDirectMessages(messages)
          break
        }
        case 'tickets': {
          const ticketsData = await getSupportTickets()
          setTickets(ticketsData)
          break
        }
        case 'consultations': {
          const consultationsData = await getExpertConsultations()
          setConsultations(consultationsData)
          break
        }
        case 'groups': {
          const groupsData = await getGroupChats()
          setGroupChats(groupsData)
          break
        }
      }
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const loadTicketMessages = async () => {
    if (!selectedTicket) return
    setLoading(true)
    try {
      const messages = await getSupportTicketMessages(selectedTicket.id)
      setTicketMessages(messages)
    } catch (error) {
      toast.error('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  const loadGroupMessages = async () => {
    if (!selectedGroup) return
    setLoading(true)
    try {
      const messages = await getGroupChatMessages(selectedGroup.id)
      setGroupMessages(messages)
    } catch (error) {
      toast.error('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTicket = async () => {
    if (!newTicket.subject || !newTicket.description) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const ticket = await createSupportTicket(
        newTicket.subject,
        newTicket.description,
        newTicket.category,
        newTicket.priority
      )
      if (ticket) {
        setTickets([ticket, ...tickets])
        setShowNewTicketForm(false)
        setNewTicket({
          subject: '',
          description: '',
          category: 'general',
          priority: 'medium'
        })
        setSelectedTicket(ticket)
      }
    } catch (error) {
      toast.error('Failed to create ticket')
    } finally {
      setLoading(false)
    }
  }

  const handleSendTicketMessage = async () => {
    if (!selectedTicket || !newMessage.trim()) return

    setLoading(true)
    try {
      const success = await sendTicketMessage(selectedTicket.id, newMessage)
      if (success) {
        setNewMessage('')
        await loadTicketMessages()
      }
    } catch (error) {
      toast.error('Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  const handleBookConsultation = async () => {
    if (!newConsultation.expert_id || !newConsultation.topic || !newConsultation.scheduled_at) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const consultation = await bookExpertConsultation(
        newConsultation.expert_id,
        newConsultation.consultation_type,
        newConsultation.topic,
        newConsultation.scheduled_at,
        newConsultation.duration_minutes,
        newConsultation.price,
        newConsultation.description
      )
      if (consultation) {
        setConsultations([consultation, ...consultations])
        setShowBookingForm(false)
        setNewConsultation({
          expert_id: '',
          consultation_type: 'text_chat',
          topic: '',
          description: '',
          scheduled_at: '',
          duration_minutes: 30,
          price: 0
        })
      }
    } catch (error) {
      toast.error('Failed to book consultation')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGroup = async () => {
    if (!newGroup.name || !newGroup.description) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const group = await createGroupChat(
        newGroup.name,
        newGroup.description,
        newGroup.category,
        newGroup.is_private,
        newGroup.is_premium
      )
      if (group) {
        setGroupChats([group, ...groupChats])
        setShowNewGroupForm(false)
        setNewGroup({
          name: '',
          description: '',
          category: 'general',
          is_private: false,
          is_premium: false
        })
        setSelectedGroup(group)
      }
    } catch (error) {
      toast.error('Failed to create group')
    } finally {
      setLoading(false)
    }
  }

  const handleSendGroupMessage = async () => {
    if (!selectedGroup || !newMessage.trim()) return

    setLoading(true)
    try {
      const success = await sendGroupChatMessage(selectedGroup.id, newMessage)
      if (success) {
        setNewMessage('')
        await loadGroupMessages()
      }
    } catch (error) {
      toast.error('Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', icon: any }> = {
      open: { variant: 'default', icon: AlertCircle },
      in_progress: { variant: 'default', icon: Clock },
      resolved: { variant: 'outline', icon: CheckCircle },
      closed: { variant: 'secondary', icon: XCircle },
      pending: { variant: 'default', icon: Clock },
      confirmed: { variant: 'outline', icon: CheckCircle },
      completed: { variant: 'outline', icon: CheckCircle },
      cancelled: { variant: 'destructive', icon: XCircle }
    }

    const config = variants[status] || { variant: 'default' as const, icon: null }
    const Icon = config.icon

    return (
      <Badge variant={config.variant}>
        {Icon && <Icon className="w-3 h-3 mr-1" />}
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">In-App Messaging</h1>
        <p className="text-muted-foreground">Direct messages, support tickets, consultations, and group chats</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
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

        {/* Direct Messages */}
        <TabsContent value="direct" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Direct Messages</CardTitle>
                <Button size="sm" onClick={() => setActiveTab('direct')}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Message
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Direct messaging feature coming soon. Use Support Tickets for now.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Support Tickets */}
        <TabsContent value="tickets" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Support Tickets</CardTitle>
                    <Button size="sm" onClick={() => setShowNewTicketForm(!showNewTicketForm)}>
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
                        onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                      />
                      <Textarea
                        placeholder="Description"
                        value={newTicket.description}
                        onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                        rows={3}
                      />
                      <select
                        className="w-full p-2 border rounded"
                        value={newTicket.category}
                        onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value as SupportTicket['category'] })}
                      >
                        <option value="general">General</option>
                        <option value="technical">Technical</option>
                        <option value="billing">Billing</option>
                        <option value="feature_request">Feature Request</option>
                        <option value="bug_report">Bug Report</option>
                        <option value="account">Account</option>
                        <option value="premium_support">Premium Support</option>
                      </select>
                      <select
                        className="w-full p-2 border rounded"
                        value={newTicket.priority}
                        onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value as SupportTicket['priority'] })}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                      <Button onClick={handleCreateTicket} className="w-full" disabled={loading}>
                        Create Ticket
                      </Button>
                    </div>
                  )}

                  <div className="space-y-2">
                    {tickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        onClick={() => setSelectedTicket(ticket)}
                        className={`p-3 border rounded-lg cursor-pointer hover:bg-accent ${
                          selectedTicket?.id === ticket.id ? 'bg-accent' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-sm">{ticket.subject}</h4>
                          {getStatusBadge(ticket.status)}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{ticket.description}</p>
                        <div className="flex justify-between items-center mt-2">
                          <Badge variant="outline" className="text-xs">{ticket.category}</Badge>
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
                          {getStatusBadge(selectedTicket.status)}
                          <Badge variant="outline">{selectedTicket.category}</Badge>
                          <Badge variant="outline">{selectedTicket.priority}</Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                      {ticketMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.is_staff ? 'justify-start' : 'justify-end'}`}
                        >
                          <div className={`max-w-[80%] p-3 rounded-lg ${
                            message.is_staff ? 'bg-muted' : 'bg-primary text-primary-foreground'
                          }`}>
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
                        onChange={(e) => setNewMessage(e.target.value)}
                        rows={2}
                      />
                      <Button onClick={handleSendTicketMessage} disabled={loading || !newMessage.trim()}>
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
        </TabsContent>

        {/* Expert Consultations */}
        <TabsContent value="consultations" className="mt-4">
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
                    onChange={(e) => setNewConsultation({ ...newConsultation, expert_id: e.target.value })}
                  />
                  <Input
                    placeholder="Topic"
                    value={newConsultation.topic}
                    onChange={(e) => setNewConsultation({ ...newConsultation, topic: e.target.value })}
                  />
                  <Textarea
                    placeholder="Description"
                    value={newConsultation.description}
                    onChange={(e) => setNewConsultation({ ...newConsultation, description: e.target.value })}
                    rows={3}
                  />
                  <select
                    className="w-full p-2 border rounded"
                    value={newConsultation.consultation_type}
                    onChange={(e) => setNewConsultation({ ...newConsultation, consultation_type: e.target.value as ExpertConsultation['consultation_type'] })}
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
                    onChange={(e) => setNewConsultation({ ...newConsultation, scheduled_at: e.target.value })}
                  />
                  <Input
                    type="number"
                    placeholder="Duration (minutes)"
                    value={newConsultation.duration_minutes}
                    onChange={(e) => setNewConsultation({ ...newConsultation, duration_minutes: parseInt(e.target.value) })}
                  />
                  <Input
                    type="number"
                    placeholder="Price"
                    value={newConsultation.price}
                    onChange={(e) => setNewConsultation({ ...newConsultation, price: parseFloat(e.target.value) })}
                  />
                  <Button onClick={handleBookConsultation} className="w-full" disabled={loading}>
                    Book Consultation
                  </Button>
                </div>
              )}

              <div className="space-y-4">
                {consultations.map((consultation) => (
                  <Card key={consultation.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold">{consultation.topic}</h4>
                          <p className="text-sm text-muted-foreground">{consultation.description}</p>
                        </div>
                        {getStatusBadge(consultation.status)}
                      </div>
                      <div className="flex gap-4 mt-4 text-sm">
                        <div className="flex items-center gap-1">
                          {consultation.consultation_type === 'video_call' && <Video className="w-4 h-4" />}
                          {consultation.consultation_type === 'voice_call' && <Phone className="w-4 h-4" />}
                          {consultation.consultation_type === 'email' && <Mail className="w-4 h-4" />}
                          {consultation.consultation_type === 'text_chat' && <MessageSquare className="w-4 h-4" />}
                          <span className="capitalize">{consultation.consultation_type.replace('_', ' ')}</span>
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
        </TabsContent>

        {/* Group Chats */}
        <TabsContent value="groups" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Group Chats</CardTitle>
                    <Button size="sm" onClick={() => setShowNewGroupForm(!showNewGroupForm)}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {showNewGroupForm && (
                    <div className="mb-4 p-4 border rounded-lg space-y-3">
                      <Input
                        placeholder="Group Name"
                        value={newGroup.name}
                        onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                      />
                      <Textarea
                        placeholder="Description"
                        value={newGroup.description}
                        onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                        rows={3}
                      />
                      <select
                        className="w-full p-2 border rounded"
                        value={newGroup.category}
                        onChange={(e) => setNewGroup({ ...newGroup, category: e.target.value as GroupChat['category'] })}
                      >
                        <option value="general">General</option>
                        <option value="support">Support</option>
                        <option value="health_condition">Health Condition</option>
                        <option value="treatment">Treatment</option>
                        <option value="recovery">Recovery</option>
                        <option value="premium">Premium</option>
                      </select>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newGroup.is_private}
                          onChange={(e) => setNewGroup({ ...newGroup, is_private: e.target.checked })}
                        />
                        Private Group
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newGroup.is_premium}
                          onChange={(e) => setNewGroup({ ...newGroup, is_premium: e.target.checked })}
                        />
                        Premium Only
                      </label>
                      <Button onClick={handleCreateGroup} className="w-full" disabled={loading}>
                        Create Group
                      </Button>
                    </div>
                  )}

                  <div className="space-y-2">
                    {groupChats.map((group) => (
                      <div
                        key={group.id}
                        onClick={() => setSelectedGroup(group)}
                        className={`p-3 border rounded-lg cursor-pointer hover:bg-accent ${
                          selectedGroup?.id === group.id ? 'bg-accent' : ''
                        }`}
                      >
                        <h4 className="font-semibold text-sm">{group.name}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-1">{group.description}</p>
                        <div className="flex justify-between items-center mt-2">
                          <Badge variant="outline" className="text-xs">{group.category}</Badge>
                          <span className="text-xs text-muted-foreground">{group.member_count} members</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              {selectedGroup ? (
                <Card>
                  <CardHeader>
                    <CardTitle>{selectedGroup.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{selectedGroup.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                      {groupMessages.map((message) => (
                        <div key={message.id} className="flex flex-col">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold">User {message.user_id.slice(0, 8)}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(message.created_at).toLocaleString()}
                            </span>
                          </div>
                          <div className="bg-muted p-3 rounded-lg">
                            <p className="text-sm">{message.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        rows={2}
                      />
                      <Button onClick={handleSendGroupMessage} disabled={loading || !newMessage.trim()}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center h-96">
                    <p className="text-muted-foreground">Select a group to view messages</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

