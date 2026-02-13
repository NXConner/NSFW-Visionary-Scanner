/**
 * Admin Email Management Panel
 *
 * Displays real email send events from Supabase (`email_send_events`).
 * Also allows administrators to request verification emails (Supabase Auth),
 * and preview email templates.
 */

import { useMemo, useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  Filter,
  Loader2,
  Mail,
  MailCheck,
  MailX,
  RefreshCw,
  Search,
  Send,
  Settings,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { EmailService, emailConfig } from "@/lib/email";
import { fromExtended } from "@/lib/supabaseExtensions";

type EmailStatus = "queued" | "sent" | "failed";

type EmailSendEventRow = {
  id: string;
  campaign_id: string | null;
  user_id: string | null;
  to_email: string;
  subject: string | null;
  provider: string | null;
  provider_message_id: string | null;
  status: EmailStatus;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
  email_campaigns?: { name: string | null; subject: string | null } | null;
};

type TemplateType =
  | "verification"
  | "password_reset"
  | "welcome"
  | "notification"
  | "partner_invite";

const getTypeBadge = (type: TemplateType) => {
  switch (type) {
    case "verification":
      return (
        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 gap-1">
          <Mail className="w-3 h-3" /> Verification
        </Badge>
      );
    case "password_reset":
      return (
        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 gap-1">
          <Mail className="w-3 h-3" /> Password Reset
        </Badge>
      );
    case "welcome":
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 gap-1">
          <MailCheck className="w-3 h-3" /> Welcome
        </Badge>
      );
    case "notification":
      return (
        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 gap-1">
          <Mail className="w-3 h-3" /> Notification
        </Badge>
      );
    case "partner_invite":
      return (
        <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/30 gap-1">
          <Mail className="w-3 h-3" /> Partner Invite
        </Badge>
      );
    default:
      return <Badge variant="secondary">{type}</Badge>;
  }
};

const getStatusBadge = (status: EmailStatus) => {
  switch (status) {
    case "queued":
      return (
        <Badge variant="outline" className="gap-1 border-amber-500 text-amber-500">
          <Clock className="w-3 h-3" /> Queued
        </Badge>
      );
    case "sent":
      return (
        <Badge variant="outline" className="gap-1 border-green-500 text-green-500">
          <CheckCircle className="w-3 h-3" /> Sent
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="outline" className="gap-1 border-red-500 text-red-500">
          <XCircle className="w-3 h-3" /> Failed
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

function formatMaybeDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, "MMM d, yyyy h:mm a");
}

export function EmailManagement(): JSX.Element {
  const [events, setEvents] = useState<EmailSendEventRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<EmailStatus | "all">("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [resendTargetEmail, setResendTargetEmail] = useState("");
  const [resending, setResending] = useState(false);

  // Load email log
  const loadEmailLog = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await fromExtended("email_send_events")
        .select(
          "id,campaign_id,user_id,to_email,subject,provider,provider_message_id,status,error_message,sent_at,created_at,email_campaigns(name,subject)",
        )
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      setEvents((data ?? []) as unknown as EmailSendEventRow[]);
    } catch (error) {
      toast.error("Failed to load email log");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEmailLog();
    // Refresh every 30 seconds
    const interval = setInterval(() => void loadEmailLog(), 30000);
    return () => clearInterval(interval);
  }, [loadEmailLog]);

  // Filter emails
  const filteredEmails = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return events.filter(ev => {
      const subj = String(ev.subject || ev.email_campaigns?.subject || "").trim();
      const provider = String(ev.provider || "").trim();
      const msgId = String(ev.provider_message_id || "").trim();
      const matchesSearch =
        !q ||
        ev.to_email.toLowerCase().includes(q) ||
        subj.toLowerCase().includes(q) ||
        provider.toLowerCase().includes(q) ||
        msgId.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || ev.status === statusFilter;
      const matchesProvider = providerFilter === "all" || provider === providerFilter;
      return matchesSearch && matchesStatus && matchesProvider;
    });
  }, [events, providerFilter, searchQuery, statusFilter]);

  // Show template preview
  const handlePreviewTemplate = (type: TemplateType) => {
    const html = EmailService.getTemplatePreview(type);
    setPreviewHtml(html);
  };

  // Stats
  const stats = {
    total: events.length,
    queued: events.filter(e => e.status === "queued").length,
    sent: events.filter(e => e.status === "sent").length,
    failed: events.filter(e => e.status === "failed").length,
  };

  const providerOptions = useMemo(() => {
    const set = new Set<string>();
    for (const ev of events) {
      const p = String(ev.provider || "").trim();
      if (p) set.add(p);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [events]);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Mail className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-xs text-white/60">Total Emails</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <MailCheck className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.sent}</p>
                <p className="text-xs text-white/60">Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <MailX className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.failed}</p>
                <p className="text-xs text-white/60">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.queued}</p>
                <p className="text-xs text-white/60">Queued</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="log" className="w-full">
        <TabsList className="bg-slate-800/50">
          <TabsTrigger value="log" className="gap-2">
            <Mail className="w-4 h-4" />
            Email Log
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <Eye className="w-4 h-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Email Log Tab */}
        <TabsContent value="log" className="mt-4">
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Email Log
                  </CardTitle>
                  <CardDescription>
                    Provider send events (Supabase table: <code>email_send_events</code>)
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void loadEmailLog()}
                  disabled={isLoading}
                  className="gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>

              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-3 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input
                    placeholder="Search by recipient, subject, provider, message id…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 bg-slate-800/50 border-slate-700"
                  />
                </div>
                <Select value={providerFilter} onValueChange={setProviderFilter}>
                  <SelectTrigger className="w-[180px] bg-slate-800/50 border-slate-700">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Providers</SelectItem>
                    {providerOptions.map(p => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={v => setStatusFilter(v as any)}>
                  <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="queued">Queued</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                </div>
              ) : filteredEmails.length === 0 ? (
                <div className="text-center py-12 text-white/60">
                  <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No emails found</p>
                  <p className="text-sm">Emails will appear here once sent</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {filteredEmails.map(entry => {
                      const subject = String(
                        entry.subject || entry.email_campaigns?.subject || "",
                      ).trim();
                      const subjectDisplay = subject || "(no subject recorded)";
                      const provider = String(entry.provider || "").trim() || "—";
                      const createdAt = entry.created_at || entry.sent_at || "";

                      return (
                        <div
                          key={entry.id}
                          className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-slate-600/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                {getStatusBadge(entry.status)}
                                <Badge variant="secondary" className="gap-1">
                                  <Mail className="w-3 h-3" />
                                  {provider}
                                </Badge>
                              </div>
                              <p className="text-white font-medium truncate">{entry.to_email}</p>
                              <p className="text-white/60 text-sm truncate">{subjectDisplay}</p>
                              <p className="text-white/40 text-xs mt-1">
                                {formatMaybeDate(createdAt)}
                              </p>
                              {entry.error_message && (
                                <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  {entry.error_message}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="mt-4">
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Email Templates
              </CardTitle>
              <CardDescription>Preview email templates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {(
                  [
                    "verification",
                    "password_reset",
                    "welcome",
                    "notification",
                    "partner_invite",
                  ] as const
                ).map(type => (
                  <Dialog key={type}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-auto py-4 flex-col gap-2"
                        onClick={() => handlePreviewTemplate(type)}
                      >
                        {getTypeBadge(type)}
                        <span className="text-xs text-white/60">Preview</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          {getTypeBadge(type)}
                          Template Preview
                        </DialogTitle>
                        <DialogDescription>
                          This is how the email will appear to recipients
                        </DialogDescription>
                      </DialogHeader>
                      <div className="mt-4 rounded-lg overflow-hidden border border-slate-700">
                        <iframe
                          srcDoc={previewHtml}
                          className="w-full h-[500px] bg-white"
                          title={`${type} email preview`}
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-4">
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Email Configuration
              </CardTitle>
              <CardDescription>Current email service settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <p className="text-white/60 text-sm mb-1">Email Provider</p>
                    <p className="text-white font-medium">
                      {emailConfig.useSupabaseEmail ? "Supabase Auth (Built-in)" : "Custom SMTP"}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <p className="text-white/60 text-sm mb-1">App Name</p>
                    <p className="text-white font-medium">{emailConfig.appName}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <p className="text-white/60 text-sm mb-1">Support Email</p>
                    <p className="text-white font-medium">{emailConfig.supportEmail}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <p className="text-white/60 text-sm mb-1">App URL</p>
                    <p className="text-white font-medium truncate">{emailConfig.appUrl}</p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div>
                      <p className="text-blue-400 font-medium">Auth vs provider logs</p>
                      <p className="text-white/70 text-sm mt-1">
                        Verification and password reset emails are handled by Supabase Auth (not
                        recorded in <code>email_send_events</code>). Admin/provider-sent emails
                        (Edge Function <code>send-email</code>) appear in the log tab.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 space-y-3">
                  <p className="text-white/80 text-sm font-medium">Resend verification email</p>
                  <div className="flex flex-col md:flex-row gap-2">
                    <Input
                      value={resendTargetEmail}
                      onChange={e => setResendTargetEmail(e.target.value)}
                      placeholder="user@domain.com"
                      className="bg-slate-900/40 border-slate-700"
                    />
                    <Button
                      onClick={async () => {
                        const email = resendTargetEmail.trim();
                        if (!email) return;
                        setResending(true);
                        try {
                          const result = await EmailService.sendVerificationEmail(email);
                          if (result.success) {
                            toast.success(`Verification email requested for ${email}`);
                          } else {
                            toast.error(result.error || "Failed to request verification email");
                          }
                        } finally {
                          setResending(false);
                        }
                      }}
                      disabled={resending || !resendTargetEmail.trim()}
                      className="gap-2"
                    >
                      {resending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      Send
                    </Button>
                  </div>
                  <p className="text-xs text-white/50">
                    Note: Supabase Auth emails are not recorded in <code>email_send_events</code>.
                  </p>
                </div>

                {emailConfig.smtp && (
                  <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <p className="text-white/60 text-sm mb-2">Custom SMTP Configuration</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p className="text-white/40">Host:</p>
                      <p className="text-white">{emailConfig.smtp.host}</p>
                      <p className="text-white/40">Port:</p>
                      <p className="text-white">{emailConfig.smtp.port}</p>
                      <p className="text-white/40">Secure:</p>
                      <p className="text-white">{emailConfig.smtp.secure ? "Yes (TLS)" : "No"}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default EmailManagement;
