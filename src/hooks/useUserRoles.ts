import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin' | 'pro' | 'user';

interface UseUserRolesReturn {
  user: any;
  roles: AppRole[];
  isAdmin: boolean;
  isPro: boolean;
  isPremium: boolean;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useUserRoles = (): UseUserRolesReturn => {
  const [user, setUser] = useState<any>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      setUser(user);
      
      if (!user) {
        setRoles([]);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (fetchError) {
        console.error('Error fetching roles:', fetchError);
        setError(fetchError.message);
        return;
      }

      const userRoles = data?.map(r => r.role as AppRole) || [];
      setRoles(userRoles);
    } catch (err) {
      console.error('Error in useUserRoles:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch roles');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchRoles();
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    user,
    roles,
    isAdmin: roles.includes('admin'),
    isPro: roles.includes('pro'),
    isPremium: roles.includes('admin') || roles.includes('pro'), // Premium access for admin/pro users
    isLoading,
    error,
    refetch: fetchRoles,
  };
};
