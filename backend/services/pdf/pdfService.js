import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "../..");

// ─────────────────────────────────────────────────────────────
// PREMIUM PALETTES — richer, more saturated, with glow tones
// ─────────────────────────────────────────────────────────────
const PALETTES = {
  sudoku: {
    primary: "#C46A00",   // deep amber
    soft: "#FEF3E2",   // warm cream
    softAlt: "#FCDFA0",   // golden sand
    accent: "#7A3500",   // burnt sienna
    line: "#E8A84A",   // honey gold
    dark: "#3D1F00",   // espresso
    highlight: "#FFD166",   // sunflower
    muted: "#A87C4A"    // caramel
  },
  maze: {
    primary: "#0E8F7C",   // teal
    soft: "#D8F5EF",   // mint foam
    softAlt: "#A8E8DC",   // aquamarine
    accent: "#E86B3A",   // coral flame
    line: "#5DBFAD",   // seafoam
    dark: "#083D35",   // deep ocean
    highlight: "#2DD4C4",   // electric teal
    muted: "#3D8C7E"    // sage teal
  },
  crossword: {
    primary: "#3A4FD4",   // cobalt
    soft: "#EAF0FF",   // lavender mist
    softAlt: "#C0CEFF",   // periwinkle
    accent: "#1E2757",   // midnight blue
    line: "#7B92FF",   // cornflower
    dark: "#131B44",   // navy
    highlight: "#6FFFE9",   // cyan spark
    muted: "#5468C8"    // slate blue
  },
  wordsearch: {
    primary: "#5E8C00",   // forest green
    soft: "#EEF8D0",   // lime cream
    softAlt: "#C8E87A",   // spring green
    accent: "#D4920A",   // golden rod
    line: "#96C83A",   // grass
    dark: "#2A3D00",   // deep forest
    highlight: "#AAFF2E",   // electric lime
    muted: "#7AA820"    // olive
  },
  tictactoe: {
    primary: "#E8197A",   // hot pink
    soft: "#FFE8F4",   // blush
    softAlt: "#FFC0DC",   // rose
    accent: "#C00056",   // magenta
    line: "#FF7AB8",   // flamingo
    dark: "#5C0028",   // plum
    highlight: "#FF9DE2",   // bubblegum
    muted: "#D45090"    // dusty rose
  },
  answer: {
    primary: "#6B2FBF",   // royal purple
    soft: "#F0E8FF",   // lavender cloud
    softAlt: "#D8BBFF",   // wisteria
    accent: "#A855F7",   // violet
    line: "#C084FC",   // lilac
    dark: "#3B0B6E",   // deep violet
    highlight: "#E879F9",   // fuchsia
    muted: "#9055D4"    // medium purple
  }
};

// ─────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────
export async function createPdfBook({ puzzles, request, fileName }) {
  const downloadsDir = path.join(backendRoot, "downloads");
  const filePath = path.join(downloadsDir, fileName);
  const page = getPage(request);
  const doc = new PDFDocument({
    size: request.layout.pageSize,
    margins: request.layout.margins
  });

  await new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(filePath);
    stream.on("finish", resolve);
    stream.on("error", reject);
    doc.pipe(stream);

    if (request.includeCoverPage) {
      renderCoverPage(doc, request, puzzles.length, page);
      doc.addPage();
    }

    renderPuzzlePages(doc, puzzles, request.layout.puzzlesPerPage, request, page);
    doc.addPage();
    renderAnswerSection(doc, puzzles, request, page);

    if (request.includeCoverPage) {
      doc.addPage();
      renderBackCoverPage(doc, request, puzzles.length, page);
    }
    doc.end();
  });

  return { filePath };
}

// ─────────────────────────────────────────────────────────────
// COVER PAGE — premium editorial layout
// ─────────────────────────────────────────────────────────────
function renderCoverPage(doc, request, totalPuzzles, page) {
  const palette = getPalette(request.type);

  // Rich layered background
  paintPageBase(doc, palette.soft);
  drawDiagonalStripes(doc, palette, page);
  drawOuterChrome(doc, palette, page);

  const frameInset = Math.max(28, Math.min(42, page.width * 0.055));
  const frame = {
    x: frameInset,
    y: frameInset,
    width: page.width - frameInset * 2,
    height: page.height - frameInset * 2
  };

  // Outer frame with thick decorative border
  drawDecorativeFrame(doc, frame, palette);
  drawRoundedPanel(doc, frame, palette, 28, "#FFFFFF");

  const inner = inset(frame, 28);
  const footerHeight = 52;
  const gutter = 24;
  const left = {
    x: inner.x,
    y: inner.y,
    width: Math.min(256, inner.width * 0.47),
    height: inner.height - footerHeight
  };
  const right = {
    x: left.x + left.width + gutter,
    y: inner.y + 48,
    width: inner.width - left.width - gutter,
    height: inner.height - footerHeight - 56
  };

  // Author badge — pill with gradient feel
  drawPremiumRibbon(doc, left.x, left.y + 8, Math.min(224, left.width), 24, palette.primary, "✦ YOGESH NEGI");

  // Title area
  const titleY = left.y + 62;
  const title = "Puzzle Book Export";
  const subtitle =
    "Crafted for clean print-ready exports with richer layouts, stronger branding, and stable puzzle presentation.";

  doc.font("Helvetica-Bold").fontSize(28);
  const titleHeight = doc.heightOfString(title, { width: left.width, lineGap: 3 });

  // Title with decorative underline bar
  doc.fillColor(palette.dark)
    .font("Helvetica-Bold")
    .fontSize(28)
    .text(title, left.x, titleY, { width: left.width, lineGap: 3, align: "left" });

  drawAccentBar(doc, left.x, titleY + titleHeight + 4, Math.min(80, left.width * 0.4), palette);

  const subtitleY = titleY + titleHeight + 18;
  doc.font("Helvetica").fontSize(12);
  const subtitleHeight = doc.heightOfString(subtitle, { width: left.width, lineGap: 5 });

  doc.fillColor("#4A5570")
    .font("Helvetica")
    .fontSize(12)
    .text(subtitle, left.x, subtitleY, { width: left.width, lineGap: 5 });

  drawSummaryCard(
    doc,
    {
      x: left.x,
      y: subtitleY + subtitleHeight + 30,
      width: left.width,
      height: 188
    },
    palette,
    [
      ["Type", formatPuzzleType(request.type)],
      ["Difficulty", capitalize(request.difficulty)],
      ["Puzzles", String(totalPuzzles)],
      ["Layout", `${request.layout.puzzlesPerPage} per page`],
      ...(["crossword", "wordsearch"].includes(request.type) ? [["Theme", capitalize(request.theme)]] : [])
    ]
  );

  drawCoverArt(doc, right, palette, request.type);

  // Footer divider line
  const footerY = frame.y + frame.height - 38;
  drawThinRule(doc, frame.x + 28, footerY - 8, frame.width - 56, palette.line);

  doc.fillColor("#6B7590")
    .font("Helvetica")
    .fontSize(10.5)
    .text(`Formatted for ${request.layout.pageSizeLabel} inch print-safe output.`, left.x, footerY, { width: 260 });

  doc.fillColor(palette.primary)
    .font("Helvetica-Bold")
    .fontSize(11.5)
    .text("Colorful. Clean. KDP-friendly.", left.x, footerY + 17, { width: 220 });
}

// ─────────────────────────────────────────────────────────────
// PUZZLE PAGES
// ─────────────────────────────────────────────────────────────
function renderPuzzlePages(doc, puzzles, puzzlesPerPage, request, page) {
  const groups = chunk(puzzles, puzzlesPerPage);

  groups.forEach((group, groupIndex) => {
    if (groupIndex > 0) doc.addPage();

    const palette = getPalette(group[0]?.type || request.type);
    paintPageBase(doc, "#FFFDF8");
    drawSubtleGrid(doc, palette, page);
    drawPageChrome(doc, palette, "Puzzles", `Page ${groupIndex + 1}`, page);

    group.forEach((puzzle, index) => {
      const region = getRegion(doc, puzzlesPerPage, index, page);
      renderPuzzleBlock(doc, puzzle, region, false, puzzlesPerPage);
    });
  });
}

// ─────────────────────────────────────────────────────────────
// ANSWER SECTION
// ─────────────────────────────────────────────────────────────
function renderAnswerSection(doc, puzzles, request, page) {
  const palette = PALETTES.answer;
  paintPageBase(doc, "#FAF5FF");
  drawSubtleGrid(doc, palette, page);
  drawPageChrome(
    doc,
    palette,
    "Answer Key",
    request.type === "tictactoe" ? "Free play pages" : `${formatPuzzleType(request.type)} solutions`,
    page
  );

  doc.fillColor(palette.dark)
    .font("Helvetica-Bold")
    .fontSize(30)
    .text(request.type === "tictactoe" ? "Free Play Guide" : "Solutions & Answer Guide", 60, 116, { width: 480 });

  drawAccentBar(doc, 60, 154, 64, palette);

  doc.fillColor("#5F5A75")
    .font("Helvetica")
    .fontSize(12)
    .text(
      request.type === "tictactoe"
        ? "Tic-Tac-Toe pages are open-play activity sheets, so this section keeps the book structure without adding fake answers."
        : "Each solution page uses the same stable grid system with clearer contrast and cleaner spacing.",
      60,
      164,
      { width: 480, lineGap: 4 }
    );

  drawPremiumRibbon(doc, 60, 214, 178, 24, palette.primary,
    request.type === "tictactoe" ? "✦ FREE PLAY NOTE" : "✦ SOLVED PAGES");

  if (request.type === "tictactoe") {
    doc.fillColor(palette.primary)
      .font("Helvetica-Bold")
      .fontSize(18)
      .text("No answer key is needed for Tic-Tac-Toe.", 60, 270, { width: 440 });

    doc.fillColor("#5F5A75")
      .font("Helvetica")
      .fontSize(12)
      .text(
        "Use each board for repeated play, classroom activities, and family game time. The export still closes with a polished back page for a complete KDP-friendly flow.",
        60,
        298,
        { width: 440, lineGap: 4 }
      );
    return;
  }

  puzzles.forEach((puzzle, index) => {
    doc.addPage();
    paintPageBase(doc, "#FFFFFF");
    drawSubtleGrid(doc, palette, page);
    drawPageChrome(doc, palette, "Answer Key", `Solution ${index + 1}`, page);

    renderPuzzleBlock(
      doc,
      puzzle,
      {
        x: doc.page.margins.left,
        y: 92,
        width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
        height: doc.page.height - 138
      },
      true,
      1
    );
  });
}

// ─────────────────────────────────────────────────────────────
// PUZZLE BLOCK — container for each puzzle
// ─────────────────────────────────────────────────────────────
function renderPuzzleBlock(doc, puzzle, region, isSolution, puzzlesPerPage) {
  const palette = isSolution ? PALETTES.answer : getPalette(puzzle.type);
  const compact = puzzlesPerPage > 1;

  // Shadow layer for depth
  drawShadowPanel(doc, region, compact ? 18 : 24);
  drawRoundedPanel(doc, region, palette, compact ? 18 : 24, "#FFFFFF");
  drawPanelTopAccent(doc, region, palette, compact ? 18 : 24);

  const metrics = drawBlockHeader(doc, puzzle, region, palette, isSolution, compact);
  const content = {
    x: region.x + (compact ? 14 : 20),
    y: metrics.bottom + 10,
    width: region.width - (compact ? 28 : 40),
    height: region.y + region.height - metrics.bottom - (compact ? 36 : 44)
  };

  if (puzzle.type === "sudoku") {
    drawSudoku(doc, isSolution ? puzzle.solution : puzzle.puzzle, content, palette, isSolution);
  } else if (puzzle.type === "maze") {
    drawMaze(doc, isSolution ? { ...puzzle.puzzle, path: puzzle.solution } : puzzle.puzzle, content, palette, isSolution);
  } else if (puzzle.type === "crossword") {
    drawCrossword(doc, puzzle, content, palette, isSolution, compact);
  } else if (puzzle.type === "wordsearch") {
    drawWordSearch(doc, puzzle, content, palette, isSolution, compact);
  } else if (puzzle.type === "tictactoe") {
    drawTicTacToe(doc, isSolution ? puzzle.solution : puzzle.puzzle, content, palette, compact);
  }

  drawFooterTag(doc, region, palette, isSolution ? "Solution Page" : "Puzzle Page", compact);
}

// ─────────────────────────────────────────────────────────────
// SUDOKU
// ─────────────────────────────────────────────────────────────
function drawSudoku(doc, board, content, palette, isSolution) {
  const safeHeight = Math.max(120, content.height - 10);
  const size = Math.max(120, Math.min(content.width, safeHeight));
  const startX = content.x + (content.width - size) / 2;
  const startY = content.y + (safeHeight - size) / 2;
  const cell = size / 9;

  // Outer glow frame
  doc.save()
    .roundedRect(startX - 10, startY - 10, size + 20, size + 20, 16)
    .fillOpacity(0.12)
    .fill(palette.primary)
    .restore();

  // Alternating 3×3 box fills
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      if ((boxRow + boxCol) % 2 !== 0) continue;
      doc.save()
        .roundedRect(startX + boxCol * cell * 3, startY + boxRow * cell * 3, cell * 3, cell * 3, 5)
        .fillOpacity(0.22)
        .fill(palette.softAlt)
        .restore();
    }
  }

  // Grid lines — thick for 3×3 borders, thin for cells
  for (let row = 0; row <= 9; row++) {
    const isBox = row % 3 === 0;
    doc.strokeColor(isBox ? palette.accent : palette.line)
      .lineWidth(isBox ? 2.2 : 0.6);
    doc.moveTo(startX, startY + row * cell).lineTo(startX + size, startY + row * cell).stroke();
    doc.moveTo(startX + row * cell, startY).lineTo(startX + row * cell, startY + size).stroke();
  }

  // Numbers
  board.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      if (!value) return;
      const cx = startX + colIndex * cell;
      const cy = startY + rowIndex * cell;

      // Cell highlight for solution numbers
      if (isSolution) {
        doc.save()
          .roundedRect(cx + 1, cy + 1, cell - 2, cell - 2, 3)
          .fillOpacity(0.15)
          .fill(palette.highlight)
          .restore();
      }

      doc.fillColor(isSolution ? palette.primary : palette.dark)
        .font("Helvetica-Bold")
        .fontSize(Math.max(8, Math.min(13, cell * 0.44)))
        .text(String(value), cx, cy + cell * 0.2, { width: cell, align: "center" });
    });
  });
}

// ─────────────────────────────────────────────────────────────
// MAZE
// ─────────────────────────────────────────────────────────────
function drawMaze(doc, maze, content, palette, showSolution) {
  const size = Math.max(120, Math.min(content.width, content.height));
  const startX = content.x + (content.width - size) / 2;
  const startY = content.y + (content.height - size) / 2;
  const cell = size / maze.rows;
  const framePad = Math.max(10, Math.min(16, cell * 0.7));

  // Background panel
  doc.save()
    .roundedRect(startX - framePad, startY - framePad, size + framePad * 2, size + framePad * 2, 20)
    .fillOpacity(0.2)
    .fill(palette.soft)
    .restore();

  // Outer border accent
  doc.save()
    .roundedRect(startX - framePad, startY - framePad, size + framePad * 2, size + framePad * 2, 20)
    .lineWidth(2)
    .stroke(palette.line)
    .restore();

  // Maze walls
  doc.strokeColor(palette.accent);
  maze.cells.forEach((row, rowIndex) => {
    row.forEach((cellWalls, colIndex) => {
      const x = startX + colIndex * cell;
      const y = startY + rowIndex * cell;
      const lw = Math.max(0.9, Math.min(1.6, cell * 0.09));
      doc.lineWidth(lw);
      if (cellWalls.top) doc.moveTo(x, y).lineTo(x + cell, y).stroke();
      if (cellWalls.right) doc.moveTo(x + cell, y).lineTo(x + cell, y + cell).stroke();
      if (cellWalls.bottom) doc.moveTo(x, y + cell).lineTo(x + cell, y + cell).stroke();
      if (cellWalls.left) doc.moveTo(x, y).lineTo(x, y + cell).stroke();
    });
  });

  // Start / End markers
  drawMarker(doc, startX + cell / 2, startY + cell / 2, "#0DAA76", "S", Math.max(8, cell * 0.4));
  drawMarker(doc, startX + size - cell / 2, startY + size - cell / 2, palette.accent, "E", Math.max(8, cell * 0.4));

  // Solution path
  if (showSolution && maze.path) {
    doc.strokeColor(palette.highlight || "#FF4D4D")
      .lineWidth(Math.max(1.6, Math.min(2.8, cell * 0.2)))
      .lineCap("round");
    maze.path.forEach(([row, col], index) => {
      const px = startX + col * cell + cell / 2;
      const py = startY + row * cell + cell / 2;
      if (index === 0) doc.moveTo(px, py);
      else doc.lineTo(px, py);
    });
    doc.stroke();
  }
}

// ─────────────────────────────────────────────────────────────
// CROSSWORD
// ─────────────────────────────────────────────────────────────
function drawCrossword(doc, crossword, content, palette, isSolution, compact) {
  const grid = isSolution
    ? crossword.solution.grid
    : crossword.puzzle.mask.map((row, rowIndex) =>
      row.map((filled, colIndex) => (filled ? crossword.puzzle.grid[rowIndex][colIndex] : "#"))
    );

  const totalWidth = content.width;
  const totalHeight = content.height;
  const stackLayout = compact || totalWidth < 330;
  const gap = stackLayout ? 14 : 22;
  const gridAreaWidth = stackLayout ? totalWidth : Math.min(totalWidth * 0.5, totalWidth - 160);
  const gridSize = Math.max(90, Math.min(gridAreaWidth, stackLayout ? totalHeight * 0.42 : totalHeight * 0.75));
  const gridX = content.x;
  const gridY = content.y;
  const clueX = stackLayout ? content.x : gridX + gridSize + gap;
  const clueY = stackLayout ? gridY + gridSize + gap : gridY;
  const clueWidth = stackLayout ? totalWidth : totalWidth - gridSize - gap;
  const clueHeight = stackLayout ? totalHeight - gridSize - gap : totalHeight;
  const cell = gridSize / grid.length;
  const numberLookup = new Map(crossword.puzzle.numbering.map((item) => [`${item.row},${item.col}`, item.number]));

  // Grid background panel
  doc.save()
    .roundedRect(gridX - 10, gridY - 10, gridSize + 20, gridSize + 20, 18)
    .fillOpacity(0.18)
    .fill(palette.soft)
    .restore();

  doc.save()
    .roundedRect(gridX - 10, gridY - 10, gridSize + 20, gridSize + 20, 18)
    .lineWidth(1.5)
    .stroke(palette.line)
    .restore();

  grid.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      const x = gridX + colIndex * cell;
      const y = gridY + rowIndex * cell;

      if (value === "#") {
        // Filled cell with subtle pattern
        doc.save().roundedRect(x, y, cell, cell, 2).fill(palette.dark).restore();
        // Tiny diagonal lines for texture
        doc.save()
          .roundedRect(x, y, cell, cell, 2)
          .fillOpacity(0.1)
          .fill(palette.accent)
          .restore();
        return;
      }

      // White cell with border
      doc.save().roundedRect(x, y, cell, cell, 2).fill("#FFFFFF").restore();
      doc.strokeColor(palette.line).lineWidth(0.65).roundedRect(x, y, cell, cell, 2).stroke();

      const number = numberLookup.get(`${rowIndex},${colIndex}`);
      if (number) {
        doc.fillColor(palette.muted || "#51607C")
          .font("Helvetica-Bold")
          .fontSize(Math.max(4, cell * 0.18))
          .text(String(number), x + 1.5, y + 1.5, { width: cell - 3 });
      }

      if (isSolution) {
        doc.fillColor(palette.primary)
          .font("Helvetica-Bold")
          .fontSize(Math.max(7, Math.min(12, cell * 0.44)))
          .text(value, x, y + cell * 0.2, { width: cell, align: "center" });
      }
    });
  });

  drawCluePanel(doc, { x: clueX, y: clueY, width: clueWidth, height: clueHeight }, crossword.puzzle.clues, palette);
}

// ─────────────────────────────────────────────────────────────
// WORD SEARCH
// ─────────────────────────────────────────────────────────────
function drawWordSearch(doc, wordSearch, content, palette, isSolution, compact) {
  const board = isSolution ? wordSearch.solution : wordSearch.puzzle;
  const listHeight = Math.min(compact ? 74 : 96, Math.max(58, content.height * 0.22));
  const boardHeight = content.height - listHeight - 14;
  const boardSize = Math.max(120, Math.min(content.width, boardHeight));
  const startX = content.x + (content.width - boardSize) / 2;
  const startY = content.y;
  const cell = boardSize / board.size;
  const highlightMap = new Map();

  if (isSolution) {
    board.highlights.forEach((highlight, index) => {
      highlight.path.forEach(([row, col]) => {
        highlightMap.set(`${row},${col}`, index);
      });
    });
  }

  // Board frame
  doc.save()
    .roundedRect(startX - 10, startY - 10, boardSize + 20, boardSize + 20, 18)
    .fillOpacity(0.2)
    .fill(palette.soft)
    .restore();

  doc.save()
    .roundedRect(startX - 10, startY - 10, boardSize + 20, boardSize + 20, 18)
    .lineWidth(1.5)
    .stroke(palette.line)
    .restore();

  for (let row = 0; row < board.size; row++) {
    for (let col = 0; col < board.size; col++) {
      const x = startX + col * cell;
      const y = startY + row * cell;
      const isHighlighted = highlightMap.has(`${row},${col}`);

      doc.save()
        .roundedRect(x, y, cell, cell, Math.max(2, cell * 0.1))
        .fill(isHighlighted ? palette.softAlt : "#FFFFFF")
        .restore();

      doc.strokeColor(palette.line).lineWidth(0.6)
        .roundedRect(x, y, cell, cell, Math.max(2, cell * 0.1)).stroke();

      doc.fillColor(isHighlighted ? palette.dark : "#3A4560")
        .font("Helvetica-Bold")
        .fontSize(Math.max(6, Math.min(13, cell * 0.44)))
        .text(board.grid[row][col], x, y + cell * 0.2, { width: cell, align: "center" });
    }
  }

  drawWordList(
    doc,
    board.words,
    { x: content.x, y: startY + boardSize + 14, width: content.width, height: listHeight },
    palette
  );
}

// ─────────────────────────────────────────────────────────────
// TIC-TAC-TOE
// ─────────────────────────────────────────────────────────────
function drawTicTacToe(doc, tictactoe, content, palette, compact) {
  const boardCount = tictactoe.boardsPerPage || tictactoe.boards.length;
  const columns = compact ? (boardCount >= 4 ? 2 : 1) : boardCount >= 9 ? 3 : boardCount >= 6 ? 3 : 2;
  const rows = Math.ceil(boardCount / columns);
  const gap = compact ? 12 : 16;
  const subtitleOffset = compact ? 26 : 38;
  const boardAreaHeight = content.height - subtitleOffset;
  const boardSize = Math.min(
    (content.width - gap * (columns - 1)) / columns,
    (boardAreaHeight - gap * (rows - 1)) / rows
  );
  const totalWidth = columns * boardSize + gap * (columns - 1);
  const totalHeight = rows * boardSize + gap * (rows - 1);
  const originX = content.x + (content.width - totalWidth) / 2;
  const originY = content.y + subtitleOffset + Math.max(0, (boardAreaHeight - totalHeight) / 2);

  if (tictactoe.subtitle) {
    doc.fillColor(palette.muted || "#6D4A5E")
      .font("Helvetica")
      .fontSize(compact ? 8.5 : 10.5)
      .text(tictactoe.subtitle, content.x, content.y, { width: content.width, align: "center" });
  }

  tictactoe.boards.forEach((board, index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;
    drawTicTacToeBoard(
      doc,
      {
        x: originX + col * (boardSize + gap),
        y: originY + row * (boardSize + gap),
        size: boardSize
      },
      palette,
      board.id
    );
  });
}

// ─────────────────────────────────────────────────────────────
// CLUE PANEL
// ─────────────────────────────────────────────────────────────
function drawCluePanel(doc, box, clues, palette) {
  drawShadowPanel(doc, box, 14);
  drawRoundedPanel(doc, box, palette, 16, "#FFFFFF");
  drawPanelTopAccent(doc, box, palette, 16);
  drawPremiumRibbon(doc, box.x + 14, box.y + 12, Math.min(94, box.width - 28), 20, palette.primary, "✦ CLUES");

  const left = box.x + 16;
  const width = box.width - 32;
  const halfY = box.y + box.height / 2;

  doc.fillColor(palette.dark).font("Helvetica-Bold").fontSize(11.5).text("Across", left, box.y + 44, { width });
  drawThinRule(doc, left, box.y + 58, width - 8, palette.line);
  doc.font("Helvetica").fontSize(8.5).fillColor("#4A5570");

  let offsetY = box.y + 64;
  const acrossBottomLimit = halfY - 14;
  for (const clue of clues.across) {
    const text = `${clue.number}. ${clue.clue} (${clue.answerLength})`;
    const nextHeight = doc.heightOfString(text, { width, lineGap: 1 });
    if (offsetY + nextHeight > acrossBottomLimit) break;
    doc.text(text, left, offsetY, { width, lineGap: 1 });
    offsetY = doc.y + 4;
  }

  const downStart = Math.max(halfY, offsetY + 10);
  doc.fillColor(palette.dark).font("Helvetica-Bold").fontSize(11.5).text("Down", left, downStart, { width });
  drawThinRule(doc, left, downStart + 14, width - 8, palette.line);
  offsetY = downStart + 20;
  doc.font("Helvetica").fontSize(8.5).fillColor("#4A5570");

  const downBottomLimit = box.y + box.height - 16;
  for (const clue of clues.down) {
    const text = `${clue.number}. ${clue.clue} (${clue.answerLength})`;
    const nextHeight = doc.heightOfString(text, { width, lineGap: 1 });
    if (offsetY + nextHeight > downBottomLimit) break;
    doc.text(text, left, offsetY, { width, lineGap: 1 });
    offsetY = doc.y + 4;
  }
}

// ─────────────────────────────────────────────────────────────
// PAGE CHROME — header bar
// ─────────────────────────────────────────────────────────────
function drawPageChrome(doc, palette, sectionLabel, trailingLabel, page) {
  // Header band with gradient-like layering
  doc.save().rect(0, 0, page.width, 50).fill(palette.soft).restore();
  doc.save().rect(0, 46, page.width, 4).fill(palette.line).restore();

  // Decorative left accent bar
  doc.save().rect(0, 0, 6, 50).fill(palette.primary).restore();

  // Section label
  doc.fillColor(palette.primary)
    .font("Helvetica-Bold")
    .fontSize(10.5)
    .text(sectionLabel.toUpperCase(), 22, 18);

  // Small dot separator
  doc.fillColor(palette.line)
    .font("Helvetica-Bold")
    .fontSize(10.5)
    .text("·", 22 + sectionLabel.length * 7.2 + 6, 18);

  doc.fillColor(palette.muted || "#657089")
    .font("Helvetica")
    .fontSize(10)
    .text(trailingLabel, page.width - 164, 19, { width: 128, align: "right" });

  // Page bottom footer line
  doc.save()
    .moveTo(28, page.height - 24)
    .lineTo(page.width - 28, page.height - 24)
    .lineWidth(0.6)
    .stroke(palette.line)
    .restore();
}

// ─────────────────────────────────────────────────────────────
// BLOCK HEADER
// ─────────────────────────────────────────────────────────────
function drawBlockHeader(doc, puzzle, region, palette, isSolution, compact) {
  const padding = compact ? 14 : 20;
  const ribbonWidth = compact ? 80 : 100;
  const baseY = region.y + padding;
  const titleY = baseY + (compact ? 26 : 30);
  const titleSize = compact ? 13.5 : 19;
  const chipY = titleY + titleSize + 10;

  drawPremiumRibbon(
    doc,
    region.x + padding,
    baseY,
    ribbonWidth,
    compact ? 18 : 22,
    palette.primary,
    (isSolution ? "✓ SOLUTION" : `✦ ${formatPuzzleType(puzzle.type)}`).toUpperCase()
  );

  doc.fillColor(palette.dark)
    .font("Helvetica-Bold")
    .fontSize(titleSize)
    .text(`${puzzle.meta.title}${isSolution ? " Solution" : ""}`, region.x + padding, titleY, {
      width: region.width - padding * 2
    });

  const chips = [
    `Puzzle #${puzzle.number}`,
    capitalize(puzzle.difficulty),
    ...(puzzle.meta.theme ? [capitalize(puzzle.meta.theme)] : [])
  ];

  let chipX = region.x + padding;
  let currentY = chipY;
  const chipHeight = compact ? 17 : 20;
  const maxRight = region.x + region.width - padding;

  for (const chip of chips) {
    const chipWidth = measureChipWidth(chip);
    if (chipX + chipWidth > maxRight) {
      chipX = region.x + padding;
      currentY += chipHeight + 6;
    }
    drawChip(doc, chipX, currentY, chip, palette, compact);
    chipX += chipWidth + 9;
  }

  return { bottom: currentY + chipHeight };
}

// ─────────────────────────────────────────────────────────────
// FOOTER TAG
// ─────────────────────────────────────────────────────────────
function drawFooterTag(doc, region, palette, label, compact) {
  const y = region.y + region.height - (compact ? 18 : 22);
  drawThinRule(doc, region.x + 14, y - 5, region.width - 28, palette.line);

  doc.fillColor("#6A7286")
    .font("Helvetica")
    .fontSize(compact ? 7.5 : 9)
    .text(label, region.x + 14, y);

  doc.fillColor(palette.primary)
    .font("Helvetica-Bold")
    .fontSize(compact ? 7.5 : 9)
    .text("Yogesh Negi", region.x + region.width - 108, y, { width: 92, align: "right" });
}

// ─────────────────────────────────────────────────────────────
// SUMMARY CARD
// ─────────────────────────────────────────────────────────────
function drawSummaryCard(doc, box, palette, rows) {
  drawShadowPanel(doc, box, 20);
  drawRoundedPanel(doc, box, palette, 22, "#FFFFFF");
  drawPanelTopAccent(doc, box, palette, 22);

  let offsetY = box.y + 22;
  for (const [label, value] of rows) {
    // Alternating row background
    if (rows.indexOf([label, value]) % 2 === 0) {
      doc.save()
        .roundedRect(box.x + 10, offsetY - 2, box.width - 20, 30, 6)
        .fillOpacity(0.06)
        .fill(palette.primary)
        .restore();
    }

    doc.fillColor(palette.muted || "#6C7485")
      .font("Helvetica-Bold")
      .fontSize(8.5)
      .text(label.toUpperCase(), box.x + 18, offsetY);

    doc.fillColor(palette.dark)
      .font("Helvetica-Bold")
      .fontSize(15.5)
      .text(value, box.x + 18, offsetY + 12, { width: box.width - 36 });

    offsetY += 34;
    if (offsetY > box.y + box.height - 26) break;
  }
}

// ─────────────────────────────────────────────────────────────
// BACK COVER
// ─────────────────────────────────────────────────────────────
function renderBackCoverPage(doc, request, totalPuzzles, page) {
  const palette = getPalette(request.type);
  paintPageBase(doc, palette.soft);
  drawDiagonalStripes(doc, palette, page);
  drawOuterChrome(doc, palette, page);

  const frameInset = Math.max(32, Math.min(44, page.width * 0.065));
  const frame = {
    x: frameInset,
    y: frameInset,
    width: page.width - frameInset * 2,
    height: page.height - frameInset * 2
  };

  drawDecorativeFrame(doc, frame, palette);
  drawRoundedPanel(doc, frame, palette, 30, "#FFFFFF");

  drawPremiumRibbon(doc, frame.x + 30, frame.y + 26, 190, 24, palette.primary, "✦ YOGESH NEGI");

  doc.fillColor(palette.dark)
    .font("Helvetica-Bold")
    .fontSize(30)
    .text("Made for fresh puzzle moments.", frame.x + 30, frame.y + 82, { width: 330, lineGap: 3 });

  drawAccentBar(doc, frame.x + 30, frame.y + 130, 72, palette);

  doc.fillColor("#51607A")
    .font("Helvetica")
    .fontSize(12)
    .text(
      `This ${formatPuzzleType(request.type).toLowerCase()} edition includes ${totalPuzzles} print-ready pages designed for Amazon KDP interiors, family play, and clean at-home printing.`,
      frame.x + 30,
      frame.y + 148,
      { width: 316, lineGap: 5 }
    );

  drawBackCoverArt(doc, {
    x: frame.x + frame.width - 174,
    y: frame.y + 148,
    width: 122,
    height: 152
  }, palette, request.type);

  drawSummaryCard(
    doc,
    { x: frame.x + 30, y: frame.y + 278, width: 256, height: 162 },
    palette,
    [
      ["Edition", formatPuzzleType(request.type)],
      ["Difficulty", capitalize(request.difficulty)],
      ["Layout", `${request.layout.puzzlesPerPage} per page`],
      ["Author", "Yogesh Negi"]
    ]
  );

  drawThinRule(doc, frame.x + 30, frame.y + frame.height - 106, frame.width - 60, palette.line);

  doc.fillColor(palette.primary)
    .font("Helvetica-Bold")
    .fontSize(15.5)
    .text("Designed for bright, friendly puzzle books.", frame.x + 30, frame.y + frame.height - 96, {
      width: frame.width - 60
    });

  doc.fillColor("#5E6678")
    .font("Helvetica")
    .fontSize(11)
    .text(
      "Interior back page for print-safe exports and polished KDP-ready presentation.",
      frame.x + 30,
      frame.y + frame.height - 70,
      { width: frame.width - 60 }
    );
}

// ─────────────────────────────────────────────────────────────
// COVER ART — decorative right panel
// ─────────────────────────────────────────────────────────────
function drawCoverArt(doc, box, palette, type) {
  drawShadowPanel(doc, box, 24);
  drawRoundedPanel(doc, box, palette, 26, "#FFFFFF");
  drawPanelTopAccent(doc, box, palette, 26);

  const inner = inset(box, 20);

  if (type === "sudoku") {
    const cols = 5, rows = 5, gap = 9;
    const cell = Math.min(27, (inner.width - gap * (cols - 1)) / cols);
    const totalWidth = cols * cell + (cols - 1) * gap;
    const totalHeight = rows * cell + (rows - 1) * gap;
    const sx = inner.x + (inner.width - totalWidth) / 2;
    const sy = inner.y + 12;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const fill = (r + c) % 2 === 0 ? palette.softAlt : palette.soft;
        doc.save()
          .roundedRect(sx + c * (cell + gap), sy + r * (cell + gap), cell, cell, 7)
          .fill(fill)
          .restore();
        doc.save()
          .roundedRect(sx + c * (cell + gap), sy + r * (cell + gap), cell, cell, 7)
          .lineWidth(0.8)
          .stroke(palette.line)
          .restore();
      }
    }

    // Bold 3x3 dividers
    for (let line = 1; line <= 2; line++) {
      const lx = sx + (line * (cell + gap) * 5) / 3 - gap / 2;
      doc.strokeColor(palette.accent).lineWidth(2)
        .moveTo(lx, sy - 4).lineTo(lx, sy + totalHeight + 4).stroke();
      const ly = sy + (line * (cell + gap) * 5) / 3 - gap / 2;
      doc.moveTo(sx - 4, ly).lineTo(sx + totalWidth + 4, ly).stroke();
    }

  } else if (type === "maze") {
    const segW = Math.min(50, inner.width * 0.3);
    for (let i = 0; i < 8; i++) {
      const y = inner.y + 10 + i * 22;
      const x = inner.x + 16 + (i % 2) * 24;
      doc.strokeColor(palette.line).lineWidth(3)
        .lineCap("round")
        .moveTo(x, y).lineTo(x + segW, y).stroke()
        .moveTo(x + segW, y).lineTo(x + segW, y + 16).stroke();
    }
    drawMarker(doc, inner.x + 28, inner.y + 16, "#0DAA76", "S", 9);
    drawMarker(doc, inner.x + inner.width - 28, inner.y + inner.height - 48, palette.accent, "E", 9);

  } else if (type === "wordsearch") {
    const size = 6;
    const cell = Math.min(28, (inner.width - 24) / size);
    const total = size * cell;
    const sx = inner.x + (inner.width - total) / 2;
    const sy = inner.y + 12;

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const x = sx + c * cell;
        const y = sy + r * cell;
        const fill = (r + c) % 4 === 0 ? palette.accent :
          (r + c) % 2 === 0 ? palette.softAlt : "#FFFFFF";
        doc.save().roundedRect(x, y, cell - 3, cell - 3, 4).fill(fill).restore();
        doc.save().roundedRect(x, y, cell - 3, cell - 3, 4).lineWidth(0.6).stroke(palette.line).restore();
      }
    }

  } else if (type === "tictactoe") {
    drawTicTacToeBoard(
      doc,
      { x: inner.x + (inner.width - 90) / 2, y: inner.y + 20, size: 90 },
      palette,
      "X/O"
    );
    // Decorative circles
    doc.save().circle(inner.x + 26, inner.y + inner.height - 54, 12).fillOpacity(0.18).fill(palette.primary).restore();
    doc.save().circle(inner.x + inner.width - 30, inner.y + inner.height - 94, 16).fillOpacity(0.24).fill(palette.accent).restore();

  } else {
    // Crossword grid preview
    const cols = 5, rows = 6, gap = 6;
    const cell = Math.min(22, (inner.width - gap * (cols - 1)) / cols);
    const sx = inner.x + (inner.width - (cols * cell + (cols - 1) * gap)) / 2;
    const sy = inner.y + 10;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const fill = (r + c) % 3 === 0 ? palette.dark :
          (r + c) % 2 === 0 ? "#FFFFFF" : palette.softAlt;
        doc.save()
          .roundedRect(sx + c * (cell + gap), sy + r * (cell + gap), cell, cell, 4)
          .fill(fill)
          .restore();
        doc.save()
          .roundedRect(sx + c * (cell + gap), sy + r * (cell + gap), cell, cell, 4)
          .lineWidth(0.5)
          .stroke(palette.line)
          .restore();
      }
    }
  }

  // Edition label at bottom of art panel
  drawThinRule(doc, box.x + 16, box.y + box.height - 52, box.width - 32, palette.line);
  doc.fillColor(palette.primary)
    .font("Helvetica-Bold")
    .fontSize(14)
    .text(`${formatPuzzleType(type)} Edition`, box.x + 18, box.y + box.height - 42, {
      width: box.width - 36,
      align: "left"
    });
}

// ─────────────────────────────────────────────────────────────
// BACK COVER ART
// ─────────────────────────────────────────────────────────────
function drawBackCoverArt(doc, box, palette, type) {
  const inner = box;

  if (type === "maze") {
    const segW = Math.min(44, inner.width * 0.28);
    for (let i = 0; i < 6; i++) {
      const y = inner.y + 14 + i * 24;
      const x = inner.x + 16 + (i % 2) * 18;
      doc.strokeColor(palette.line).lineWidth(3).lineCap("round")
        .moveTo(x, y).lineTo(x + segW, y).stroke()
        .moveTo(x + segW, y).lineTo(x + segW, y + 18).stroke();
    }
  } else if (type === "wordsearch") {
    const size = 5;
    const cell = Math.min(26, (inner.width - 20) / size);
    const total = size * cell;
    const sx = inner.x + (inner.width - total) / 2;
    const sy = inner.y + 16;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        doc.save()
          .roundedRect(sx + c * cell, sy + r * cell, cell - 4, cell - 4, 4)
          .fill((r + c) % 2 === 0 ? palette.softAlt : "#FFFFFF")
          .restore();
      }
    }
  } else if (type === "tictactoe") {
    drawTicTacToeBoard(
      doc,
      { x: inner.x + (inner.width - 88) / 2, y: inner.y + 24, size: 88 },
      palette,
      "FUN"
    );
  } else if (type === "sudoku") {
    return;
  } else {
    const cols = 4, rows = 5, cell = 24;
    const sx = inner.x + (inner.width - cols * cell) / 2;
    const sy = inner.y + 18;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        doc.save()
          .roundedRect(sx + c * cell, sy + r * cell, cell - 4, cell - 4, 4)
          .fill((r + c) % 3 === 0 ? palette.accent : "#FFFFFF")
          .restore();
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────
// DECORATIVE HELPERS
// ─────────────────────────────────────────────────────────────

/** Diagonal stripe background — very subtle texture */
function drawDiagonalStripes(doc, palette, page) {
  doc.save();
  doc.opacity(0.04);
  for (let i = -page.height; i < page.width + page.height; i += 28) {
    doc.strokeColor(palette.primary).lineWidth(10)
      .moveTo(i, 0).lineTo(i + page.height, page.height).stroke();
  }
  doc.restore();
}

/** Subtle dot grid for puzzle pages */
function drawSubtleGrid(doc, palette, page) {
  doc.save();
  doc.opacity(0.06);
  for (let x = 40; x < page.width - 20; x += 24) {
    for (let y = 60; y < page.height - 20; y += 24) {
      doc.circle(x, y, 0.7).fill(palette.primary);
    }
  }
  doc.restore();
}

/** Four-corner decorative frame lines */
function drawDecorativeFrame(doc, frame, palette) {
  const cornerLen = 28;
  const inset = 6;
  const x = frame.x - inset, y = frame.y - inset;
  const w = frame.width + inset * 2, h = frame.height + inset * 2;

  doc.save().strokeColor(palette.primary).lineWidth(3).lineCap("square");
  // Top-left
  doc.moveTo(x, y + cornerLen).lineTo(x, y).lineTo(x + cornerLen, y).stroke();
  // Top-right
  doc.moveTo(x + w - cornerLen, y).lineTo(x + w, y).lineTo(x + w, y + cornerLen).stroke();
  // Bottom-left
  doc.moveTo(x, y + h - cornerLen).lineTo(x, y + h).lineTo(x + cornerLen, y + h).stroke();
  // Bottom-right
  doc.moveTo(x + w - cornerLen, y + h).lineTo(x + w, y + h).lineTo(x + w, y + h - cornerLen).stroke();
  doc.restore();
}

/** Soft drop shadow beneath any box */
function drawShadowPanel(doc, box, radius) {
  doc.save()
    .roundedRect(box.x + 3, box.y + 4, box.width, box.height, radius)
    .fillOpacity(0.1)
    .fill("#000000")
    .restore();
}

/** Thin colored top accent strip on a panel */
function drawPanelTopAccent(doc, box, palette, radius) {
  doc.save()
    .roundedRect(box.x, box.y, box.width, 5, radius)
    .fill(palette.primary)
    .restore();
}

/** Short bold accent bar under headings */
function drawAccentBar(doc, x, y, width, palette) {
  doc.save()
    .roundedRect(x, y, width, 4, 2)
    .fill(palette.primary)
    .restore();
  doc.save()
    .roundedRect(x + width + 6, y + 1, width * 0.4, 2, 1)
    .fillOpacity(0.35)
    .fill(palette.accent)
    .restore();
}

/** 1px colored rule line */
function drawThinRule(doc, x, y, width, color) {
  doc.save()
    .moveTo(x, y).lineTo(x + width, y)
    .lineWidth(0.7)
    .stroke(color)
    .restore();
}

function drawOuterChrome(doc, palette, page) {
  doc.save().circle(8, 56, 68).fillOpacity(0.14).fill(palette.primary).restore();
  doc.save().circle(page.width - 20, page.height - 24, 62).fillOpacity(0.1).fill(palette.accent).restore();
  // Extra small accent circles
  doc.save().circle(page.width - 60, 30, 20).fillOpacity(0.08).fill(palette.highlight || palette.softAlt).restore();
  doc.save().circle(40, page.height - 40, 16).fillOpacity(0.08).fill(palette.softAlt).restore();
}

function drawRoundedPanel(doc, box, palette, radius, fill = "#FFFFFF") {
  doc.save()
    .roundedRect(box.x, box.y, box.width, box.height, radius)
    .fillAndStroke(fill, palette.line)
    .restore();
}

/** Premium pill ribbon with subtle inner border */
function drawPremiumRibbon(doc, x, y, width, height, color, text) {
  doc.save().roundedRect(x, y, width, height, 999).fill(color).restore();
  doc.save()
    .roundedRect(x + 1, y + 1, width - 2, height - 2, 999)
    .lineWidth(1)
    .fillOpacity(0)
    .strokeOpacity(0.2)
    .stroke("#FFFFFF")
    .restore();
  doc.fillColor("#FFFFFF")
    .font("Helvetica-Bold")
    .fontSize(Math.max(7, Math.min(8.5, height - 10)))
    .text(text, x, y + Math.max(4, (height - 9) / 2 - 1), { width, align: "center" });
}

function drawChip(doc, x, y, text, palette, compact) {
  const width = measureChipWidth(text);
  const height = compact ? 17 : 20;
  doc.save().roundedRect(x, y, width, height, 999).fillAndStroke(palette.soft, palette.line).restore();
  // Inner highlight
  doc.save()
    .roundedRect(x + 1, y + 1, width - 2, height * 0.5, 999)
    .fillOpacity(0.3)
    .fill("#FFFFFF")
    .restore();
  doc.fillColor(palette.dark)
    .font("Helvetica-Bold")
    .fontSize(compact ? 7 : 8.5)
    .text(text, x, y + (compact ? 4.5 : 5.5), { width, align: "center" });
}

function drawMarker(doc, x, y, color, label, radius = 9) {
  // Outer glow ring
  doc.save().circle(x, y, radius + 3).fillOpacity(0.2).fill(color).restore();
  doc.save().circle(x, y, radius).fill(color).restore();
  doc.fillColor("#FFFFFF")
    .font("Helvetica-Bold")
    .fontSize(Math.max(6, radius * 0.82))
    .text(label, x - radius * 0.45, y - radius * 0.38, { width: radius * 0.9, align: "center" });
}

function drawTicTacToeBoard(doc, box, palette, label) {
  const cell = box.size / 3;

  // Background panel
  doc.save()
    .roundedRect(box.x - 8, box.y - 8, box.size + 16, box.size + 16, 20)
    .fillOpacity(0.2)
    .fill(palette.soft)
    .restore();

  doc.save()
    .roundedRect(box.x - 8, box.y - 8, box.size + 16, box.size + 16, 20)
    .lineWidth(1.5)
    .stroke(palette.line)
    .restore();

  // Grid lines
  doc.strokeColor(palette.primary).lineWidth(Math.max(2, box.size * 0.028)).lineCap("round");
  for (let line = 1; line <= 2; line++) {
    doc.moveTo(box.x + line * cell, box.y + 6)
      .lineTo(box.x + line * cell, box.y + box.size - 6).stroke();
    doc.moveTo(box.x + 6, box.y + line * cell)
      .lineTo(box.x + box.size - 6, box.y + line * cell).stroke();
  }

  doc.fillColor(palette.primary)
    .font("Helvetica-Bold")
    .fontSize(Math.max(8, box.size * 0.13))
    .text(String(label), box.x, box.y + box.size + 5, { width: box.size, align: "center" });
}

// ─────────────────────────────────────────────────────────────
// WORD LIST PANEL
// ─────────────────────────────────────────────────────────────
function drawWordList(doc, words, box, palette) {
  drawShadowPanel(doc, box, 14);
  drawRoundedPanel(doc, box, palette, 16, "#FFFFFF");
  drawPanelTopAccent(doc, box, palette, 16);
  drawPremiumRibbon(doc, box.x + 14, box.y + 10, Math.min(118, box.width - 28), 20, palette.primary, "✦ FIND THESE");

  let cursorX = box.x + 14;
  let cursorY = box.y + 42;
  const maxRight = box.x + box.width - 14;

  words.forEach((word) => {
    const width = Math.max(58, word.length * 7.2 + 18);
    if (cursorX + width > maxRight) {
      cursorX = box.x + 14;
      cursorY += 26;
    }
    doc.save()
      .roundedRect(cursorX, cursorY, width, 19, 999)
      .fillAndStroke(palette.softAlt, palette.line)
      .restore();
    // Pill inner highlight
    doc.save()
      .roundedRect(cursorX + 1, cursorY + 1, width - 2, 9, 999)
      .fillOpacity(0.3)
      .fill("#FFFFFF")
      .restore();
    doc.fillColor(palette.dark)
      .font("Helvetica-Bold")
      .fontSize(8.5)
      .text(word, cursorX, cursorY + 5.5, { width, align: "center" });
    cursorX += width + 8;
  });
}

// ─────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────
function getRegion(doc, puzzlesPerPage, index, page) {
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const pageHeight = doc.page.height - doc.page.margins.top - doc.page.margins.bottom - 24;
  const originX = doc.page.margins.left;
  const originY = doc.page.margins.top + 14;

  if (puzzlesPerPage === 1) {
    return { x: originX, y: originY, width: pageWidth, height: pageHeight };
  }
  if (puzzlesPerPage === 2) {
    const halfHeight = pageHeight / 2 - 10;
    return { x: originX, y: originY + index * (halfHeight + 20), width: pageWidth, height: halfHeight };
  }
  const halfWidth = pageWidth / 2 - 10;
  const halfHeight = pageHeight / 2 - 10;
  const row = Math.floor(index / 2);
  const col = index % 2;
  return {
    x: originX + col * (halfWidth + 20),
    y: originY + row * (halfHeight + 20),
    width: halfWidth,
    height: halfHeight
  };
}

function paintPageBase(doc, color) {
  doc.save().rect(0, 0, doc.page.width, doc.page.height).fill(color).restore();
}

function chunk(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

function inset(box, amount) {
  return { x: box.x + amount, y: box.y + amount, width: box.width - amount * 2, height: box.height - amount * 2 };
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatPuzzleType(value) {
  if (value === "wordsearch") return "Word Search";
  if (value === "tictactoe") return "Tic-Tac-Toe";
  return capitalize(value);
}

function getPage(request) {
  const [width, height] = request.layout.pageSize;
  return { width, height };
}

function getPalette(type) {
  return PALETTES[type] || PALETTES.sudoku;
}

function measureChipWidth(text) {
  return Math.max(54, text.length * 5.9 + 18);
}
