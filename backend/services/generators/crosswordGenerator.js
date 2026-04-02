const THEMES = {
  animals: [
    ["TIGER", "Striped big cat"],
    ["OTTER", "Playful river mammal"],
    ["RABBIT", "Long-eared hopper"],
    ["EAGLE", "Sharp-eyed bird of prey"],
    ["PANDA", "Black-and-white bamboo eater"],
    ["HORSE", "Stable companion"]
  ],
  tech: [
    ["SERVER", "Machine that provides resources"],
    ["ROUTER", "Traffic director for networks"],
    ["SCRIPT", "Small automation program"],
    ["PYTHON", "Popular programming language"],
    ["BINARY", "Base-2 representation"],
    ["CACHE", "Fast temporary storage"]
  ],
  space: [
    ["ORBIT", "Path around a planet"],
    ["COMET", "Icy visitor with a tail"],
    ["GALAXY", "Massive star system"],
    ["ROCKET", "Launch vehicle"],
    ["LUNAR", "Related to the moon"],
    ["ASTRO", "Space prefix"]
  ],
  general: [
    ["BRIDGE", "Structure over a gap"],
    ["GARDEN", "Place to grow flowers"],
    ["MARKET", "Place to buy goods"],
    ["PLANET", "World orbiting a star"],
    ["STREAM", "Flowing water"],
    ["CANDLE", "Wax light source"]
  ]
};

/**
 * Generates a themed crossword with a simple intersection-based placement strategy.
 */
export function generateCrossword({ difficulty, number, theme }) {
  const size = difficulty === "hard" ? 13 : 11;
  const bank = (THEMES[theme] || THEMES.general)
    .slice(0, difficulty === "easy" ? 4 : difficulty === "medium" ? 5 : 6);
  const placed = placeWords(size, bank);
  const grid = buildGrid(size, placed);
  const numbering = buildNumbering(grid);

  return {
    puzzle: {
      size,
      grid: grid.map((row) => row.map((cell) => (cell === "#" ? "#" : ""))),
      mask: grid.map((row) => row.map((cell) => cell !== "#")),
      numbering,
      clues: buildClues(placed, numbering),
      theme: THEMES[theme] ? theme : "general"
    },
    solution: {
      size,
      grid
    },
    meta: {
      title: `Crossword ${number}`,
      theme: THEMES[theme] ? theme : "general",
      wordsPlaced: placed.length
    }
  };
}

function placeWords(size, bank) {
  const placed = [];
  const [firstWord, firstClue] = bank[0];
  const startCol = Math.floor((size - firstWord.length) / 2);
  const centerRow = Math.floor(size / 2);

  placed.push({
    word: firstWord,
    clue: firstClue,
    row: centerRow,
    col: startCol,
    direction: "across"
  });

  for (const [word, clue] of bank.slice(1)) {
    const placement = findPlacement(size, placed, word);
    if (placement) {
      placed.push({
        word,
        clue,
        ...placement
      });
    }
  }

  return placed;
}

function findPlacement(size, placed, word) {
  for (const existing of placed) {
    for (let i = 0; i < existing.word.length; i += 1) {
      for (let j = 0; j < word.length; j += 1) {
        if (existing.word[i] !== word[j]) continue;

        const direction = existing.direction === "across" ? "down" : "across";
        const row = existing.direction === "across" ? existing.row - j : existing.row + i;
        const col = existing.direction === "across" ? existing.col + i : existing.col - j;

        if (canPlaceWord(size, placed, word, row, col, direction)) {
          return { row, col, direction };
        }
      }
    }
  }

  return null;
}

function canPlaceWord(size, placed, word, row, col, direction) {
  if (row < 0 || col < 0) return false;
  if (direction === "across" && col + word.length > size) return false;
  if (direction === "down" && row + word.length > size) return false;

  const occupied = new Map();
  for (const placement of placed) {
    for (let i = 0; i < placement.word.length; i += 1) {
      const position =
        placement.direction === "across"
          ? `${placement.row},${placement.col + i}`
          : `${placement.row + i},${placement.col}`;
      occupied.set(position, placement.word[i]);
    }
  }

  for (let index = 0; index < word.length; index += 1) {
    const testRow = direction === "across" ? row : row + index;
    const testCol = direction === "across" ? col + index : col;
    const key = `${testRow},${testCol}`;
    const existingChar = occupied.get(key);

    if (existingChar && existingChar !== word[index]) {
      return false;
    }
  }

  return true;
}

function buildGrid(size, placed) {
  const grid = Array.from({ length: size }, () => Array.from({ length: size }, () => "#"));

  for (const placement of placed) {
    for (let index = 0; index < placement.word.length; index += 1) {
      const row = placement.direction === "across" ? placement.row : placement.row + index;
      const col = placement.direction === "across" ? placement.col + index : placement.col;
      grid[row][col] = placement.word[index];
    }
  }

  return grid;
}

function buildNumbering(grid) {
  const entries = [];
  let number = 1;

  for (let row = 0; row < grid.length; row += 1) {
    for (let col = 0; col < grid[row].length; col += 1) {
      if (grid[row][col] === "#") continue;

      const startsAcross = col === 0 || grid[row][col - 1] === "#";
      const startsDown = row === 0 || grid[row - 1][col] === "#";

      if (startsAcross || startsDown) {
        entries.push({ row, col, number });
        number += 1;
      }
    }
  }

  return entries;
}

function buildClues(placed, numbering) {
  const numberLookup = new Map(numbering.map((item) => [`${item.row},${item.col}`, item.number]));
  const across = [];
  const down = [];

  for (const placement of placed) {
    const clue = {
      number: numberLookup.get(`${placement.row},${placement.col}`),
      clue: placement.clue,
      answerLength: placement.word.length
    };

    if (placement.direction === "across") {
      across.push(clue);
    } else {
      down.push(clue);
    }
  }

  return { across, down };
}
