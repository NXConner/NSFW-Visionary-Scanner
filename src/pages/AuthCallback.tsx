import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

const AUTH_TIMEOUT_MS = 10000; // 10 second timeout

export const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Completing sign in...");
  const handledRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Safety timeout to prevent infinite loading
    timeoutRef.current = setTimeout(() => {
      if (status === "loading") {
        logger.warn("Auth callback timed out after 10s");
        // Check if we actually have a session despite the hang
        supabase.auth.getSession().then(({ data }) => {
          if (data.session) {
            setStatus("success");
            setMessage("Sign in successful! Redirecting...");
            setTimeout(() => navigate("/"), 500);
          } else {
            setStatus("error");
            setMessage("Sign in timed out. Please try again.");
            setTimeout(() => navigate("/auth"), 2000);
          }
        }).catch(() => {
          setStatus("error");
          setMessage("Sign in timed out. Please try again.");
          setTimeout(() => navigate("/auth"), 2000);
        });
      }
    }, AUTH_TIMEOUT_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [status, navigate]);

  useEffect(() => {
    // If auth context already has user and is done loading, redirect immediately
    if (!authLoading && user && !handledRef.current) {
      handledRef.current = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setStatus("success");
      setMessage("Sign in successful! Redirecting...");
      setTimeout(() => navigate("/"), 500);
      return;
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (handledRef.current) return;

    const handleCallback = async () => {
      try {
        const isLinking = searchParams.get("link") === "true";
        const { data, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (data.session) {
          handledRef.current = true;
          if (timeoutRef.current) clearTimeout(timeoutRef.current);

          if (data.session.user) {
            const provider = data.session.user.app_metadata?.provider;

            if (provider && !isLinking) {
              const { error: updateError } = await supabase.from("profiles").upsert(
                {
                  user_id: data.session.user.id,
                  email: data.session.user.email,
                  display_name:
                    data.session.user.user_metadata?.full_name ||
                    data.session.user.user_metadata?.name ||
                    data.session.user.email?.split("@")[0],
                  updated_at: new Date().toISOString(),
                },
                { onConflict: "user_id" },
              );

              if (updateError) {
                logger.warn("Failed to update profile", { error: updateError });
              } else {
                logger.userAction("social_login_success", data.session.user.id, { provider });
              }
            } else if (isLinking) {
              logger.userAction("social_account_linked", data.session.user.id, { provider });
            }
          }

          setStatus("success");
          setMessage("Sign in successful! Redirecting...");
          setTimeout(() => navigate("/"), 800);
        } else {
          throw new Error("No session found");
        }
      } catch (error) {
        if (handledRef.current) return;
        handledRef.current = true;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        
        logger.error("OAuth callback error", { error });
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Failed to complete sign in");
        setTimeout(() => navigate("/auth"), 2000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center py-12">
          {status === "loading" && (
            <>
              <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">{message}</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="w-12 h-12 text-success mb-4" />
              <p className="text-success font-medium">{message}</p>
            </>
          )}

          {status === "error" && (
            <>
              <AlertCircle className="w-12 h-12 text-destructive mb-4" />
              <p className="text-destructive font-medium">{message}</p>
              <p className="text-sm text-muted-foreground mt-2">Redirecting to sign in...</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
