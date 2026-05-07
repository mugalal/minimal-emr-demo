import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { config, getSupabaseRuntimeKey, isSupabaseConfigured } from "./config.js";
import {
  createAppointment,
  getDashboardData,
  getHealthSnapshot,
  getPatientChart,
  listDoctors,
  listPatients,
  updateAppointment,
} from "./emr-service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const frontendRoot = path.join(projectRoot, "frontend");

const app = express();

function asyncRoute(handler) {
  return function wrappedHandler(request, response, next) {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}

app.disable("x-powered-by");
app.use(express.json());

app.get(
  "/api/health",
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
  asyncRoute(async (_request, response) => {
    response.json(await getDashboardData());
  })
);

app.get(
  "/api/patients",
  asyncRoute(async (request, response) => {
    const search = typeof request.query.search === "string" ? request.query.search : "";
    response.json(await listPatients(search));
  })
);

app.get(
  "/api/doctors",
  asyncRoute(async (_request, response) => {
    response.json(await listDoctors());
  })
);

app.get(
  "/api/patients/:patientId/chart",
  asyncRoute(async (request, response) => {
    response.json(await getPatientChart(request.params.patientId));
  })
);

app.post(
  "/api/patients/:patientId/appointments",
  asyncRoute(async (request, response) => {
    response.status(201).json(await createAppointment(request.params.patientId, request.body ?? {}));
  })
);

app.patch(
  "/api/appointments/:appointmentId",
  asyncRoute(async (request, response) => {
    response.json(await updateAppointment(request.params.appointmentId, request.body ?? {}));
  })
);

app.use(express.static(frontendRoot));

app.get("*", (_request, response) => {
  response.sendFile(path.join(frontendRoot, "index.html"));
});

app.use((error, _request, response, _next) => {
  const statusCode = error.statusCode ?? 500;
  const payload = {
    error: error.message || "Unexpected server error.",
  };

  if (process.env.NODE_ENV !== "production" && error.details) {
    payload.details = error.details;
  }

  response.status(statusCode).json(payload);
});

app.listen(config.port, () => {
  console.log(`${config.appName} running at http://localhost:${config.port}`);
});
