import path from "path";
import { fileURLToPath } from "url";
import {
  createPreviewBatch,
  createPuzzleBook,
  validateGenerateRequest
} from "../services/puzzleService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..");

/**
 * Generates a small preview batch so the UI can render sample puzzles quickly.
 */
export async function generatePreview(req, res, next) {
  try {
    const payload = validateGenerateRequest(req.body, { preview: true });
    const preview = await createPreviewBatch(payload);

    res.json({
      success: true,
      preview
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Generates the requested puzzle batch, stores artifacts locally, and renders a PDF.
 */
export async function generatePdfBook(req, res, next) {
  try {
    const payload = validateGenerateRequest(req.body, { preview: false });
    const result = await createPuzzleBook(payload);

    res.json({
      success: true,
      fileUrl: `/api/downloads/${result.fileName}`,
      fileName: result.fileName,
      interiorFileUrl: `/api/downloads/${result.fileName}`,
      interiorFileName: result.fileName,
      coverFileUrl: result.coverFileName ? `/api/downloads/${result.coverFileName}` : null,
      coverFileName: result.coverFileName,
      manifestId: result.manifestId,
      totalPuzzles: result.totalPuzzles
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Streams a generated PDF file back to the client.
 */
export function downloadFile(req, res, next) {
  try {
    const targetPath = path.join(backendRoot, "downloads", req.params.fileName);
    res.download(targetPath);
  } catch (error) {
    next(error);
  }
}
