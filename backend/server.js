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
const allowedOrigins = buildAllowedOrigins();

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error("CORS origin not allowed."));
      }
    })
  );
  app.use(express.json({ limit: "2mb" }));
  app.use("/downloads", express.static(path.join(__dirname, "downloads")));
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
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
  const configured = (process.env.FRONTEND_URL || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return new Set([
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    ...configured
  ]);
}
