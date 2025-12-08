import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { EmailVerificationBanner } from './EmailVerificationBanner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Shield, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface EmailVerificationGateProps {
  children: React.ReactNode;
  requireVerification?: boolean;
}

export const EmailVerificationGate = ({ 
  children, 
  requireVerification = true 
}: EmailVerificationGateProps) => {
  const { user, loading } = useAuth();
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkVerification = async () => {
      if (!user) {
        setIsVerified(null);
        setChecking(false);
        return;
      }

      try {
        const { data: { user: currentUser }, error } = await supabase.auth.getUser();
        
        if (error) {
          logger.error('Failed to check email verification', { error, userId: user.id });
          setIsVerified(false);
          return;
        }

        const verified = !!currentUser?.email_confirmed_at;
        setIsVerified(verified);
      } catch (error) {
        logger.error('Error checking email verification', { error, userId: user.id });
        setIsVerified(false);
      } finally {
        setChecking(false);
      }
    };

    if (!loading) {
      checkVerification();
    }
  }, [user, loading]);

  // Listen for auth state changes (e.g., when user verifies email)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const verified = !!session?.user?.email_confirmed_at;
        setIsVerified(verified);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading || checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Checking verification status...</p>
        </div>
      </div>
    );
  }

  // If verification is not required, show children
  if (!requireVerification) {
    return <>{children}</>;
  }

  // If no user, show children (auth will handle it)
  if (!user) {
    return <>{children}</>;
  }

  // If verified, show children
  if (isVerified) {
    return <>{children}</>;
  }

  // If not verified, show verification required UI
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 rounded-full bg-warning/10 w-fit">
            <Mail className="w-8 h-8 text-warning" />
          </div>
          <CardTitle>Email Verification Required</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Please verify your email address to access all features of MorphoScan Pro.
          </p>
          
          <EmailVerificationBanner 
            email={user.email || ''} 
            onVerified={() => setIsVerified(true)}
          />

          <div className="p-4 rounded-lg bg-muted/30 space-y-2">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium mb-1">Why verify?</p>
                <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Secure access to your health data</li>
                  <li>Enable cloud backup and sync</li>
                  <li>Receive important notifications</li>
                  <li>Access premium features</li>
                </ul>
              </div>
            </div>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Didn't receive the email? Check your spam folder or click "Resend Email" above.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

