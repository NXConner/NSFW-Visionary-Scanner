import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export async function requireUserId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    toast.error("Please sign in");
    return null;
  }
  return user.id;
}
