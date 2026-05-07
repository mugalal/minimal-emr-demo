import dotenv from "dotenv";

dotenv.config();

const port = Number.parseInt(process.env.PORT ?? "3000", 10);
const rateLimitWindowMs = Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "60000", 10);
const rateLimitMax = Number.parseInt(process.env.RATE_LIMIT_MAX ?? "120", 10);

export const config = {
  appName: "Minimal EMR Demo",
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number.isNaN(port) ? 3000 : port,
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  mongoAtlasUri: process.env.MONGODB_ATLAS_URI ?? "",
  // CORS: comma-separated allowed origins. Leave empty when frontend is
  // served by this same Express process (the default).
  corsOrigin: process.env.CORS_ORIGIN ?? "",
  // Rate limiting: max requests per IP per window.
  rateLimitWindowMs: Number.isNaN(rateLimitWindowMs) ? 60_000 : rateLimitWindowMs,
  rateLimitMax: Number.isNaN(rateLimitMax) ? 120 : rateLimitMax,
};

export function getSupabaseRuntimeKey() {
  return config.supabaseServiceRoleKey || config.supabaseAnonKey;
}

export function isSupabaseConfigured() {
  return Boolean(config.supabaseUrl && getSupabaseRuntimeKey());
}

export function isProduction() {
  return config.nodeEnv === "production";
}

export function validateConfig() {
  const warnings = [];

  if (!config.supabaseUrl) {
    warnings.push("SUPABASE_URL is not set -- API routes will return 503.");
  }

  if (!getSupabaseRuntimeKey()) {
    warnings.push(
      "No Supabase key set (SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY) -- API routes will return 503."
    );
  }

  return warnings;
}
