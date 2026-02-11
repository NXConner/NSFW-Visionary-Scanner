/**
 * Admin Licenses Panel
 * Manage license keys and activations
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Key,
  Plus,
  Copy,
  Ban,
  RefreshCw,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Smartphone,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface License {
  id: string;
  key: string;
  userId: string;
  userEmail: string;
  packageName: string;
  status: "active" | "expired" | "revoked";
  devices: number;
  maxDevices: number;
  createdAt: string;
  expiresAt: string;
}

const licenses: License[] = [];

export function AdminLicensesPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filteredLicenses = licenses.filter(lic => {
    const matchesSearch =
      lic.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lic.userEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "active" && lic.status === "active") ||
      (activeTab === "expired" && lic.status === "expired") ||
      (activeTab === "revoked" && lic.status === "revoked");
    return matchesSearch && matchesTab;
  });

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("License key copied to clipboard");
  };

  const activeLicenses = licenses.filter(l => l.status === "active").length;
  const expiredLicenses = licenses.filter(l => l.status === "expired").length;
  const totalDevices = licenses.reduce((sum, l) => sum + l.devices, 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Licenses</p>
                <p className="text-2xl font-bold">{licenses.length}</p>
              </div>
              <Key className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-success">{activeLicenses}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expired</p>
                <p className="text-2xl font-bold text-warning">{expiredLicenses}</p>
              </div>
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Devices</p>
                <p className="text-2xl font-bold">{totalDevices}</p>
              </div>
              <Smartphone className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>License Management</CardTitle>
              <CardDescription>View and manage all license keys</CardDescription>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Generate License
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by key or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="expired">Expired</TabsTrigger>
                <TabsTrigger value="revoked">Revoked</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>License Key</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Devices</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLicenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No licenses found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLicenses.map(lic => (
                    <TableRow key={lic.id}>
                      <TableCell>
                        <code className="text-sm font-mono">{lic.key}</code>
                      </TableCell>
                      <TableCell>{lic.userEmail}</TableCell>
                      <TableCell>{lic.packageName}</TableCell>
                      <TableCell>
                        {lic.devices}/{lic.maxDevices}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            lic.status === "active"
                              ? "default"
                              : lic.status === "expired"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {lic.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{lic.expiresAt}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => copyKey(lic.key)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Ban className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
