import { randomUUID } from "crypto";
import { generateSudoku } from "./generators/sudokuGenerator.js";
import { generateMaze } from "./generators/mazeGenerator.js";
import { generateCrossword } from "./generators/crosswordGenerator.js";
import { generateWordSearch } from "./generators/wordsearchGenerator.js";
import { generateTicTacToe } from "./generators/tictactoeGenerator.js";
import { createPdfBook } from "./pdf/pdfService.js";
import { ensureStorageReady, writeGenerationManifest } from "./storage/fileStore.js";

const VALID_TYPES = new Set(["sudoku", "maze", "crossword", "wordsearch", "tictactoe"]);
const VALID_DIFFICULTIES = new Set(["easy", "medium", "hard"]);
const VALID_LAYOUTS = new Set([1, 2, 4]);
const BOOK_SIZES = {
  "5x8": {
    pageSize: [360, 576],
    label: "5 x 8",
    margins: { top: 34, right: 34, bottom: 34, left: 34 }
  },
  "5.25x8": {
    pageSize: [378, 576],
    label: "5.25 x 8",
    margins: { top: 34, right: 34, bottom: 34, left: 34 }
  },
  "5.5x8.5": {
    pageSize: [396, 612],
    label: "5.5 x 8.5",
    margins: { top: 36, right: 36, bottom: 36, left: 36 }
  },
  "5.06x7.81": {
    pageSize: [364.32, 562.32],
    label: "5.06 x 7.81",
    margins: { top: 34, right: 34, bottom: 34, left: 34 }
  },
  "6.14x9.21": {
    pageSize: [442.08, 663.12],
    label: "6.14 x 9.21",
    margins: { top: 38, right: 38, bottom: 38, left: 38 }
  },
  "6.69x9.61": {
    pageSize: [481.68, 691.92],
    label: "6.69 x 9.61",
    margins: { top: 40, right: 40, bottom: 40, left: 40 }
  },
  "7x10": {
    pageSize: [504, 720],
    label: "7 x 10",
    margins: { top: 42, right: 42, bottom: 42, left: 42 }
  },
  "7.44x9.69": {
    pageSize: [535.68, 697.68],
    label: "7.44 x 9.69",
    margins: { top: 42, right: 42, bottom: 42, left: 42 }
  },
  "7.5x9.25": {
    pageSize: [540, 666],
    label: "7.5 x 9.25",
    margins: { top: 40, right: 40, bottom: 40, left: 40 }
  },
  "8.5x11": {
    pageSize: [612, 792],
    label: "8.5 x 11",
    margins: { top: 54, right: 54, bottom: 54, left: 54 }
  },
  "8x10": {
    pageSize: [576, 720],
    label: "8 x 10",
    margins: { top: 48, right: 48, bottom: 48, left: 48 }
  },
  "6x9": {
    pageSize: [432, 648],
    label: "6 x 9",
    margins: { top: 40, right: 40, bottom: 40, left: 40 }
  }
};
const BOOK_SIZE_VALUES = [
  "5x8",
  "5.25x8",
  "5.5x8.5",
  "6x9",
  "5.06x7.81",
  "6.14x9.21",
  "6.69x9.61",
  "7x10",
  "7.44x9.69",
  "7.5x9.25",
  "8x10",
  "8.5x11"
];

const generatorMap = {
  sudoku: generateSudoku,
  maze: generateMaze,
  crossword: generateCrossword,
  wordsearch: generateWordSearch,
  tictactoe: generateTicTacToe
};

/**
 * Validates the generate request and normalizes optional values.
 */
export function validateGenerateRequest(body, { preview }) {
  const type = body?.type;
  const difficulty = body?.difficulty;
  const count = Number(body?.count);
  const layoutValue = Number(body?.layout?.puzzlesPerPage ?? body?.layout ?? 1);
  const bookSizeValue = body?.bookSize || "8.5x11";
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

  if (!BOOK_SIZES[bookSizeValue]) {
    throw createHttpError(
      400,
      `Book size must be one of: ${BOOK_SIZE_VALUES.join(", ")}.`
    );
  }

  const sizeConfig = BOOK_SIZES[bookSizeValue];

  return {
    type,
    difficulty,
    count: preview ? Math.min(count, 2) : count,
    requestedCount: count,
    bookSize: bookSizeValue,
    cover: {
      bleed: true,
      paperType: "white"
    },
    layout: {
      puzzlesPerPage: layoutValue,
      pageSize: sizeConfig.pageSize,
      pageSizeLabel: sizeConfig.label,
      margins: sizeConfig.margins
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
  const fileName = `puzzle-book-interior-${manifestId}.pdf`;
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
    interiorPageCount: fileResult.interiorPageCount,
    jsonFileName: `${manifestId}.json`,
    pdfPath: fileResult.filePath,
    coverPdfPath: fileResult.coverPath,
    puzzles
  });

  return {
    manifestId,
    fileName,
    coverFileName: fileResult.coverFileName,
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
