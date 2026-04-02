export function SudokuPreview({ puzzle }) {
  return (
    <div className="sudoku-grid">
      {puzzle.flat().map((value, index) => (
        <div
          key={index}
          className={`sudoku-cell sudoku-box-${Math.floor(index / 9 / 3) * 3 + Math.floor((index % 9) / 3)}`}
        >
          {value || ""}
        </div>
      ))}
    </div>
  );
}

export function MazePreview({ puzzle }) {
  const viewBoxSize = 260;
  const cell = viewBoxSize / puzzle.rows;
  const start = puzzle.start || [0, 0];
  const end = puzzle.end || [puzzle.rows - 1, puzzle.cols - 1];

  return (
    <div className="maze-frame">
      <svg viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} className="maze-svg" role="img">
        <rect x="0" y="0" width={viewBoxSize} height={viewBoxSize} rx="18" className="maze-backdrop" />
        {puzzle.cells.map((row, rowIndex) =>
          row.map((cellWalls, colIndex) => {
            const x = colIndex * cell;
            const y = rowIndex * cell;
            return (
              <g key={`${rowIndex}-${colIndex}`}>
                {cellWalls.top ? <line x1={x} y1={y} x2={x + cell} y2={y} /> : null}
                {cellWalls.right ? <line x1={x + cell} y1={y} x2={x + cell} y2={y + cell} /> : null}
                {cellWalls.bottom ? <line x1={x} y1={y + cell} x2={x + cell} y2={y + cell} /> : null}
                {cellWalls.left ? <line x1={x} y1={y} x2={x} y2={y + cell} /> : null}
              </g>
            );
          })
        )}
        <circle
          cx={start[1] * cell + cell / 2}
          cy={start[0] * cell + cell / 2}
          r={Math.max(4, cell / 4)}
          className="maze-start"
        />
        <circle
          cx={end[1] * cell + cell / 2}
          cy={end[0] * cell + cell / 2}
          r={Math.max(4, cell / 4)}
          className="maze-end"
        />
      </svg>
      <div className="maze-legend">
        <span><i className="legend-dot legend-start"></i>Start</span>
        <span><i className="legend-dot legend-end"></i>Finish</span>
      </div>
    </div>
  );
}

export function CrosswordPreview({ puzzle }) {
  return (
    <div className="crossword-preview">
      <div className="crossword-grid" style={{ gridTemplateColumns: `repeat(${puzzle.size}, 1fr)` }}>
        {puzzle.mask.flatMap((row, rowIndex) =>
          row.map((filled, colIndex) => {
            const numbered = puzzle.numbering.find(
              (entry) => entry.row === rowIndex && entry.col === colIndex
            );

            return (
              <div key={`${rowIndex}-${colIndex}`} className={`crossword-cell ${filled ? "" : "blocked"}`}>
                {numbered ? <span className="crossword-number">{numbered.number}</span> : null}
              </div>
            );
          })
        )}
      </div>
      <div className="clue-columns">
        <div>
          <h4>Across</h4>
          {puzzle.clues.across.map((clue) => (
            <p key={`a-${clue.number}`}>
              {clue.number}. {clue.clue}
            </p>
          ))}
        </div>
        <div>
          <h4>Down</h4>
          {puzzle.clues.down.map((clue) => (
            <p key={`d-${clue.number}`}>
              {clue.number}. {clue.clue}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

export function WordSearchPreview({ puzzle }) {
  return (
    <div className="wordsearch-preview">
      <div className="wordsearch-grid" style={{ gridTemplateColumns: `repeat(${puzzle.size}, 1fr)` }}>
        {puzzle.grid.flatMap((row, rowIndex) =>
          row.map((letter, colIndex) => (
            <div key={`${rowIndex}-${colIndex}`} className="wordsearch-cell">
              {letter}
            </div>
          ))
        )}
      </div>
      <div className="wordsearch-list">
        {puzzle.words.map((word) => (
          <span key={word}>{word}</span>
        ))}
      </div>
    </div>
  );
}

export function TicTacToePreview({ puzzle }) {
  return (
    <div className="tictactoe-preview">
      <div className="tictactoe-board-grid">
        {puzzle.boards.map((board) => (
          <div key={board.id} className="tictactoe-mini-board">
            {Array.from({ length: 9 }, (_value, index) => (
              <div key={`${board.id}-${index}`} className="tictactoe-cell"></div>
            ))}
          </div>
        ))}
      </div>
      <p className="tictactoe-note">{puzzle.subtitle}</p>
    </div>
  );
}
