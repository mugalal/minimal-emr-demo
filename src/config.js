import dotenv from "dotenv";

dotenv.config();

const port = Number.parseInt(process.env.PORT ?? "3000", 10);

export const config = {
  appName: "Minimal EMR Demo",
  port: Number.isNaN(port) ? 3000 : port,
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  mongoAtlasUri: process.env.MONGODB_ATLAS_URI ?? "",
};

export function getSupabaseRuntimeKey() {
  return config.supabaseServiceRoleKey || config.supabaseAnonKey;
}

export function isSupabaseConfigured() {
  return Boolean(config.supabaseUrl && getSupabaseRuntimeKey());
}
