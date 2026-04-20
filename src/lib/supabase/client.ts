"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { env, isSupabaseConfigured } from "@/lib/env";

export function createSupabaseBrowserClient() {
  if (!isSupabaseConfigured) {
    return null;
  }

  return createBrowserClient<Database>(env.supabaseUrl!, env.supabaseAnonKey!);
}
