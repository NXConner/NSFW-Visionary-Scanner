import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Trash2, AlertTriangle, Shield, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { useNavigate } from "react-router-dom";

export const AccountDeletion = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [confirmEmail, setConfirmEmail] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  const userEmail = user?.email || "";
  const isConfirmed = confirmEmail === userEmail && confirmText.toLowerCase() === "delete";

  const handleDeleteAccount = async () => {
    if (!user) return;

    if (!isConfirmed) {
      toast.error('Please confirm by entering your email and typing "DELETE"');
      return;
    }

    setIsDeleting(true);
    try {
      // 1. Cancel active subscription if exists
      try {
        const { data: subscription } = await supabase
          .from("user_subscriptions")
          .select("stripe_subscription_id")
          .eq("user_id", user.id)
          .single();

        if (subscription?.stripe_subscription_id) {
          // Cancel subscription via Edge Function
          await supabase.functions.invoke("cancel-subscription", {
            body: {
              subscriptionId: subscription.stripe_subscription_id,
              cancelAtPeriodEnd: false, // Immediate cancellation
            },
          });
          logger.info("Subscription cancelled during account deletion", { userId: user.id });
        }
      } catch (error) {
        logger.warn("No active subscription to cancel", { userId: user.id, error });
      }

      // 2. Clear local storage first
      try {
        localStorage.clear();
        sessionStorage.clear();
        logger.info("Local storage cleared", { userId: user.id });
      } catch (error) {
        logger.warn("Failed to clear local storage", { error, userId: user.id });
      }

      // 3. Delete all user data via Edge Function (handles Supabase + Stripe)
      const { error: deleteError } = await supabase.functions.invoke("delete-user-account", {
        body: { userId: user.id },
      });

      if (deleteError) {
        throw deleteError;
      }

      logger.userAction("account_deleted", user.id);

      // 5. Sign out and redirect
      await signOut();
      toast.success("Account deleted successfully");
      navigate("/auth");
    } catch (error) {
      logger.error("Account deletion failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId: user.id,
      });
      toast.error("Failed to delete account. Please contact support.");
    } finally {
      setIsDeleting(false);
      setShowDialog(false);
    }
  };

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <Trash2 className="w-5 h-5" />
          Delete Account
        </CardTitle>
        <CardDescription>
          Permanently delete your account and all associated data. This action cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Warning:</strong> This will permanently delete:
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li>All scan history and measurements</li>
              <li>Health diary entries</li>
              <li>Progress photos and tracking data</li>
              <li>User preferences and settings</li>
              <li>Active subscriptions (will be cancelled)</li>
              <li>All cloud-synced data</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="p-4 rounded-lg bg-muted/30 space-y-2">
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium mb-1">GDPR Right to Erasure</p>
              <p className="text-muted-foreground">
                You have the right to request deletion of your personal data. This action complies
                with GDPR requirements.
              </p>
            </div>
          </div>
        </div>

        <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete My Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription className="space-y-4">
                <p>
                  This action cannot be undone. This will permanently delete your account and remove
                  all your data from our servers.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="confirm-email">
                      Type your email to confirm:{" "}
                      <span className="text-muted-foreground">({userEmail})</span>
                    </Label>
                    <Input
                      id="confirm-email"
                      type="email"
                      value={confirmEmail}
                      onChange={e => setConfirmEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-text">
                      Type <span className="font-mono font-bold">DELETE</span> to confirm:
                    </Label>
                    <Input
                      id="confirm-text"
                      type="text"
                      value={confirmText}
                      onChange={e => setConfirmText(e.target.value)}
                      placeholder="Type DELETE"
                      className="font-mono uppercase"
                    />
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={!isConfirmed || isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Yes, Delete Account
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};
