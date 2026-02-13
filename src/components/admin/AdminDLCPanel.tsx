/**
 * Admin DLC Panel
 * Manage DLC packages, bundles, and content
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Eye,
  DollarSign,
  TrendingUp,
  Search,
  Filter,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DLCPackage {
  id: string;
  name: string;
  price: number;
  sales: number;
  revenue: number;
  status: "active" | "draft" | "archived";
  category: string;
  createdAt: string;
}

// Sample data
const dlcPackages: DLCPackage[] = [
  {
    id: "1",
    name: "Advanced Techniques Pack",
    price: 9.99,
    sales: 1234,
    revenue: 12327.66,
    status: "active",
    category: "Education",
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    name: "Premium Positions Library",
    price: 14.99,
    sales: 856,
    revenue: 12831.44,
    status: "active",
    category: "Lifestyle",
    createdAt: "2024-02-20",
  },
  {
    id: "3",
    name: "Health Monitoring Pro",
    price: 19.99,
    sales: 432,
    revenue: 8635.68,
    status: "active",
    category: "Health",
    createdAt: "2024-03-10",
  },
  {
    id: "4",
    name: "Partner Sync Bundle",
    price: 24.99,
    sales: 289,
    revenue: 7222.11,
    status: "draft",
    category: "Premium",
    createdAt: "2024-04-05",
  },
  {
    id: "5",
    name: "Expert Consultations Pack",
    price: 49.99,
    sales: 156,
    revenue: 7798.44,
    status: "active",
    category: "Premium",
    createdAt: "2024-05-01",
  },
];

export function AdminDLCPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("packages");

  const filteredPackages = dlcPackages.filter(pkg =>
    pkg.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalRevenue = dlcPackages.reduce((sum, pkg) => sum + pkg.revenue, 0);
  const totalSales = dlcPackages.reduce((sum, pkg) => sum + pkg.sales, 0);
  const activePackages = dlcPackages.filter(pkg => pkg.status === "active").length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sales</p>
                <p className="text-2xl font-bold">{totalSales.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Packages</p>
                <p className="text-2xl font-bold">{activePackages}</p>
              </div>
              <Package className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Price</p>
                <p className="text-2xl font-bold">
                  $
                  {(dlcPackages.reduce((sum, p) => sum + p.price, 0) / dlcPackages.length).toFixed(
                    2,
                  )}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList>
            <TabsTrigger value="packages">Packages</TabsTrigger>
            <TabsTrigger value="bundles">Bundles</TabsTrigger>
            <TabsTrigger value="promos">Promo Codes</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search packages..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Package
            </Button>
          </div>
        </div>

        <TabsContent value="packages" className="mt-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>DLC Packages</CardTitle>
              <CardDescription>Manage all downloadable content packages</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Package</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Sales</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPackages.map(pkg => (
                      <TableRow key={pkg.id}>
                        <TableCell className="font-medium">{pkg.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{pkg.category}</Badge>
                        </TableCell>
                        <TableCell>${pkg.price.toFixed(2)}</TableCell>
                        <TableCell>{pkg.sales.toLocaleString()}</TableCell>
                        <TableCell>${pkg.revenue.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              pkg.status === "active"
                                ? "default"
                                : pkg.status === "draft"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {pkg.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" /> View
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bundles" className="mt-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Bundle Packages</CardTitle>
              <CardDescription>Create and manage package bundles with discounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "Starter Bundle", packages: 3, discount: 15, price: 29.99 },
                  { name: "Pro Bundle", packages: 5, discount: 25, price: 49.99 },
                  { name: "Complete Collection", packages: 9, discount: 40, price: 79.99 },
                ].map((bundle, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-semibold">{bundle.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {bundle.packages} packages • {bundle.discount}% off
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-bold text-lg">${bundle.price}</p>
                      <Switch defaultChecked />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="promos" className="mt-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Promo Codes</CardTitle>
              <CardDescription>Manage discount codes and promotions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { code: "WELCOME20", discount: "20%", uses: 156, maxUses: 500, active: true },
                  { code: "SUMMER2024", discount: "15%", uses: 89, maxUses: 200, active: true },
                  { code: "VIP50", discount: "50%", uses: 12, maxUses: 50, active: true },
                  { code: "EXPIRED10", discount: "10%", uses: 200, maxUses: 200, active: false },
                ].map((promo, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-4">
                      <code className="px-2 py-1 bg-background rounded font-mono text-sm">
                        {promo.code}
                      </code>
                      <Badge variant={promo.active ? "default" : "secondary"}>
                        {promo.discount} off
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-sm text-muted-foreground">
                        {promo.uses}/{promo.maxUses} uses
                      </p>
                      <Switch checked={promo.active} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>DLC Analytics</CardTitle>
              <CardDescription>Track performance and sales trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Top Performers</h3>
                  {dlcPackages
                    .sort((a, b) => b.sales - a.sales)
                    .slice(0, 3)
                    .map((pkg, i) => (
                      <div
                        key={pkg.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold text-muted-foreground">#{i + 1}</span>
                          <div>
                            <p className="font-medium">{pkg.name}</p>
                            <p className="text-sm text-muted-foreground">{pkg.sales} sales</p>
                          </div>
                        </div>
                        <p className="font-bold text-success">${pkg.revenue.toLocaleString()}</p>
                      </div>
                    ))}
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold">Recent Activity</h3>
                  {[
                    { action: "New purchase", package: "Advanced Techniques", time: "2 min ago" },
                    {
                      action: "Refund processed",
                      package: "Health Monitoring Pro",
                      time: "15 min ago",
                    },
                    { action: "Bundle created", package: "Starter Bundle", time: "1 hour ago" },
                    { action: "Price updated", package: "Premium Positions", time: "3 hours ago" },
                  ].map((activity, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div>
                        <p className="font-medium">{activity.action}</p>
                        <p className="text-sm text-muted-foreground">{activity.package}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">{activity.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
