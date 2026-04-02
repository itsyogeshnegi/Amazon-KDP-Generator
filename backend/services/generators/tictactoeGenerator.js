const DIFFICULTY_SETTINGS = {
  easy: { boardsPerPage: 4, subtitle: "Big boards for easy free-play rounds." },
  medium: { boardsPerPage: 6, subtitle: "More boards for longer head-to-head sessions." },
  hard: { boardsPerPage: 9, subtitle: "Compact multi-board challenge sheet for fast play." }
};

/**
 * Generates a printable Tic-Tac-Toe activity page with multiple empty boards.
 */
export function generateTicTacToe({ difficulty, number }) {
  const settings = DIFFICULTY_SETTINGS[difficulty];
  const boards = Array.from({ length: settings.boardsPerPage }, (_value, index) => ({
    id: index + 1,
    size: 3
  }));

  return {
    puzzle: {
      boards,
      boardsPerPage: settings.boardsPerPage,
      subtitle: settings.subtitle
    },
    solution: {
      boards,
      boardsPerPage: settings.boardsPerPage,
      note: "Free play page"
    },
    meta: {
      title: `Tic-Tac-Toe ${number}`,
      boards: settings.boardsPerPage
    }
  };
}
