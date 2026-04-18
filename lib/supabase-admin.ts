import "server-only";

import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

import { assertDatabaseConfigured, config } from "@/lib/config";
import type { Database } from "@/lib/supabase-types";

declare global {
  var __handshakeSupabaseAdmin: SupabaseClient<Database> | undefined;
}

export function getSupabaseAdmin() {
  assertDatabaseConfigured();

  if (!globalThis.__handshakeSupabaseAdmin) {
    globalThis.__handshakeSupabaseAdmin = createClient(
      // Supabase secret key keeps all database access server-only.
      config.supabaseUrl!,
      config.supabaseSecretKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      },
    );
  }

  return globalThis.__handshakeSupabaseAdmin;
}
