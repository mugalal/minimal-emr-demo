import { createClient } from "@supabase/supabase-js";

import { config, getSupabaseRuntimeKey, isSupabaseConfigured } from "./config.js";

let client;

export function getSupabaseClient() {
  if (!isSupabaseConfigured()) {
    const error = new Error("Supabase is not configured. Add SUPABASE_URL and a runtime key in .env.");
    error.statusCode = 503;
    throw error;
  }

  if (!client) {
    client = createClient(config.supabaseUrl, getSupabaseRuntimeKey(), {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return client;
}
