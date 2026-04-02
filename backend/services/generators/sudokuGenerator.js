const BASE_GRID = 3;
const SIDE = BASE_GRID * BASE_GRID;
const DIFFICULTY_CLUES = {
  easy: 40,
  medium: 32,
  hard: 26
};

/**
 * Builds a valid Sudoku puzzle and its solved board.
 */
export function generateSudoku({ difficulty, number }) {
  const solution = buildSolvedBoard();
  const puzzle = carvePuzzle(solution, DIFFICULTY_CLUES[difficulty]);

  return {
    puzzle,
    solution,
    meta: {
      title: `Sudoku ${number}`,
      clues: countFilledCells(puzzle)
    }
  };
}

function buildSolvedBoard() {
  const rows = shuffle([0, 1, 2]).flatMap((group) => shuffle([0, 1, 2]).map((value) => group * BASE_GRID + value));
  const cols = shuffle([0, 1, 2]).flatMap((group) => shuffle([0, 1, 2]).map((value) => group * BASE_GRID + value));
  const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);

  return rows.map((row) =>
    cols.map((col) => nums[pattern(row, col)])
  );
}

function pattern(row, col) {
  return (BASE_GRID * (row % BASE_GRID) + Math.floor(row / BASE_GRID) + col) % SIDE;
}

function carvePuzzle(solution, clueCount) {
  const puzzle = solution.map((row) => [...row]);
  const cells = shuffle(Array.from({ length: SIDE * SIDE }, (_value, index) => index));
  const removals = SIDE * SIDE - clueCount;

  for (let i = 0; i < removals; i += 1) {
    const cell = cells[i];
    const row = Math.floor(cell / SIDE);
    const col = cell % SIDE;
    puzzle[row][col] = 0;
  }

  return puzzle;
}

function countFilledCells(board) {
  return board.flat().filter(Boolean).length;
}

function shuffle(items) {
  const cloned = [...items];
  for (let index = cloned.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [cloned[index], cloned[swapIndex]] = [cloned[swapIndex], cloned[index]];
  }
  return cloned;
}
