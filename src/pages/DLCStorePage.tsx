/**
 * DLC Store Page
 * Marketplace for DLC packages
 */

import React from "react";
import { motion } from "framer-motion";
import { Package } from "lucide-react";
import { DLCStore } from "@/dlc/components/DLCStore";
import { LicenseActivation } from "@/dlc/components/LicenseActivation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RouteTopNav } from "@/components/navigation/RouteTopNav";

export default function DLCStorePage(): React.ReactElement {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <RouteTopNav
        title="Add-On Store"
        backTo="/"
        backLabel="Home"
        showFullNavigation={true}
        actions={[
          {
            key: "icon",
            kind: "custom",
            node: (
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                <Package className="h-4 w-4 text-primary" />
                <span>Browse DLC packages</span>
              </div>
            ),
          },
        ]}
      />

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Tabs defaultValue="store" className="space-y-8">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="store">Browse Store</TabsTrigger>
              <TabsTrigger value="redeem">Redeem Code</TabsTrigger>
            </TabsList>

            <TabsContent value="store">
              <DLCStore />
            </TabsContent>

            <TabsContent value="redeem">
              <div className="max-w-md mx-auto">
                <LicenseActivation />
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
}
