import { SudokuPreview, MazePreview, CrosswordPreview } from "./PuzzlePreviewTypes.jsx";

export default function PreviewPanel({ preview, loading }) {
  return (
    <section className="card preview-panel">
      <div className="section-heading">
        <h2>Preview</h2>
        <span>{preview.length ? `${preview.length} sample puzzles` : "No preview yet"}</span>
      </div>
      {loading ? <p className="muted">Building preview puzzles...</p> : null}
      {!loading && !preview.length ? (
        <p className="muted">Generate a preview to inspect the first one or two puzzles before export.</p>
      ) : null}
      <div className="preview-stack">
        {preview.map((item) => (
          <article key={item.id} className={`preview-card preview-card-${item.type}`}>
            <div className="preview-header">
              <div>
                <strong>{item.meta.title}</strong>
                <div className="preview-meta">
                  <span className={`type-chip type-chip-${item.type}`}>{item.type}</span>
                  <span className="meta-chip">{item.difficulty}</span>
                  {item.meta.theme ? <span className="meta-chip">{item.meta.theme}</span> : null}
                </div>
              </div>
              <span className="preview-number">#{item.number}</span>
            </div>
            {item.type === "sudoku" ? <SudokuPreview puzzle={item.puzzle} /> : null}
            {item.type === "maze" ? <MazePreview puzzle={item.puzzle} /> : null}
            {item.type === "crossword" ? <CrosswordPreview puzzle={item.puzzle} /> : null}
          </article>
        ))}
      </div>
    </section>
  );
}
