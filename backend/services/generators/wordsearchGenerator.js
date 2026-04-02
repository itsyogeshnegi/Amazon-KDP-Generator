const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const THEME_BANKS = {
  animals: ["TIGER", "OTTER", "RABBIT", "EAGLE", "PANDA", "HORSE", "FALCON", "DOLPHIN", "KOALA", "MONKEY"],
  tech: ["SERVER", "ROUTER", "SCRIPT", "PYTHON", "BINARY", "CACHE", "CODING", "CLOUD", "DEBUG", "SOCKET"],
  space: ["ORBIT", "COMET", "GALAXY", "ROCKET", "LUNAR", "ASTRO", "NEBULA", "PLANET", "COSMOS", "SATURN"],
  general: ["BRIDGE", "GARDEN", "MARKET", "PLANET", "STREAM", "CANDLE", "SUNRISE", "HARBOR", "MOUNTAIN", "MEADOW"]
};

const DIFFICULTY_SETTINGS = {
  easy: { size: 12, words: 6, directions: [[0, 1], [1, 0], [1, 1]] },
  medium: { size: 14, words: 8, directions: [[0, 1], [1, 0], [1, 1], [1, -1]] },
  hard: { size: 16, words: 10, directions: [[0, 1], [1, 0], [1, 1], [1, -1], [0, -1], [-1, 0]] }
};

/**
 * Generates a themed word search puzzle and its placement-based solution data.
 */
export function generateWordSearch({ difficulty, number, theme }) {
  const settings = DIFFICULTY_SETTINGS[difficulty];
  const resolvedTheme = THEME_BANKS[theme] ? theme : "general";
  const selectedWords = shuffle(THEME_BANKS[resolvedTheme])
    .slice(0, settings.words)
    .sort((left, right) => right.length - left.length);
  const grid = Array.from({ length: settings.size }, () => Array.from({ length: settings.size }, () => ""));
  const placements = [];

  for (const word of selectedWords) {
    const placement = placeWord(grid, word, settings.directions);
    placements.push(placement);
  }

  fillEmptyCells(grid);

  return {
    puzzle: {
      size: settings.size,
      grid,
      words: selectedWords,
      theme: resolvedTheme
    },
    solution: {
      size: settings.size,
      grid,
      words: selectedWords,
      highlights: placements.map((placement) => ({
        word: placement.word,
        path: buildPath(placement)
      }))
    },
    meta: {
      title: `Word Search ${number}`,
      theme: resolvedTheme,
      words: selectedWords.length
    }
  };
}

function placeWord(grid, word, directions) {
  const size = grid.length;
  const positions = [];

  for (const [rowStep, colStep] of directions) {
    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        positions.push({ row, col, rowStep, colStep });
      }
    }
  }

  for (const candidate of shuffle(positions)) {
    if (!canPlaceWord(grid, word, candidate.row, candidate.col, candidate.rowStep, candidate.colStep)) {
      continue;
    }

    for (let index = 0; index < word.length; index += 1) {
      const targetRow = candidate.row + candidate.rowStep * index;
      const targetCol = candidate.col + candidate.colStep * index;
      grid[targetRow][targetCol] = word[index];
    }

    return { word, ...candidate };
  }

  throw new Error(`Unable to place word "${word}" in word search grid.`);
}

function canPlaceWord(grid, word, row, col, rowStep, colStep) {
  for (let index = 0; index < word.length; index += 1) {
    const targetRow = row + rowStep * index;
    const targetCol = col + colStep * index;

    if (
      targetRow < 0 ||
      targetCol < 0 ||
      targetRow >= grid.length ||
      targetCol >= grid.length
    ) {
      return false;
    }

    const existing = grid[targetRow][targetCol];
    if (existing && existing !== word[index]) {
      return false;
    }
  }

  return true;
}

function buildPath(placement) {
  return placement.word.split("").map((_char, index) => [
    placement.row + placement.rowStep * index,
    placement.col + placement.colStep * index
  ]);
}

function fillEmptyCells(grid) {
  for (let row = 0; row < grid.length; row += 1) {
    for (let col = 0; col < grid[row].length; col += 1) {
      if (!grid[row][col]) {
        grid[row][col] = LETTERS[randomInt(0, LETTERS.length - 1)];
      }
    }
  }
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(items) {
  const cloned = [...items];
  for (let index = cloned.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [cloned[index], cloned[swapIndex]] = [cloned[swapIndex], cloned[index]];
  }
  return cloned;
}
