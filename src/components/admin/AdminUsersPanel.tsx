/**
 * Admin Users Panel
 * User management interface for admins - fetches real data from database
 */

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Ban,
  CheckCircle,
  Crown,
  Edit,
  Eye,
  Filter,
  Loader2,
  Mail,
  MoreHorizontal,
  RefreshCw,
  Search,
  Shield,
  User,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { logger } from "@/lib/logger";

type UserRole = "user" | "premium" | "admin" | "super_admin";

interface UserItem {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: "active" | "suspended";
  joinedAt: string;
  lastActive: string;
  hasPremium: boolean;
}

const getRoleBadge = (role: UserRole) => {
  switch (role) {
    case "super_admin":
      return (
        <Badge className="bg-destructive gap-1">
          <Shield className="w-3 h-3" /> Super Admin
        </Badge>
      );
    case "admin":
      return (
        <Badge className="bg-destructive/80 gap-1">
          <Shield className="w-3 h-3" /> Admin
        </Badge>
      );
    case "premium":
      return (
        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 gap-1">
          <Crown className="w-3 h-3" /> Premium
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="gap-1">
          <User className="w-3 h-3" /> User
        </Badge>
      );
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return (
        <Badge variant="outline" className="gap-1 border-success text-success">
          <CheckCircle className="w-3 h-3" /> Active
        </Badge>
      );
    case "suspended":
      return (
        <Badge variant="outline" className="gap-1 border-destructive text-destructive">
          <Ban className="w-3 h-3" /> Suspended
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="gap-1">
          <UserCheck className="w-3 h-3" /> Pending
        </Badge>
      );
  }
};

export function AdminUsersPanel() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (profilesError) throw profilesError;

      // Fetch user roles
      const { data: roles } = await supabase.from("user_roles").select("user_id, role");

      // Fetch premium subscriptions
      const { data: subscriptions } = await supabase
        .from("user_subscriptions")
        .select("user_id, status, subscription_tier")
        .eq("status", "active");

      const roleMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);
      const premiumSet = new Set(subscriptions?.map(s => s.user_id) || []);

      const mappedUsers: UserItem[] = (profiles || []).map(profile => {
        const dbRole = roleMap.get(profile.user_id);
        let role: UserRole = "user";
        if (dbRole === "super_admin") role = "super_admin";
        else if (dbRole === "admin") role = "admin";
        else if (premiumSet.has(profile.user_id)) role = "premium";

        return {
          id: profile.user_id,
          email: profile.email || "No email",
          name: profile.display_name || profile.email?.split("@")[0] || "User",
          role,
          status: "active" as const,
          joinedAt: profile.created_at
            ? format(new Date(profile.created_at), "MMM d, yyyy")
            : "Unknown",
          lastActive: profile.updated_at
            ? format(new Date(profile.updated_at), "MMM d, yyyy")
            : "Unknown",
          hasPremium: premiumSet.has(profile.user_id),
        };
      });

      setUsers(mappedUsers);
    } catch (err) {
      logger.error("[adminUsers] failed to fetch users", { error: err });
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === "active").length,
    premium: users.filter(u => u.role === "premium" || u.hasPremium).length,
    suspended: users.filter(u => u.status === "suspended").length,
  };

  const filteredUsers = users.filter(user => {
    if (filterRole !== "all" && user.role !== filterRole) return false;
    if (filterStatus !== "all" && user.status !== filterStatus) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!user.email.toLowerCase().includes(query) && !user.name.toLowerCase().includes(query)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-success/10">
                <UserCheck className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-amber-500/10">
                <Crown className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.premium}</p>
                <p className="text-xs text-muted-foreground">Premium</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-destructive/10">
                <UserX className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.suspended}</p>
                <p className="text-xs text-muted-foreground">Suspended</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View and manage all registered users</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-[150px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Mail className="w-4 h-4" />
              Invite User
            </Button>
          </div>

          {/* Users List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {filteredUsers.map(user => (
                  <Card key={user.id} className="hover:bg-muted/30 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-full bg-muted/50">
                          <User className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{user.name}</span>
                            {getRoleBadge(user.role)}
                            {getStatusBadge(user.status)}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Joined {user.joinedAt} • Last active {user.lastActive}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2">
                              <Eye className="w-4 h-4" /> View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <Edit className="w-4 h-4" /> Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <Mail className="w-4 h-4" /> Send Email
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="gap-2">
                              <Crown className="w-4 h-4" /> Change Role
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-destructive">
                              <Ban className="w-4 h-4" /> Suspend User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {filteredUsers.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No users found</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
