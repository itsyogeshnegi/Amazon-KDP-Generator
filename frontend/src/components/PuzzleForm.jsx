import { useEffect, useState } from "react";

const themes = ["general", "animals", "tech", "space"];
const bookSizes = [
  { value: "8.5x11", label: "8.5 x 11 in" },
  { value: "8x10", label: "8 x 10 in" },
  { value: "6x9", label: "6 x 9 in" }
];

export default function PuzzleForm({
  value,
  onPreview,
  onGenerate,
  loadingPreview,
  submitting
}) {
  const [form, setForm] = useState(value);

  useEffect(() => {
    setForm(value);
  }, [value]);

  function updateField(field, nextValue) {
    setForm((current) => ({
      ...current,
      [field]: nextValue
    }));
  }

  function submitPreview(event) {
    event.preventDefault();
    onPreview(normalize(form));
  }

  function submitGenerate() {
    onGenerate(normalize(form));
  }

  return (
    <form className="card form-card" onSubmit={submitPreview}>
      <div className="form-intro">
        <p className="form-kicker">Book setup</p>
        <h2>Create your next puzzle collection</h2>
      </div>
      <div className="field">
        <label htmlFor="type">Puzzle type</label>
        <select
          id="type"
          value={form.type}
          onChange={(event) => updateField("type", event.target.value)}
        >
          <option value="sudoku">Sudoku</option>
          <option value="maze">Maze</option>
          <option value="crossword">Crossword</option>
          <option value="wordsearch">Word Search</option>
          <option value="tictactoe">Tic-Tac-Toe</option>
        </select>
      </div>

      <div className="field-grid">
        <div className="field">
          <label htmlFor="difficulty">Difficulty</label>
          <select
            id="difficulty"
            value={form.difficulty}
            onChange={(event) => updateField("difficulty", event.target.value)}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="count">Number of puzzles</label>
          <input
            id="count"
            min="1"
            max="100"
            type="number"
            value={form.count}
            onChange={(event) => updateField("count", event.target.value)}
          />
        </div>
      </div>

      <div className="field-grid">
        <div className="field">
          <label htmlFor="layout">Puzzles per page</label>
          <select
            id="layout"
            value={form.layout}
            onChange={(event) => updateField("layout", Number(event.target.value))}
          >
            <option value="1">1 per page</option>
            <option value="2">2 per page</option>
            <option value="4">4 per page</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="bookSize">Book size</label>
          <select
            id="bookSize"
            value={form.bookSize}
            onChange={(event) => updateField("bookSize", event.target.value)}
          >
            {bookSizes.map((size) => (
              <option key={size.value} value={size.value}>
                {size.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field-grid">
        <div className="field">
          <label htmlFor="theme">Theme</label>
          <select
            id="theme"
            value={form.theme}
            onChange={(event) => updateField("theme", event.target.value)}
            disabled={!["crossword", "wordsearch"].includes(form.type)}
          >
            {themes.map((theme) => (
              <option key={theme} value={theme}>
                {theme}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="toggle">
        <input
          type="checkbox"
          checked={form.includeCoverPage}
          onChange={(event) => updateField("includeCoverPage", event.target.checked)}
        />
        Include front and back cover pages
      </label>

      <div className="actions">
        <button type="submit" className="ghost" disabled={loadingPreview || submitting}>
          {loadingPreview ? "Generating preview..." : "Preview puzzles"}
        </button>
        <button type="button" onClick={submitGenerate} disabled={submitting || loadingPreview}>
          {submitting ? "Building PDF..." : "Generate & Download PDF"}
        </button>
      </div>
    </form>
  );
}

function normalize(form) {
  return {
    ...form,
    count: Math.min(100, Math.max(1, Number(form.count))),
    layout: Number(form.layout)
  };
}
