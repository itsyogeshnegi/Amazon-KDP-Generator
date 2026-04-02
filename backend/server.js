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

  app.use((err, _req, res, _next) => {
    console.error(err);
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
