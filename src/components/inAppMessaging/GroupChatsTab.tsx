import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Send } from "lucide-react";
import type { GroupChat, GroupChatMessage } from "@/lib/inAppMessaging";

export function GroupChatsTab(props: {
  loading: boolean;
  groupChats: GroupChat[];
  selectedGroup: GroupChat | null;
  setSelectedGroup: (g: GroupChat) => void;
  groupMessages: GroupChatMessage[];
  newMessage: string;
  setNewMessage: (v: string) => void;
  onSendMessage: () => void;
  showNewGroupForm: boolean;
  setShowNewGroupForm: (v: boolean) => void;
  newGroup: {
    name: string;
    description: string;
    category: GroupChat["category"];
    is_private: boolean;
    is_premium: boolean;
  };
  setNewGroup: (v: {
    name: string;
    description: string;
    category: GroupChat["category"];
    is_private: boolean;
    is_premium: boolean;
  }) => void;
  onCreateGroup: () => void;
}) {
  const {
    loading,
    groupChats,
    selectedGroup,
    setSelectedGroup,
    groupMessages,
    newMessage,
    setNewMessage,
    onSendMessage,
    showNewGroupForm,
    setShowNewGroupForm,
    newGroup,
    setNewGroup,
    onCreateGroup,
  } = props;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Group Chats</CardTitle>
              <Button
                size="sm"
                onClick={() => setShowNewGroupForm(!showNewGroupForm)}
                aria-label="Create new group"
              >
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
                  onChange={e => setNewGroup({ ...newGroup, name: e.target.value })}
                />
                <Textarea
                  placeholder="Description"
                  value={newGroup.description}
                  onChange={e => setNewGroup({ ...newGroup, description: e.target.value })}
                  rows={3}
                />
                <label className="sr-only" htmlFor="group-category">
                  Group category
                </label>
                <select
                  id="group-category"
                  className="w-full p-2 border rounded"
                  value={newGroup.category}
                  onChange={e =>
                    setNewGroup({ ...newGroup, category: e.target.value as GroupChat["category"] })
                  }
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
                    onChange={e => setNewGroup({ ...newGroup, is_private: e.target.checked })}
                    aria-label="Private group"
                  />
                  Private Group
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newGroup.is_premium}
                    onChange={e => setNewGroup({ ...newGroup, is_premium: e.target.checked })}
                    aria-label="Premium group"
                  />
                  Premium Only
                </label>
                <Button onClick={onCreateGroup} className="w-full" disabled={loading}>
                  Create Group
                </Button>
              </div>
            )}

            <div className="space-y-2">
              {groupChats.map(group => (
                <div
                  key={group.id}
                  onClick={() => setSelectedGroup(group)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === "Enter" || e.key === " ") setSelectedGroup(group);
                  }}
                  className={`p-3 border rounded-lg cursor-pointer hover:bg-accent ${
                    selectedGroup?.id === group.id ? "bg-accent" : ""
                  }`}
                >
                  <h4 className="font-semibold text-sm">{group.name}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-1">{group.description}</p>
                  <div className="flex justify-between items-center mt-2">
                    <Badge variant="outline" className="text-xs">
                      {group.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {group.member_count} members
                    </span>
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
                {groupMessages.map(message => (
                  <div key={message.id} className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold">
                        User {message.user_id.slice(0, 8)}
                      </span>
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
                  onChange={e => setNewMessage(e.target.value)}
                  rows={2}
                />
                <Button
                  onClick={onSendMessage}
                  disabled={loading || !newMessage.trim()}
                  aria-label="Send group message"
                >
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
  );
}
