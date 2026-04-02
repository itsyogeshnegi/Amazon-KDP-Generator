import { randomUUID } from "crypto";
import { generateSudoku } from "./generators/sudokuGenerator.js";
import { generateMaze } from "./generators/mazeGenerator.js";
import { generateCrossword } from "./generators/crosswordGenerator.js";
import { createPdfBook } from "./pdf/pdfService.js";
import { ensureStorageReady, writeGenerationManifest } from "./storage/fileStore.js";

const VALID_TYPES = new Set(["sudoku", "maze", "crossword"]);
const VALID_DIFFICULTIES = new Set(["easy", "medium", "hard"]);
const VALID_LAYOUTS = new Set([1, 2, 4]);

const generatorMap = {
  sudoku: generateSudoku,
  maze: generateMaze,
  crossword: generateCrossword
};

/**
 * Validates the generate request and normalizes optional values.
 */
export function validateGenerateRequest(body, { preview }) {
  const type = body?.type;
  const difficulty = body?.difficulty;
  const count = Number(body?.count);
  const layoutValue = Number(body?.layout?.puzzlesPerPage ?? body?.layout ?? 1);
  const includeCoverPage = Boolean(body?.includeCoverPage ?? true);
  const theme = body?.theme || "general";

  if (!VALID_TYPES.has(type)) {
    throw createHttpError(400, "Unsupported puzzle type.");
  }

  if (!VALID_DIFFICULTIES.has(difficulty)) {
    throw createHttpError(400, "Unsupported difficulty.");
  }

  if (!Number.isInteger(count) || count < 1 || count > 100) {
    throw createHttpError(400, "Count must be an integer between 1 and 100.");
  }

  if (!VALID_LAYOUTS.has(layoutValue)) {
    throw createHttpError(400, "Layout must be 1, 2, or 4 puzzles per page.");
  }

  return {
    type,
    difficulty,
    count: preview ? Math.min(count, 2) : count,
    requestedCount: count,
    layout: {
      puzzlesPerPage: layoutValue,
      pageSize: "LETTER",
      margins: {
        top: 54,
        right: 54,
        bottom: 54,
        left: 54
      }
    },
    includeCoverPage,
    theme
  };
}

/**
 * Creates a lightweight preview payload for the frontend.
 */
export async function createPreviewBatch(config) {
  return buildPuzzleBatch(config);
}

/**
 * Creates the full puzzle book, writes JSON metadata, and renders the PDF.
 */
export async function createPuzzleBook(config) {
  await ensureStorageReady();
  const puzzles = await buildPuzzleBatch(config);
  const manifestId = randomUUID();
  const fileName = `puzzle-book-${manifestId}.pdf`;
  const fileResult = await createPdfBook({
    puzzles,
    request: config,
    fileName
  });

  await writeGenerationManifest({
    id: manifestId,
    createdAt: new Date().toISOString(),
    request: config,
    puzzleCount: puzzles.length,
    jsonFileName: `${manifestId}.json`,
    pdfPath: fileResult.filePath,
    puzzles
  });

  return {
    manifestId,
    fileName,
    totalPuzzles: puzzles.length
  };
}

/**
 * Builds a numbered batch of puzzles using the selected generator.
 */
async function buildPuzzleBatch(config) {
  const generator = generatorMap[config.type];

  return Array.from({ length: config.count }, (_value, index) => {
    const generated = generator({
      difficulty: config.difficulty,
      number: index + 1,
      theme: config.theme
    });

    return {
      id: randomUUID(),
      number: index + 1,
      type: config.type,
      difficulty: config.difficulty,
      ...generated
    };
  });
}

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}
