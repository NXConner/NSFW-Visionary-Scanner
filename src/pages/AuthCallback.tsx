import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Completing sign in...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if this is a link account flow
        const isLinking = searchParams.get('link') === 'true';

        // Handle OAuth callback
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (data.session) {
          // Update user profile with social account info if available
          if (data.session.user) {
            const provider = data.session.user.app_metadata?.provider;
            const providerId = data.session.user.app_metadata?.providers?.[0];

            if (provider && !isLinking) {
              // First-time social login - update profile
              const { error: updateError } = await supabase
                .from('profiles')
                .upsert({
                  id: data.session.user.id,
                  email: data.session.user.email,
                  display_name: data.session.user.user_metadata?.full_name || 
                               data.session.user.user_metadata?.name ||
                               data.session.user.email?.split('@')[0],
                  avatar_url: data.session.user.user_metadata?.avatar_url ||
                             data.session.user.user_metadata?.picture,
                  provider: provider,
                  updated_at: new Date().toISOString(),
                }, {
                  onConflict: 'id',
                });

              if (updateError) {
                logger.warn('Failed to update profile with social account info', { error: updateError });
              } else {
                logger.userAction('social_login_success', data.session.user.id, { provider });
              }
            } else if (isLinking) {
              logger.userAction('social_account_linked', data.session.user.id, { provider });
            }
          }

          setStatus('success');
          setMessage('Sign in successful! Redirecting...');
          
          setTimeout(() => {
            navigate('/');
          }, 1500);
        } else {
          throw new Error('No session found');
        }
      } catch (error) {
        logger.error('OAuth callback error', { error });
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Failed to complete sign in');
        
        setTimeout(() => {
          navigate('/auth');
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, user]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center py-12">
          {status === 'loading' && (
            <>
              <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle2 className="w-12 h-12 text-success mb-4" />
              <p className="text-success font-medium">{message}</p>
            </>
          )}

          {status === 'error' && (
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

