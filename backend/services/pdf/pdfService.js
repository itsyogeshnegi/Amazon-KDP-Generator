import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "../..");

const PALETTES = {
  sudoku: {
    primary: "#C97919",
    soft: "#F8E7C7",
    accent: "#8A4B08",
    line: "#C6924F",
    dark: "#4A2B07"
  },
  maze: {
    primary: "#168272",
    soft: "#DDF4EE",
    accent: "#E8794C",
    line: "#7BC9B7",
    dark: "#0E4E45"
  },
  crossword: {
    primary: "#4258C9",
    soft: "#E4EAFF",
    accent: "#2A315D",
    line: "#8EA2FF",
    dark: "#1D2751"
  },
  wordsearch: {
    primary: "#7A9A12",
    soft: "#F2F8D8",
    accent: "#E4B93A",
    line: "#B7CC6A",
    dark: "#405306"
  },
  tictactoe: {
    primary: "#FF5FA2",
    soft: "#FFE4F0",
    accent: "#D53B81",
    line: "#FF9BC5",
    dark: "#742549"
  },
  answer: {
    primary: "#7A3AB8",
    soft: "#F0E6FB",
    accent: "#B15FFF",
    line: "#CCB4EC",
    dark: "#4A216D"
  }
};

/**
 * Renders the full puzzle book PDF with puzzle pages followed by answer pages.
 */
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

function renderCoverPage(doc, request, totalPuzzles, page) {
  const palette = getPalette(request.type);
  paintPageBase(doc, palette.soft);
  drawOuterChrome(doc, palette, page);

  const frameInset = Math.max(28, Math.min(42, page.width * 0.055));
  const frame = {
    x: frameInset,
    y: frameInset,
    width: page.width - frameInset * 2,
    height: page.height - frameInset * 2
  };
  drawRoundedPanel(doc, frame, palette, 30, "#FFFFFF");

  const inner = inset(frame, 26);
  const footerHeight = 44;
  const gutter = 22;
  const left = {
    x: inner.x,
    y: inner.y,
    width: Math.min(252, inner.width * 0.47),
    height: inner.height - footerHeight
  };
  const right = {
    x: left.x + left.width + gutter,
    y: inner.y + 54,
    width: inner.width - left.width - gutter,
    height: inner.height - footerHeight - 60
  };

  drawRibbon(doc, left.x, left.y + 8, Math.min(220, left.width), 22, palette.primary, "AUTHOR YOGESH NEGI");

  const titleY = left.y + 58;
  const title = "Puzzle Book Export";
  const subtitle =
    "Crafted for clean print-ready exports with richer layouts, stronger branding, and stable puzzle presentation.";
  doc.font("Helvetica-Bold").fontSize(26);
  const titleHeight = doc.heightOfString(title, {
    width: left.width,
    lineGap: 2
  });

  doc.fillColor(palette.dark)
    .font("Helvetica-Bold")
    .fontSize(26)
    .text(title, left.x, titleY, {
      width: left.width,
      lineGap: 2,
      align: "left"
    });

  const subtitleY = titleY + titleHeight + 12;
  doc.font("Helvetica").fontSize(12.5);
  const subtitleHeight = doc.heightOfString(subtitle, {
    width: left.width,
    lineGap: 4
  });
  doc.fillColor("#42506A")
    .font("Helvetica")
    .fontSize(12.5)
    .text(subtitle, left.x, subtitleY, {
      width: left.width,
      lineGap: 4
    });

  drawSummaryCard(
    doc,
    {
      x: left.x,
      y: subtitleY + subtitleHeight + 28,
      width: left.width,
      height: 180
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

  const footerY = frame.y + frame.height - 34;
  doc.fillColor("#5E6678")
    .font("Helvetica")
    .fontSize(11)
    .text(`Formatted for ${request.layout.pageSizeLabel} inch print-safe output.`, left.x, footerY, {
      width: 260
    });

  doc.fillColor(palette.primary)
    .font("Helvetica-Bold")
    .fontSize(12)
    .text("Colorful. Clean. KDP-friendly.", left.x, footerY + 18, {
      width: 220
    });
}

function renderPuzzlePages(doc, puzzles, puzzlesPerPage, request, page) {
  const groups = chunk(puzzles, puzzlesPerPage);

  groups.forEach((group, groupIndex) => {
    if (groupIndex > 0) {
      doc.addPage();
    }

    const palette = getPalette(group[0]?.type || request.type);
    paintPageBase(doc, "#FFFCF8");
    drawPageChrome(doc, palette, "Puzzles", `Page ${groupIndex + 1}`, page);

    group.forEach((puzzle, index) => {
      const region = getRegion(doc, puzzlesPerPage, index, page);
      renderPuzzleBlock(doc, puzzle, region, false, puzzlesPerPage);
    });
  });
}

function renderAnswerSection(doc, puzzles, request, page) {
  const palette = PALETTES.answer;
  paintPageBase(doc, "#FCF8FF");
  drawPageChrome(
    doc,
    palette,
    "Answer Key",
    request.type === "tictactoe" ? "Free play pages" : `${formatPuzzleType(request.type)} solutions`,
    page
  );

  doc.fillColor(palette.dark)
    .font("Helvetica-Bold")
    .fontSize(28)
    .text(request.type === "tictactoe" ? "Free Play Guide" : "Solutions & Answer Guide", 60, 116, { width: 460 });

  doc.fillColor("#5F5A75")
    .font("Helvetica")
    .fontSize(12)
    .text(
      request.type === "tictactoe"
        ? "Tic-Tac-Toe pages are open-play activity sheets, so this section keeps the book structure without adding fake answers."
        : "Each solution page uses the same stable grid system with clearer contrast and cleaner spacing.",
      60,
      154,
      { width: 460, lineGap: 3 }
    );

  drawRibbon(doc, 60, 204, 170, 22, palette.primary, request.type === "tictactoe" ? "FREE PLAY NOTE" : "SOLVED PAGES");

  if (request.type === "tictactoe") {
    doc.fillColor(palette.primary)
      .font("Helvetica-Bold")
      .fontSize(18)
      .text("No answer key is needed for Tic-Tac-Toe.", 60, 258, {
        width: 440
      });

    doc.fillColor("#5F5A75")
      .font("Helvetica")
      .fontSize(12)
      .text(
        "Use each board for repeated play, classroom activities, and family game time. The export still closes with a polished back page for a complete KDP-friendly flow.",
        60,
        292,
        { width: 440, lineGap: 4 }
      );
    return;
  }

  puzzles.forEach((puzzle, index) => {
    doc.addPage();
    paintPageBase(doc, "#FFFFFF");
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

function renderPuzzleBlock(doc, puzzle, region, isSolution, puzzlesPerPage) {
  const palette = isSolution ? PALETTES.answer : getPalette(puzzle.type);
  const compact = puzzlesPerPage > 1;
  drawRoundedPanel(doc, region, palette, compact ? 18 : 24, "#FFFFFF");

  const metrics = drawBlockHeader(doc, puzzle, region, palette, isSolution, compact);
  const content = {
    x: region.x + (compact ? 14 : 20),
    y: metrics.bottom + 10,
    width: region.width - (compact ? 28 : 40),
    height: region.y + region.height - metrics.bottom - (compact ? 34 : 42)
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

function drawSudoku(doc, board, content, palette, isSolution) {
  const safeHeight = Math.max(120, content.height - 10);
  const size = Math.max(120, Math.min(content.width, safeHeight));
  const startX = content.x + (content.width - size) / 2;
  const startY = content.y + (safeHeight - size) / 2;
  const cell = size / 9;

  for (let boxRow = 0; boxRow < 3; boxRow += 1) {
    for (let boxCol = 0; boxCol < 3; boxCol += 1) {
      if ((boxRow + boxCol) % 2 !== 0) continue;
      doc.save()
        .roundedRect(startX + boxCol * cell * 3, startY + boxRow * cell * 3, cell * 3, cell * 3, 6)
        .fillOpacity(0.18)
        .fill(palette.soft)
        .restore();
    }
  }

  for (let row = 0; row <= 9; row += 1) {
    doc.strokeColor(palette.line).lineWidth(row % 3 === 0 ? 1.7 : 0.55);
    doc.moveTo(startX, startY + row * cell).lineTo(startX + size, startY + row * cell).stroke();
    doc.moveTo(startX + row * cell, startY).lineTo(startX + row * cell, startY + size).stroke();
  }

  board.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      if (!value) return;
      doc.fillColor(isSolution ? palette.dark : palette.accent)
        .font("Helvetica-Bold")
        .fontSize(Math.max(8, Math.min(12, cell * 0.42)))
        .text(String(value), startX + colIndex * cell, startY + rowIndex * cell + cell * 0.22, {
          width: cell,
          align: "center"
        });
    });
  });
}

function drawMaze(doc, maze, content, palette, showSolution) {
  const size = Math.max(120, Math.min(content.width, content.height));
  const startX = content.x + (content.width - size) / 2;
  const startY = content.y + (content.height - size) / 2;
  const cell = size / maze.rows;
  const framePad = Math.max(8, Math.min(14, cell * 0.6));

  doc.save()
    .roundedRect(startX - framePad, startY - framePad, size + framePad * 2, size + framePad * 2, 18)
    .fillOpacity(0.28)
    .fill(palette.soft)
    .restore();

  doc.strokeColor(palette.line);
  maze.cells.forEach((row, rowIndex) => {
    row.forEach((cellWalls, colIndex) => {
      const x = startX + colIndex * cell;
      const y = startY + rowIndex * cell;

      doc.lineWidth(Math.max(0.8, Math.min(1.2, cell * 0.08)));
      if (cellWalls.top) doc.moveTo(x, y).lineTo(x + cell, y).stroke();
      if (cellWalls.right) doc.moveTo(x + cell, y).lineTo(x + cell, y + cell).stroke();
      if (cellWalls.bottom) doc.moveTo(x, y + cell).lineTo(x + cell, y + cell).stroke();
      if (cellWalls.left) doc.moveTo(x, y).lineTo(x, y + cell).stroke();
    });
  });

  drawMarker(doc, startX + cell / 2, startY + cell / 2, "#14B889", "S", Math.max(7, cell * 0.38));
  drawMarker(doc, startX + size - cell / 2, startY + size - cell / 2, palette.accent, "E", Math.max(7, cell * 0.38));

  if (showSolution && maze.path) {
    doc.strokeColor("#D94841").lineWidth(Math.max(1.4, Math.min(2.4, cell * 0.18)));
    maze.path.forEach(([row, col], index) => {
      const pointX = startX + col * cell + cell / 2;
      const pointY = startY + row * cell + cell / 2;
      if (index === 0) doc.moveTo(pointX, pointY);
      else doc.lineTo(pointX, pointY);
    });
    doc.stroke();
  }
}

function drawCrossword(doc, crossword, content, palette, isSolution, compact) {
  const grid = isSolution
    ? crossword.solution.grid
    : crossword.puzzle.mask.map((row, rowIndex) =>
        row.map((filled, colIndex) => (filled ? crossword.puzzle.grid[rowIndex][colIndex] : "#"))
      );

  const totalWidth = content.width;
  const totalHeight = content.height;
  const stackLayout = compact || totalWidth < 330;
  const gap = stackLayout ? 14 : 20;
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

  doc.save()
    .roundedRect(gridX - 10, gridY - 10, gridSize + 20, gridSize + 20, 16)
    .fillOpacity(0.28)
    .fill(palette.soft)
    .restore();

  grid.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      const x = gridX + colIndex * cell;
      const y = gridY + rowIndex * cell;

      if (value === "#") {
        doc.save().roundedRect(x, y, cell, cell, 2).fill(palette.accent).restore();
        return;
      }

      doc.save().roundedRect(x, y, cell, cell, 2).fill("#FFFFFF").restore();
      doc.strokeColor(palette.line).lineWidth(0.7).roundedRect(x, y, cell, cell, 2).stroke();

      const number = numberLookup.get(`${rowIndex},${colIndex}`);
      if (number) {
        doc.fillColor("#51607C").font("Helvetica-Bold").fontSize(Math.max(4, cell * 0.18)).text(String(number), x + 1.5, y + 1.5, {
          width: cell - 3
        });
      }

      if (isSolution) {
        doc.fillColor(palette.dark)
          .font("Helvetica-Bold")
          .fontSize(Math.max(7, Math.min(11, cell * 0.42)))
          .text(value, x, y + cell * 0.22, {
            width: cell,
            align: "center"
          });
      }
    });
  });

  drawCluePanel(doc, { x: clueX, y: clueY, width: clueWidth, height: clueHeight }, crossword.puzzle.clues, palette);
}

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

  doc.save()
    .roundedRect(startX - 10, startY - 10, boardSize + 20, boardSize + 20, 18)
    .fillOpacity(0.28)
    .fill(palette.soft)
    .restore();

  for (let row = 0; row < board.size; row += 1) {
    for (let col = 0; col < board.size; col += 1) {
      const x = startX + col * cell;
      const y = startY + row * cell;
      const isHighlighted = highlightMap.has(`${row},${col}`);
      doc.save()
        .roundedRect(x, y, cell, cell, Math.max(2, cell * 0.1))
        .fill(isHighlighted ? palette.soft : "#FFFFFF")
        .restore();
      doc.strokeColor(palette.line).lineWidth(0.7).roundedRect(x, y, cell, cell, Math.max(2, cell * 0.1)).stroke();
      doc.fillColor(palette.dark)
        .font("Helvetica-Bold")
        .fontSize(Math.max(6, Math.min(12, cell * 0.42)))
        .text(board.grid[row][col], x, y + cell * 0.22, {
          width: cell,
          align: "center"
        });
    }
  }

  drawWordList(doc, board.words, {
    x: content.x,
    y: startY + boardSize + 14,
    width: content.width,
    height: listHeight
  }, palette);
}

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
    doc.fillColor("#6D4A5E")
      .font("Helvetica")
      .fontSize(compact ? 8.5 : 10.5)
      .text(tictactoe.subtitle, content.x, content.y, {
        width: content.width,
        align: "center"
      });
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

function drawCluePanel(doc, box, clues, palette) {
  drawRoundedPanel(doc, box, palette, 16, "#FFFFFF");
  drawRibbon(doc, box.x + 14, box.y + 12, Math.min(90, box.width - 28), 18, palette.primary, "CLUES");

  const left = box.x + 16;
  const width = box.width - 32;
  const halfY = box.y + box.height / 2;

  doc.fillColor(palette.dark).font("Helvetica-Bold").fontSize(11).text("Across", left, box.y + 42, { width });
  doc.font("Helvetica").fontSize(8.5).fillColor("#48546C");

  let offsetY = box.y + 58;
  const acrossBottomLimit = halfY - 14;
  for (const clue of clues.across) {
    const text = `${clue.number}. ${clue.clue} (${clue.answerLength})`;
    const nextHeight = doc.heightOfString(text, { width, lineGap: 1 });
    if (offsetY + nextHeight > acrossBottomLimit) break;
    doc.text(text, left, offsetY, { width, lineGap: 1 });
    offsetY = doc.y + 4;
  }

  const downStart = Math.max(halfY, offsetY + 10);
  doc.fillColor(palette.dark).font("Helvetica-Bold").fontSize(11).text("Down", left, downStart, { width });
  offsetY = doc.y + 6;
  doc.font("Helvetica").fontSize(8.5).fillColor("#48546C");

  const downBottomLimit = box.y + box.height - 16;
  for (const clue of clues.down) {
    const text = `${clue.number}. ${clue.clue} (${clue.answerLength})`;
    const nextHeight = doc.heightOfString(text, { width, lineGap: 1 });
    if (offsetY + nextHeight > downBottomLimit) break;
    doc.text(text, left, offsetY, { width, lineGap: 1 });
    offsetY = doc.y + 4;
  }
}

function drawPageChrome(doc, palette, sectionLabel, trailingLabel, page) {
  doc.save().rect(0, 0, page.width, page.height).lineWidth(0.8).stroke("#E6DED2").restore();
  doc.save().rect(0, 0, page.width, 44).fill(palette.soft).restore();
  doc.strokeColor(palette.line).lineWidth(1).moveTo(28, 44).lineTo(page.width - 28, 44).stroke();

  doc.fillColor(palette.primary).font("Helvetica-Bold").fontSize(10).text(sectionLabel.toUpperCase(), 38, 16);
  doc.fillColor("#657089").font("Helvetica").fontSize(10).text(trailingLabel, page.width - 160, 16, {
    width: 120,
    align: "right"
  });
}

function drawBlockHeader(doc, puzzle, region, palette, isSolution, compact) {
  const padding = compact ? 14 : 18;
  const ribbonWidth = compact ? 74 : 92;
  const baseY = region.y + padding;
  const titleY = baseY + 28;
  const titleSize = compact ? 13 : 18;
  const chipY = titleY + titleSize + 8;

  drawRibbon(
    doc,
    region.x + padding,
    baseY,
    ribbonWidth,
    compact ? 16 : 18,
    palette.primary,
    (isSolution ? "SOLUTION" : formatPuzzleType(puzzle.type)).toUpperCase()
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
  const chipHeight = compact ? 16 : 18;
  const maxRight = region.x + region.width - padding;

  for (const chip of chips) {
    const chipWidth = measureChipWidth(chip);
    if (chipX + chipWidth > maxRight) {
      chipX = region.x + padding;
      currentY += chipHeight + 6;
    }
    drawChip(doc, chipX, currentY, chip, palette, compact);
    chipX += chipWidth + 8;
  }

  return { bottom: currentY + chipHeight };
}

function drawFooterTag(doc, region, palette, label, compact) {
  const y = region.y + region.height - (compact ? 18 : 22);
  doc.fillColor("#6A7286").font("Helvetica").fontSize(compact ? 7.5 : 9).text(label, region.x + 14, y);
  doc.fillColor(palette.primary)
    .font("Helvetica-Bold")
    .fontSize(compact ? 7.5 : 9)
    .text("Yogesh Negi", region.x + region.width - 108, y, {
      width: 92,
      align: "right"
    });
}

function drawSummaryCard(doc, box, palette, rows) {
  drawRoundedPanel(doc, box, palette, 22, "#FFFFFF");

  let offsetY = box.y + 20;
  for (const [label, value] of rows) {
    doc.fillColor("#6C7485").font("Helvetica-Bold").fontSize(9).text(label.toUpperCase(), box.x + 18, offsetY);
    doc.fillColor(palette.dark).font("Helvetica-Bold").fontSize(15).text(value, box.x + 18, offsetY + 12, {
      width: box.width - 36
    });
    offsetY += 32;
    if (offsetY > box.y + box.height - 26) break;
  }
}

function renderBackCoverPage(doc, request, totalPuzzles, page) {
  const palette = getPalette(request.type);
  paintPageBase(doc, palette.soft);
  drawOuterChrome(doc, palette, page);

  const frameInset = Math.max(32, Math.min(42, page.width * 0.065));
  const frame = {
    x: frameInset,
    y: frameInset,
    width: page.width - frameInset * 2,
    height: page.height - frameInset * 2
  };
  drawRoundedPanel(doc, frame, palette, 30, "#FFFFFF");

  drawRibbon(doc, frame.x + 30, frame.y + 26, 182, 22, palette.primary, "AUTHOR YOGESH NEGI");

  doc.fillColor(palette.dark)
    .font("Helvetica-Bold")
    .fontSize(28)
    .text("Made for fresh puzzle moments.", frame.x + 30, frame.y + 78, {
      width: 320,
      lineGap: 2
    });

  doc.fillColor("#51607A")
    .font("Helvetica")
    .fontSize(12.5)
    .text(
      `This ${formatPuzzleType(request.type).toLowerCase()} edition includes ${totalPuzzles} print-ready pages designed for Amazon KDP interiors, family play, and clean at-home printing.`,
      frame.x + 30,
      frame.y + 144,
      {
        width: 308,
        lineGap: 4
      }
    );

  drawBackCoverArt(doc, {
    x: frame.x + frame.width - 172,
    y: frame.y + 148,
    width: 120,
    height: 150
  }, palette, request.type);

  drawSummaryCard(
    doc,
    {
      x: frame.x + 30,
      y: frame.y + 274,
      width: 250,
      height: 156
    },
    palette,
    [
      ["Edition", formatPuzzleType(request.type)],
      ["Difficulty", capitalize(request.difficulty)],
      ["Layout", `${request.layout.puzzlesPerPage} per page`],
      ["Author", "Yogesh Negi"]
    ]
  );

  doc.fillColor(palette.primary)
    .font("Helvetica-Bold")
    .fontSize(15)
    .text("Designed for bright, friendly puzzle books.", frame.x + 30, frame.y + frame.height - 98, {
      width: frame.width - 60
    });

  doc.fillColor("#5E6678")
    .font("Helvetica")
    .fontSize(11)
    .text("Interior back page for print-safe exports and polished KDP-ready presentation.", frame.x + 30, frame.y + frame.height - 72, {
      width: frame.width - 60
    });
}

function drawCoverArt(doc, box, palette, type) {
  drawRoundedPanel(doc, box, palette, 26, "#FFFFFF");
  const inner = inset(box, 18);

  if (type === "sudoku") {
    const cols = 5;
    const rows = 5;
    const gap = 8;
    const cell = Math.min(26, (inner.width - gap * (cols - 1)) / cols);
    const totalWidth = cols * cell + (cols - 1) * gap;
    const totalHeight = rows * cell + (rows - 1) * gap;
    const startX = inner.x + (inner.width - totalWidth) / 2;
    const startY = inner.y + 10;

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        if ((row + col) % 2 !== 0) continue;
        doc.save()
          .roundedRect(startX + col * (cell + gap), startY + row * (cell + gap), cell, cell, 6)
          .fill(palette.soft)
          .restore();
      }
    }
  } else if (type === "maze") {
    const segmentWidth = Math.min(48, inner.width * 0.28);
    for (let i = 0; i < 7; i += 1) {
      const y = inner.y + 12 + i * 24;
      const x = inner.x + 18 + (i % 2) * 22;
      doc.strokeColor(palette.line).lineWidth(3).moveTo(x, y).lineTo(x + segmentWidth, y).stroke();
      doc.moveTo(x + segmentWidth, y).lineTo(x + segmentWidth, y + 18).stroke();
    }
    drawMarker(doc, inner.x + 26, inner.y + 18, "#14B889", "S", 8);
    drawMarker(doc, inner.x + inner.width - 26, inner.y + inner.height - 44, palette.accent, "E", 8);
  } else if (type === "wordsearch") {
    const size = 6;
    const cell = Math.min(28, (inner.width - 24) / size);
    const total = size * cell;
    const startX = inner.x + (inner.width - total) / 2;
    const startY = inner.y + 12;

    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        const x = startX + col * cell;
        const y = startY + row * cell;
        doc.save()
          .roundedRect(x, y, cell - 4, cell - 4, 4)
          .fill((row + col) % 4 === 0 ? palette.accent : (row + col) % 2 === 0 ? palette.soft : "#FFFFFF")
          .restore();
      }
    }
  } else if (type === "tictactoe") {
    drawTicTacToeBoard(
      doc,
      {
        x: inner.x + (inner.width - 88) / 2,
        y: inner.y + 22,
        size: 88
      },
      palette,
      "X/O"
    );
    doc.save().circle(inner.x + 28, inner.y + inner.height - 52, 10).fillOpacity(0.16).fill(palette.primary).restore();
    doc.save().circle(inner.x + inner.width - 30, inner.y + inner.height - 92, 14).fillOpacity(0.22).fill(palette.accent).restore();
  } else {
    const cols = 5;
    const rows = 6;
    const gap = 6;
    const cell = Math.min(22, (inner.width - gap * (cols - 1)) / cols);
    const startX = inner.x + (inner.width - (cols * cell + (cols - 1) * gap)) / 2;
    const startY = inner.y + 10;
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const fill = (row + col) % 3 === 0 ? palette.accent : (row + col) % 2 === 0 ? "#FFFFFF" : palette.soft;
        doc.save()
          .roundedRect(startX + col * (cell + gap), startY + row * (cell + gap), cell, cell, 4)
          .fill(fill)
          .restore();
      }
    }
  }

  doc.fillColor(palette.primary)
    .font("Helvetica-Bold")
    .fontSize(16)
    .text(`${formatPuzzleType(type)} Edition`, box.x + 20, box.y + box.height - 44, {
      width: box.width - 40,
      align: "left"
    });
}

function drawBackCoverArt(doc, box, palette, type) {
  const inner = box;

  if (type === "maze") {
    const segmentWidth = Math.min(44, inner.width * 0.28);
    for (let i = 0; i < 6; i += 1) {
      const y = inner.y + 14 + i * 24;
      const x = inner.x + 16 + (i % 2) * 18;
      doc.strokeColor(palette.line).lineWidth(3).moveTo(x, y).lineTo(x + segmentWidth, y).stroke();
      doc.moveTo(x + segmentWidth, y).lineTo(x + segmentWidth, y + 16).stroke();
    }
  } else if (type === "wordsearch") {
    const size = 5;
    const cell = Math.min(26, (inner.width - 20) / size);
    const total = size * cell;
    const startX = inner.x + (inner.width - total) / 2;
    const startY = inner.y + 16;
    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        doc.save()
          .roundedRect(startX + col * cell, startY + row * cell, cell - 4, cell - 4, 4)
          .fill((row + col) % 2 === 0 ? palette.soft : "#FFFFFF")
          .restore();
      }
    }
  } else if (type === "tictactoe") {
    drawTicTacToeBoard(
      doc,
      {
        x: inner.x + (inner.width - 88) / 2,
        y: inner.y + 24,
        size: 88
      },
      palette,
      "FUN"
    );
  } else if (type === "sudoku") {
    return;
  } else {
    const cols = 4;
    const rows = 5;
    const cell = 24;
    const startX = inner.x + (inner.width - cols * cell) / 2;
    const startY = inner.y + 18;
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        doc.save()
          .roundedRect(startX + col * cell, startY + row * cell, cell - 4, cell - 4, 4)
          .fill((row + col) % 3 === 0 ? palette.accent : "#FFFFFF")
          .restore();
      }
    }
  }
}

function drawOuterChrome(doc, palette, page) {
  doc.save().circle(10, 58, 62).fillOpacity(0.16).fill(palette.primary).restore();
  doc.save().circle(page.width - 22, page.height - 26, 58).fillOpacity(0.12).fill(palette.accent).restore();
}

function drawRoundedPanel(doc, box, palette, radius, fill = "#FFFFFF") {
  doc.save().roundedRect(box.x, box.y, box.width, box.height, radius).fillAndStroke(fill, palette.line).restore();
}

function drawRibbon(doc, x, y, width, height, color, text) {
  doc.save().roundedRect(x, y, width, height, 999).fill(color).restore();
  doc.fillColor("#FFFFFF")
    .font("Helvetica-Bold")
    .fontSize(Math.max(7, Math.min(8, height - 10)))
    .text(text, x, y + Math.max(4, (height - 8) / 2 - 1), {
      width,
      align: "center"
    });
}

function drawChip(doc, x, y, text, palette, compact) {
  const width = measureChipWidth(text);
  const height = compact ? 16 : 18;
  doc.save().roundedRect(x, y, width, height, 999).fillAndStroke(palette.soft, palette.line).restore();
  doc.fillColor(palette.dark).font("Helvetica-Bold").fontSize(compact ? 6.8 : 8).text(text, x, y + (compact ? 4.4 : 5), {
    width,
    align: "center"
  });
}

function drawMarker(doc, x, y, color, label, radius = 9) {
  doc.save().circle(x, y, radius).fill(color).restore();
  doc.fillColor("#FFFFFF")
    .font("Helvetica-Bold")
    .fontSize(Math.max(6, radius * 0.8))
    .text(label, x - radius * 0.45, y - radius * 0.36, {
      width: radius * 0.9,
      align: "center"
    });
}

function drawTicTacToeBoard(doc, box, palette, label) {
  const cell = box.size / 3;
  doc.save()
    .roundedRect(box.x - 8, box.y - 8, box.size + 16, box.size + 16, 18)
    .fillOpacity(0.28)
    .fill(palette.soft)
    .restore();

  doc.strokeColor(palette.line).lineWidth(Math.max(1.5, box.size * 0.025));
  for (let line = 1; line <= 2; line += 1) {
    doc.moveTo(box.x + line * cell, box.y).lineTo(box.x + line * cell, box.y + box.size).stroke();
    doc.moveTo(box.x, box.y + line * cell).lineTo(box.x + box.size, box.y + line * cell).stroke();
  }

  doc.fillColor(palette.primary)
    .font("Helvetica-Bold")
    .fontSize(Math.max(8, box.size * 0.12))
    .text(String(label), box.x, box.y + box.size + 4, {
      width: box.size,
      align: "center"
    });
}

function paintPageBase(doc, color) {
  doc.save().rect(0, 0, doc.page.width, doc.page.height).fill(color).restore();
}

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
    return {
      x: originX,
      y: originY + index * (halfHeight + 20),
      width: pageWidth,
      height: halfHeight
    };
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

function chunk(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function inset(box, amount) {
  return {
    x: box.x + amount,
    y: box.y + amount,
    width: box.width - amount * 2,
    height: box.height - amount * 2
  };
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
  return {
    width,
    height
  };
}

function getPalette(type) {
  return PALETTES[type] || PALETTES.sudoku;
}

function measureChipWidth(text) {
  return Math.max(52, text.length * 5.8 + 16);
}

function drawWordList(doc, words, box, palette) {
  drawRoundedPanel(doc, box, palette, 16, "#FFFFFF");
  drawRibbon(doc, box.x + 14, box.y + 12, Math.min(112, box.width - 28), 18, palette.primary, "FIND THESE");

  let cursorX = box.x + 14;
  let cursorY = box.y + 42;
  const maxRight = box.x + box.width - 14;

  words.forEach((word) => {
    const width = Math.max(56, word.length * 7 + 18);
    if (cursorX + width > maxRight) {
      cursorX = box.x + 14;
      cursorY += 24;
    }

    doc.save().roundedRect(cursorX, cursorY, width, 18, 999).fillAndStroke(palette.soft, palette.line).restore();
    doc.fillColor(palette.dark).font("Helvetica-Bold").fontSize(8).text(word, cursorX, cursorY + 5, {
      width,
      align: "center"
    });
    cursorX += width + 8;
  });
}
