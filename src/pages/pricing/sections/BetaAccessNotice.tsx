import React from "react";
import { Link } from "react-router-dom";
import { Crown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function BetaAccessNotice({ expiresAt }: { expiresAt?: string | null }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5" />
                Beta Access Enabled
              </CardTitle>
              <CardDescription>
                Purchases are disabled for beta testers. Your account is unlocked for premium + DLC
                testing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {expiresAt ? (
                <Badge variant="outline">Expires: {new Date(expiresAt).toLocaleString()}</Badge>
              ) : (
                <Badge variant="outline">No expiry</Badge>
              )}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild variant="gradient">
                  <Link to="/dlc">Go to DLC Store</Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link to="/">Back to Home</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
