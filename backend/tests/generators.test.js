import test from "node:test";
import assert from "node:assert/strict";
import { generateSudoku } from "../services/generators/sudokuGenerator.js";
import { generateMaze } from "../services/generators/mazeGenerator.js";
import { generateCrossword } from "../services/generators/crosswordGenerator.js";
import { generateWordSearch } from "../services/generators/wordsearchGenerator.js";
import { generateTicTacToe } from "../services/generators/tictactoeGenerator.js";

test("Sudoku generator returns a 9x9 board and matching solution shape", () => {
  const result = generateSudoku({ difficulty: "medium", number: 1 });
  assert.equal(result.puzzle.length, 9);
  assert.equal(result.solution.length, 9);
  assert.equal(result.puzzle[0].length, 9);
  assert.equal(result.solution[0].length, 9);
});

test("Maze generator returns a solvable path", () => {
  const result = generateMaze({ difficulty: "easy", number: 1 });
  assert.equal(result.puzzle.rows, 10);
  assert.deepEqual(result.solution[0], [0, 0]);
  assert.deepEqual(result.solution.at(-1), [9, 9]);
});

test("Crossword generator returns clue groups and solution grid", () => {
  const result = generateCrossword({ difficulty: "hard", number: 1, theme: "tech" });
  assert.ok(result.puzzle.clues.across.length >= 1);
  assert.ok(result.solution.grid.length >= 11);
});

test("Word Search generator returns a square letter grid and highlighted words", () => {
  const result = generateWordSearch({ difficulty: "medium", number: 1, theme: "animals" });
  assert.equal(result.puzzle.grid.length, 14);
  assert.equal(result.puzzle.grid[0].length, 14);
  assert.ok(result.puzzle.words.length >= 8);
  assert.ok(result.solution.highlights.length >= 8);
});

test("Tic-Tac-Toe generator returns printable empty boards", () => {
  const result = generateTicTacToe({ difficulty: "medium", number: 1 });
  assert.equal(result.puzzle.boardsPerPage, 6);
  assert.equal(result.puzzle.boards.length, 6);
  assert.equal(result.solution.note, "Free play page");
  assert.equal(result.puzzle.boards[0].size, 3);
});
