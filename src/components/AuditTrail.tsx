import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  History, Search, Download, Trash2, Filter, Calendar,
  Scan, FileText, Settings, Shield, Database, Clock
} from "lucide-react";
import { useAuditLog, type AuditLogEntry } from "@/hooks/useAuditLog";
import { format, formatDistanceToNow } from "date-fns";

export const AuditTrail = () => {
  const { logs, isLoading, clearLogs, clearOldLogs, exportLogs } = useAuditLog();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const filteredLogs = useMemo(() => {
    let result = logs;
    
    if (categoryFilter !== "all") {
      result = result.filter(log => log.category === categoryFilter);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(log => 
        log.action.toLowerCase().includes(query) ||
        log.details?.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [logs, categoryFilter, searchQuery]);

  const getCategoryIcon = (category: AuditLogEntry['category']) => {
    switch (category) {
      case 'scan': return Scan;
      case 'export': return Download;
      case 'settings': return Settings;
      case 'auth': return Shield;
      case 'data': return Database;
      case 'report': return FileText;
      default: return History;
    }
  };

  const getCategoryColor = (category: AuditLogEntry['category']) => {
    switch (category) {
      case 'scan': return 'bg-primary/20 text-primary border-primary/30';
      case 'export': return 'bg-success/20 text-success border-success/30';
      case 'settings': return 'bg-accent/20 text-accent border-accent/30';
      case 'auth': return 'bg-warning/20 text-warning border-warning/30';
      case 'data': return 'bg-secondary/50 text-foreground border-border';
      case 'report': return 'bg-primary/20 text-primary border-primary/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <Card variant="glass">
        <CardContent className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading activity history...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card variant="glass">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Activity History
            </CardTitle>
            <Badge variant="outline">{logs.length} entries</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="scan">Scans</SelectItem>
                <SelectItem value="export">Exports</SelectItem>
                <SelectItem value="settings">Settings</SelectItem>
                <SelectItem value="auth">Authentication</SelectItem>
                <SelectItem value="data">Data</SelectItem>
                <SelectItem value="report">Reports</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={exportLogs} className="gap-2">
              <Download className="w-4 h-4" />
              Export Log
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Clock className="w-4 h-4" />
                  Clear Old
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear Old Logs</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove all activity logs older than 30 days. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => clearOldLogs(30)}>
                    Clear Old Logs
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-2">
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear All Logs</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all activity logs. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={clearLogs} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Log Entries */}
          <ScrollArea className="h-[400px]">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery || categoryFilter !== "all" 
                    ? "No matching activities found" 
                    : "No activity recorded yet"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredLogs.map((log) => {
                  const Icon = getCategoryIcon(log.category);
                  return (
                    <div
                      key={log.id}
                      className="p-3 rounded-lg bg-card/50 border border-border/50 hover:bg-card/80 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${getCategoryColor(log.category)}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="font-medium text-sm truncate">{log.action}</p>
                            <Badge variant="outline" className="text-[10px] shrink-0">
                              {log.category}
                            </Badge>
                          </div>
                          {log.details && (
                            <p className="text-xs text-muted-foreground truncate mb-1">
                              {log.details}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>{format(new Date(log.timestamp), "MMM d, yyyy 'at' h:mm a")}</span>
                            <span className="text-muted-foreground/50">•</span>
                            <span>{formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {(['scan', 'export', 'settings', 'auth', 'data', 'report'] as const).map((category) => {
          const Icon = getCategoryIcon(category);
          const count = logs.filter(l => l.category === category).length;
          return (
            <Card key={category} variant="glass" className="p-3">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded ${getCategoryColor(category)}`}>
                  <Icon className="w-3 h-3" />
                </div>
                <div>
                  <p className="text-lg font-bold">{count}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{category}s</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
