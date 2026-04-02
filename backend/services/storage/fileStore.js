import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "../..");
const dataDir = path.join(backendRoot, "data");
const downloadsDir = path.join(backendRoot, "downloads");

/**
 * Ensures the storage directories exist before generation begins.
 */
export async function ensureStorageReady() {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(downloadsDir, { recursive: true });
}

/**
 * Persists the manifest JSON so generated batches can be inspected locally.
 */
export async function writeGenerationManifest({
  id,
  createdAt,
  request,
  puzzleCount,
  jsonFileName,
  pdfPath,
  puzzles
}) {
  const targetPath = path.join(dataDir, jsonFileName);
  const payload = {
    id,
    createdAt,
    request,
    puzzleCount,
    jsonPath: targetPath,
    pdfPath,
    puzzles
  };

  await fs.writeFile(targetPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}
