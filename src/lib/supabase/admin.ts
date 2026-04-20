import { createClient } from "@supabase/supabase-js";
import { env, isSupabaseAdminConfigured } from "@/lib/env";
import type { Database } from "@/types/database";

export function createSupabaseAdminClient() {
  if (!isSupabaseAdminConfigured) {
    return null;
  }

  return createClient<Database>(env.supabaseUrl!, env.supabaseServiceRoleKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
