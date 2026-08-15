import { redact } from "./redact";

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_RANK: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

// Arbitrary structured context - route/action/userId/tenantId are the
// fields every dashboard API route can supply (see handleApiError), but
// this isn't restricted to them; any JSON-serializable metadata is fine.
export interface LogPayload {
  message?: string;
  error?: unknown;
  route?: string;
  action?: string;
  userId?: string;
  tenantId?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  [key: string]: unknown;
}

// No vendor dependency - this is the one seam a future Sentry/Datadog/
// OpenTelemetry integration hooks into. Swapping the transport doesn't
// touch any of the ~75 logger.error()/logger.warn()/logger.info() call
// sites across the API routes; it only changes where entries end up.
export type LogTransport = (entry: LogEntry) => void;

function defaultTransport(entry: LogEntry): void {
  const isDevelopment = process.env.NODE_ENV === "development";

  if (isDevelopment) {
    // Pretty, readable - one line for the message, indented lines for
    // the rest of the payload. Not JSON: this is for a human watching a
    // terminal, not a log aggregator.
    const { timestamp, level, message, ...rest } = entry;
    const restKeys = Object.keys(rest);
    // This file is the one legitimate console.log call site in the
    // codebase - it's the logger's own default transport, not an ad hoc
    // debug statement.
    // eslint-disable-next-line no-console
    const writer = level === "error" ? console.error : level === "warn" ? console.warn : console.log;

    writer(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
    if (restKeys.length > 0) {
      writer(rest);
    }
    return;
  }

  // Production (and anything else, e.g. "test"): one JSON object per
  // line - the format every log aggregator (Vercel, Datadog, CloudWatch,
  // etc.) expects to parse without any project-specific configuration.
  const line = JSON.stringify(entry);
  if (entry.level === "error") {
    console.error(line);
  } else if (entry.level === "warn") {
    console.warn(line);
  } else {
    // eslint-disable-next-line no-console -- see the comment above.
    console.log(line);
  }
}

let transport: LogTransport = defaultTransport;

// The only integration point a future Sentry/Datadog/OpenTelemetry
// setup needs - call once at app startup to redirect every subsequent
// logger.error()/warn()/info() call, with zero changes anywhere else.
export function setLogTransport(next: LogTransport): void {
  transport = next;
}

function resolveMinLevel(): LogLevel {
  const configured = process.env.LOG_LEVEL as LogLevel | undefined;
  if (configured && configured in LEVEL_RANK) {
    return configured;
  }
  return process.env.NODE_ENV === "development" ? "debug" : "info";
}

function log(level: LogLevel, payload: LogPayload): void {
  if (LEVEL_RANK[level] < LEVEL_RANK[resolveMinLevel()]) {
    return;
  }

  const { message, ...context } = payload;

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message: message ?? (level === "error" ? "Unhandled error" : ""),
    ...(redact(context) as Record<string, unknown>),
  };

  transport(entry);
}

// Structured, JSON-friendly, timestamped - the only logger this codebase
// should ever call directly (no scattered console.log/error anywhere
// else). Sensitive keys (password/token/service_role/etc.) are stripped
// from context automatically - see redact.ts.
export const logger = {
  debug(payload: LogPayload): void {
    log("debug", payload);
  },
  info(payload: LogPayload): void {
    log("info", payload);
  },
  warn(payload: LogPayload): void {
    log("warn", payload);
  },
  error(payload: LogPayload): void {
    log("error", payload);
  },
};
