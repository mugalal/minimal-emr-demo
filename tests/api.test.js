/**
 * Integration tests for the EMR API.
 *
 * These tests spin up the actual Express server in-process (no network calls
 * to Supabase — the app gracefully degrades when SUPABASE_URL is empty) and
 * exercise the HTTP layer end-to-end.
 *
 * Run with:  npm test
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";

// Force test environment so the logger stays silent
process.env.NODE_ENV = "test";
process.env.SUPABASE_URL = "";
process.env.SUPABASE_ANON_KEY = "";

// Dynamic import after env vars are set
const { app } = await import("../src/server.js");

// ---- test server lifecycle ----
let server;
let baseUrl;

before(() => {
  return new Promise((resolve) => {
    server = app.listen(0, () => {
      const { port } = server.address();
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

after(() => {
  return new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
});

// ---- helpers ----
async function get(path) {
  const res = await fetch(`${baseUrl}${path}`);
  const body = await res.json();
  return { status: res.status, body };
}

// ---- tests ----
describe("GET /api/health", () => {
  it("returns 200 with application metadata", async () => {
    const { status, body } = await get("/api/health");
    assert.equal(status, 200);
    assert.equal(typeof body.application, "string");
    assert.equal(typeof body.version, "string");
    assert.ok(["ok", "degraded"].includes(body.status), `Unexpected status: ${body.status}`);
  });

  it("includes uptime and memory fields", async () => {
    const { body } = await get("/api/health");
    assert.equal(typeof body.uptime?.seconds, "number");
    assert.equal(typeof body.memory?.heapUsed, "string");
  });
});

describe("GET /api/dashboard", () => {
  it("returns 503 when Supabase is not configured", async () => {
    const { status } = await get("/api/dashboard");
    // Without Supabase credentials the service returns 503
    assert.equal(status, 503);
  });
});

describe("GET /api/patients", () => {
  it("returns 503 when Supabase is not configured", async () => {
    const { status } = await get("/api/patients");
    assert.equal(status, 503);
  });

  it("accepts a search query parameter without error", async () => {
    const { status } = await get("/api/patients?search=test");
    // 503 is expected without Supabase — what matters is it doesn't crash (500)
    assert.notEqual(status, 500);
  });
});

describe("UUID validation", () => {
  it("rejects non-UUID patient IDs with 400", async () => {
    const { status, body } = await get("/api/patients/not-a-uuid/chart");
    assert.equal(status, 400);
    assert.ok(body.error.includes("UUID"), `Expected UUID error, got: ${body.error}`);
  });

  it("rejects short hex strings with 400", async () => {
    const { status } = await get("/api/patients/12345/chart");
    assert.equal(status, 400);
  });

  it("accepts a valid UUID format (proceeds to service layer)", async () => {
    const { status } = await get("/api/patients/00000000-0000-0000-0000-000000000000/chart");
    // Will hit Supabase and return 503 — but the UUID guard passes
    assert.notEqual(status, 400);
  });
});

describe("Unknown API routes", () => {
  it("returns 404 JSON for unknown /api paths", async () => {
    const { status, body } = await get("/api/does-not-exist");
    assert.equal(status, 404);
    assert.equal(typeof body.error, "string");
  });
});

describe("Static frontend", () => {
  it("serves index.html for non-API routes", async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.equal(res.status, 200);
    const text = await res.text();
    assert.ok(text.includes("<html"), "Expected HTML response");
  });
});
