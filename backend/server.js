import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import generateRoutes from "./routes/generateRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use("/downloads", express.static(path.join(__dirname, "downloads")));
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

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
