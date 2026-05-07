import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { config, getSupabaseRuntimeKey, isSupabaseConfigured, isProduction, validateConfig } from "./config.js";
import {
  createAllergy,
  createAppointment,
  createEncounter,
  createMedication,
  createPatient,
  getDashboardData,
  getHealthSnapshot,
  getPatientChart,
  listDoctors,
  listPatients,
  updateAllergy,
  updateAppointment,
  updateMedication,
  updatePatient,
} from "./emr-service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const frontendRoot = path.join(projectRoot, "frontend");

// ---- startup checks ----
for (const warning of validateConfig()) {
  console.warn(`[config] ${warning}`);
}

// ---- app ----
const app = express();

// Trust first proxy hop in production (nginx, Fly, Railway, etc.) so
// req.ip reflects the real client address for rate limiting.
if (isProduction()) {
  app.set("trust proxy", 1);
}

// ---- helpers ----
function asyncRoute(handler) {
  return function wrappedHandler(request, response, next) {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}

// ---- security headers ----
app.disable("x-powered-by");

app.use((_request, response, next) => {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  // Deliberately "0": modern browsers rely on CSP instead of this legacy header.
  response.setHeader("X-XSS-Protection", "0");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader("Permissions-Policy", "geolocation=(), camera=(), microphone=()");
  response.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self'",
      // unsafe-inline is required by the CSS custom-property pattern used in the frontend.
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join("; ")
  );
  next();
});

// ---- CORS (only active when CORS_ORIGIN is set in the environment) ----
const allowedOrigins = config.corsOrigin
  ? config.corsOrigin.split(",").map((o) => o.trim()).filter(Boolean)
  : [];

if (allowedOrigins.length) {
  app.use((request, response, next) => {
    const origin = request.headers.origin;

    if (origin && allowedOrigins.includes(origin)) {
      response.setHeader("Access-Control-Allow-Origin", origin);
      response.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
      response.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
      response.setHeader("Access-Control-Max-Age", "86400");
      response.vary("Origin");
    }

    if (request.method === "OPTIONS") {
      response.status(204).end();
      return;
    }

    next();
  });
}

// ---- in-process rate limiter ----
// Per-process only -- resets on restart.
// For multi-process deployments, replace with a shared store (e.g. Redis).
const rateLimitStore = new Map();

// Prune expired entries every minute to prevent unbounded memory growth.
setInterval(() => {
  const now = Date.now();

  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 60_000).unref();

function apiRateLimit(request, response, next) {
  const key = request.ip ?? "unknown";
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + config.rateLimitWindowMs });
    next();
    return;
  }

  if (record.count >= config.rateLimitMax) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    response.setHeader("Retry-After", String(retryAfter));
    response.status(429).json({ error: "Too many requests. Please slow down." });
    return;
  }

  record.count += 1;
  next();
}

// ---- body parsing ----
app.use(express.json({ limit: "100kb" }));

// ---- request logger ----
app.use((request, _response, next) => {
  console.log(`${new Date().toISOString()} ${request.method} ${request.url}`);
  next();
});

// ---- UUID param guard ----
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function requireUuid(paramName) {
  return function uuidGuard(request, response, next) {
    if (!UUID_PATTERN.test(request.params[paramName] ?? "")) {
      response.status(400).json({ error: `${paramName} must be a valid UUID.` });
      return;
    }

    next();
  };
}

// ---- API routes ----
app.get(
  "/api/health",
  apiRateLimit,
  asyncRoute(async (_request, response) => {
    const health = isSupabaseConfigured()
      ? await getHealthSnapshot()
      : {
          status: "degraded",
          checkedAt: new Date().toISOString(),
        };

    response.json({
      application: config.appName,
      status: health.status,
      checkedAt: health.checkedAt,
      dataSources: {
        postgres: {
          configured: isSupabaseConfigured(),
          runtimeKey: getSupabaseRuntimeKey() ? (config.supabaseServiceRoleKey ? "service_role" : "anon") : "missing",
        },
        mongo: {
          configured: Boolean(config.mongoAtlasUri),
          mode: config.mongoAtlasUri ? "atlas-uri-present" : "scripts-only",
        },
      },
    });
  })
);

app.get(
  "/api/dashboard",
  apiRateLimit,
  asyncRoute(async (_request, response) => {
    response.json(await getDashboardData());
  })
);

app.get(
  "/api/patients",
  apiRateLimit,
  asyncRoute(async (request, response) => {
    const search = typeof request.query.search === "string" ? request.query.search : "";
    response.json(await listPatients(search));
  })
);

app.post(
  "/api/patients",
  apiRateLimit,
  asyncRoute(async (request, response) => {
    response.status(201).json(await createPatient(request.body ?? {}));
  })
);

app.patch(
  "/api/patients/:patientId",
  apiRateLimit,
  requireUuid("patientId"),
  asyncRoute(async (request, response) => {
    response.json(await updatePatient(request.params.patientId, request.body ?? {}));
  })
);

app.get(
  "/api/doctors",
  apiRateLimit,
  asyncRoute(async (_request, response) => {
    response.json(await listDoctors());
  })
);

app.get(
  "/api/patients/:patientId/chart",
  apiRateLimit,
  requireUuid("patientId"),
  asyncRoute(async (request, response) => {
    response.json(await getPatientChart(request.params.patientId));
  })
);

app.post(
  "/api/patients/:patientId/allergies",
  apiRateLimit,
  requireUuid("patientId"),
  asyncRoute(async (request, response) => {
    response.status(201).json(await createAllergy(request.params.patientId, request.body ?? {}));
  })
);

app.patch(
  "/api/allergies/:allergyId",
  apiRateLimit,
  requireUuid("allergyId"),
  asyncRoute(async (request, response) => {
    response.json(await updateAllergy(request.params.allergyId, request.body ?? {}));
  })
);

app.post(
  "/api/patients/:patientId/encounters",
  apiRateLimit,
  requireUuid("patientId"),
  asyncRoute(async (request, response) => {
    response.status(201).json(await createEncounter(request.params.patientId, request.body ?? {}));
  })
);

app.post(
  "/api/patients/:patientId/medications",
  apiRateLimit,
  requireUuid("patientId"),
  asyncRoute(async (request, response) => {
    response.status(201).json(await createMedication(request.params.patientId, request.body ?? {}));
  })
);

app.patch(
  "/api/medications/:medicationId",
  apiRateLimit,
  requireUuid("medicationId"),
  asyncRoute(async (request, response) => {
    response.json(await updateMedication(request.params.medicationId, request.body ?? {}));
  })
);

app.post(
  "/api/patients/:patientId/appointments",
  apiRateLimit,
  requireUuid("patientId"),
  asyncRoute(async (request, response) => {
    response.status(201).json(await createAppointment(request.params.patientId, request.body ?? {}));
  })
);

app.patch(
  "/api/appointments/:appointmentId",
  apiRateLimit,
  requireUuid("appointmentId"),
  asyncRoute(async (request, response) => {
    response.json(await updateAppointment(request.params.appointmentId, request.body ?? {}));
  })
);

// ---- static frontend ----
app.use(
  express.static(frontendRoot, {
    maxAge: isProduction() ? "1h" : 0,
    etag: true,
  })
);

app.get("*", (_request, response) => {
  response.sendFile(path.join(frontendRoot, "index.html"));
});

// ---- error handler ----
app.use((error, _request, response, _next) => {
  const statusCode = error.statusCode ?? 500;

  if (statusCode >= 500) {
    console.error(`[error] ${statusCode} -- ${error.message}\n${error.stack ?? ""}`);
  }

  const payload = {
    error: error.message || "Unexpected server error.",
  };

  if (!isProduction() && error.details) {
    payload.details = error.details;
  }

  response.status(statusCode).json(payload);
});

// ---- server + graceful shutdown ----
const server = app.listen(config.port, () => {
  console.log(`${config.appName} running at http://localhost:${config.port} [${config.nodeEnv}]`);
});

function shutdown(signal) {
  console.log(`\n${signal} received -- shutting down gracefully.`);

  server.close(() => {
    console.log("HTTP server closed.");
    process.exit(0);
  });

  // Force exit after 10 s in case in-flight requests stall.
  setTimeout(() => {
    console.error("Graceful shutdown timed out -- forcing exit.");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
