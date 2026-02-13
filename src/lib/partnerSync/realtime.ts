import { supabase } from "@/integrations/supabase/client";

type RealtimeOptions = {
  schema?: string;
  table: string;
  filter?: string;
  onChange: () => void;
};

export function subscribeToTable({ schema = "public", table, filter, onChange }: RealtimeOptions) {
  const channel = supabase.channel(`ps-${table}-${Math.random().toString(36).slice(2, 8)}`);
  channel.on(
    "postgres_changes",
    { event: "*", schema, table, filter },
    () => {
      onChange();
    },
  );
  channel.subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
