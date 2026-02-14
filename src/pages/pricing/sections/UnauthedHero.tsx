import React from "react";

import { Button } from "@/components/ui/button";

export function UnauthedHero({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Unlock the full potential of your health journey
          </p>
          <Button onClick={onSignIn} size="lg">
            Sign In to Get Started
          </Button>
        </div>
      </div>
    </div>
  );
}
