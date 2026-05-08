/**
 * Minimal structured JSON logger.
 *
 * In production, outputs newline-delimited JSON (NDJSON) — compatible with
 * Datadog, Loki, Cloud Logging, and most log aggregators.
 * In development, outputs a human-readable colourised format instead.
 */

const IS_PROD = process.env.NODE_ENV === "production";
const IS_TEST = process.env.NODE_ENV === "test";

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const COLOURS = {
  debug: "\x1b[36m",  // cyan
  info:  "\x1b[32m",  // green
  warn:  "\x1b[33m",  // yellow
  error: "\x1b[31m",  // red
  reset: "\x1b[0m",
};

function write(level, message, extra = {}) {
  // Suppress all output during tests unless explicitly opted in.
  if (IS_TEST) return;

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...extra,
  };

  if (IS_PROD) {
    process.stdout.write(JSON.stringify(entry) + "\n");
    return;
  }

  const colour = COLOURS[level] ?? COLOURS.reset;
  const prefix = `${colour}[${level.toUpperCase()}]${COLOURS.reset}`;
  const ts = entry.timestamp.replace("T", " ").replace("Z", "");
  const extraStr = Object.keys(extra).length
    ? " " + JSON.stringify(extra)
    : "";

  process.stdout.write(`${ts} ${prefix} ${message}${extraStr}\n`);
}

export const logger = {
  debug: (msg, extra) => write("debug", msg, extra),
  info:  (msg, extra) => write("info",  msg, extra),
  warn:  (msg, extra) => write("warn",  msg, extra),
  error: (msg, extra) => write("error", msg, extra),
};
