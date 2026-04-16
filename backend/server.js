import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import swaggerUi from "swagger-ui-express";
import generateRoutes from "./routes/generateRoutes.js";
import { swaggerSpec } from "./swagger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 5000;
const corsConfig = buildCorsConfig();

export function createApp() {
  const app = express();

  app.use(createRequestLogger());
  app.use(
    cors({
      origin(origin, callback) {
        if (isAllowedOrigin(origin, corsConfig)) {
          callback(null, true);
          return;
        }

        callback(
          new Error(
            `CORS origin not allowed: ${origin || "unknown origin"}`
          )
        );
      }
    })
  );
  app.use(express.json({ limit: "2mb" }));
  app.use("/downloads", express.static(path.join(__dirname, "downloads")));
  app.get("/", (_req, res) => {
    res.redirect(302, "/api/docs/");
  });
  app.get(/^\/api\/docs$/, (_req, res) => {
    res.redirect(302, "/api/docs/");
  });
  app.get("/api/docs.json", (_req, res) => {
    res.json(swaggerSpec);
  });
  app.use(
    "/api/docs/",
    swaggerUi.serve,
    swaggerUi.setup(undefined, {
      customSiteTitle: "Amazon KDP Generator API Docs",
      swaggerOptions: {
        url: "/api/docs.json"
      }
    })
  );
  app.use("/api", generateRoutes);

  app.get("/api/health", (_req, res) => {
    res.json({ success: true, message: "Puzzle generator API is running." });
  });

  app.use((err, req, res, _next) => {
    const status = err.status || 500;
    const errorLog = {
      type: "api_error",
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl || req.url,
      status,
      ip: getClientIp(req),
      origin: req.get("origin") || null,
      referer: req.get("referer") || null,
      request: summarizeRequestBody(req.body),
      message: err.message || "Unexpected server error.",
      stack: err.stack || null
    };

    console.error(formatLog("ERROR", errorLog));
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Unexpected server error."
    });
  });

  return app;
}

if (process.argv[1] === __filename) {
  createApp().listen(PORT, () => {
    console.log(`Backend listening on http://localhost:${PORT}`);
  });
}

function buildAllowedOrigins() {
  return (process.env.FRONTEND_URL || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function buildCorsConfig() {
  const configuredOrigins = buildAllowedOrigins();
  const exactOrigins = new Set(configuredOrigins);

  return {
    exactOrigins,
    vercelHosts: configuredOrigins
      .map(getHostname)
      .filter((hostname) => hostname && hostname.endsWith(".vercel.app"))
  };
}

function isAllowedOrigin(origin, config) {
  if (!origin) {
    return true;
  }

  if (isLocalDevelopmentOrigin(origin)) {
    return true;
  }

  if (config.exactOrigins.has(origin)) {
    return true;
  }

  const hostname = getHostname(origin);
  if (!hostname) {
    return false;
  }

  return config.vercelHosts.includes(hostname);
}

function isLocalDevelopmentOrigin(origin) {
  const parsed = safelyParseUrl(origin);
  if (!parsed) {
    return false;
  }

  return (
    parsed.protocol === "http:" &&
    (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1")
  );
}

function getHostname(origin) {
  const parsed = safelyParseUrl(origin);
  return parsed ? parsed.hostname : "";
}

function safelyParseUrl(value) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function createRequestLogger() {
  return (req, res, next) => {
    const startedAt = Date.now();
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);
    let responseBody;

    res.json = (body) => {
      responseBody = body;
      return originalJson(body);
    };

    res.send = (body) => {
      if (responseBody === undefined) {
        responseBody = body;
      }
      return originalSend(body);
    };

    res.on("finish", () => {
      const path = req.originalUrl || req.url;
      if (!shouldLogRequest(path)) {
        return;
      }

      const logPayload = {
        type: "api_request",
        timestamp: new Date().toISOString(),
        method: req.method,
        path,
        status: res.statusCode,
        durationMs: Date.now() - startedAt,
        ip: getClientIp(req),
        origin: req.get("origin") || null,
        request: summarizeRequestBody(req.body),
        response: summarizeResponseBody(path, responseBody, res)
      };

      console.log(formatLog("INFO", logPayload));
    });

    next();
  };
}

function shouldLogRequest(pathname) {
  return pathname === "/" || pathname.startsWith("/api") || pathname.startsWith("/downloads");
}

function getClientIp(req) {
  const forwardedFor = req.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || "unknown";
}

function summarizeRequestBody(body) {
  if (!body || typeof body !== "object") {
    return null;
  }

  if (Array.isArray(body)) {
    return {
      type: "array",
      length: body.length
    };
  }

  const summary = {};
  for (const [key, value] of Object.entries(body)) {
    summary[key] = summarizeValue(value);
  }
  return summary;
}

function summarizeResponseBody(pathname, body, res) {
  if (pathname.startsWith("/api/downloads") || pathname.startsWith("/downloads")) {
    return {
      type: "download",
      fileName: decodeURIComponent(pathname.split("/").pop() || ""),
      contentType: res.getHeader("content-type") || null
    };
  }

  if (body == null) {
    return null;
  }

  if (typeof body === "string") {
    return {
      type: "text",
      preview: truncateValue(body, 160)
    };
  }

  if (Buffer.isBuffer(body)) {
    return {
      type: "buffer",
      bytes: body.length
    };
  }

  if (typeof body !== "object") {
    return body;
  }

  if (Array.isArray(body)) {
    return {
      type: "array",
      length: body.length
    };
  }

  if (pathname.includes("/generate/preview")) {
    return {
      success: body.success,
      previewCount: Array.isArray(body.preview) ? body.preview.length : 0,
      previewTitles: Array.isArray(body.preview)
        ? body.preview.map((item) => item?.meta?.title).filter(Boolean).slice(0, 3)
        : []
    };
  }

  if (pathname === "/api/generate") {
    return {
      success: body.success,
      manifestId: body.manifestId || null,
      totalPuzzles: body.totalPuzzles || 0,
      interiorFileName: body.interiorFileName || body.fileName || null,
      coverFileName: body.coverFileName || null
    };
  }

  if (pathname === "/api/health") {
    return {
      success: body.success,
      message: body.message
    };
  }

  return summarizeObject(body);
}

function summarizeObject(value) {
  const summary = {};
  for (const [key, nestedValue] of Object.entries(value).slice(0, 8)) {
    summary[key] = summarizeValue(nestedValue);
  }
  return summary;
}

function summarizeValue(value) {
  if (value == null) {
    return value;
  }

  if (typeof value === "string") {
    return truncateValue(value, 120);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    return {
      type: "array",
      length: value.length,
      sample: value.slice(0, 2).map((item) => summarizeValue(item))
    };
  }

  if (typeof value === "object") {
    return {
      type: "object",
      keys: Object.keys(value).slice(0, 6)
    };
  }

  return String(value);
}

function truncateValue(value, maxLength) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}...`;
}

function formatLog(level, payload) {
  return `[${level}] ${JSON.stringify(payload)}`;
}
