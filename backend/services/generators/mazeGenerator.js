const MAZE_SIZES = {
  easy: 10,
  medium: 14,
  hard: 18
};

/**
 * Generates a maze using recursive backtracking and computes a solution path.
 */
export function generateMaze({ difficulty, number }) {
  const size = MAZE_SIZES[difficulty];
  const maze = createMaze(size, size);
  const solution = solveMaze(maze);

  return {
    puzzle: maze,
    solution,
    meta: {
      title: `Maze ${number}`,
      size
    }
  };
}

function createMaze(rows, cols) {
  const cells = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      top: true,
      right: true,
      bottom: true,
      left: true,
      visited: false
    }))
  );

  const stack = [[0, 0]];
  cells[0][0].visited = true;

  while (stack.length) {
    const [row, col] = stack[stack.length - 1];
    const neighbors = getNeighbors(row, col, rows, cols).filter(
      ([nextRow, nextCol]) => !cells[nextRow][nextCol].visited
    );

    if (!neighbors.length) {
      stack.pop();
      continue;
    }

    const [nextRow, nextCol, direction] = neighbors[Math.floor(Math.random() * neighbors.length)];
    removeWall(cells[row][col], cells[nextRow][nextCol], direction);
    cells[nextRow][nextCol].visited = true;
    stack.push([nextRow, nextCol]);
  }

  return {
    rows,
    cols,
    cells: cells.map((row) =>
      row.map(({ visited, ...rest }) => rest)
    ),
    start: [0, 0],
    end: [rows - 1, cols - 1]
  };
}

function getNeighbors(row, col, rows, cols) {
  const neighbors = [];

  if (row > 0) neighbors.push([row - 1, col, "top"]);
  if (col < cols - 1) neighbors.push([row, col + 1, "right"]);
  if (row < rows - 1) neighbors.push([row + 1, col, "bottom"]);
  if (col > 0) neighbors.push([row, col - 1, "left"]);

  return neighbors;
}

function removeWall(current, next, direction) {
  if (direction === "top") {
    current.top = false;
    next.bottom = false;
  } else if (direction === "right") {
    current.right = false;
    next.left = false;
  } else if (direction === "bottom") {
    current.bottom = false;
    next.top = false;
  } else if (direction === "left") {
    current.left = false;
    next.right = false;
  }
}

function solveMaze(maze) {
  const queue = [[maze.start, [maze.start]]];
  const seen = new Set([maze.start.join(",")]);

  while (queue.length) {
    const [[row, col], path] = queue.shift();

    if (row === maze.end[0] && col === maze.end[1]) {
      return path;
    }

    const cell = maze.cells[row][col];
    const moves = [];

    if (!cell.top) moves.push([row - 1, col]);
    if (!cell.right) moves.push([row, col + 1]);
    if (!cell.bottom) moves.push([row + 1, col]);
    if (!cell.left) moves.push([row, col - 1]);

    for (const move of moves) {
      const key = move.join(",");
      if (!seen.has(key)) {
        seen.add(key);
        queue.push([move, [...path, move]]);
      }
    }
  }

  return [maze.start];
}
