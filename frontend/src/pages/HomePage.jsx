import { useState } from "react";
import PuzzleForm from "../components/PuzzleForm.jsx";
import PreviewPanel from "../components/PreviewPanel.jsx";
import DownloadCard from "../components/DownloadCard.jsx";
import {
  downloadGeneratedPdf,
  generatePreview,
  generatePuzzleBook
} from "../services/api.js";

const initialForm = {
  type: "sudoku",
  difficulty: "easy",
  count: 50,
  layout: 1,
  bookSize: "8.5x11",
  theme: "general",
  includeCoverPage: true
};

export default function HomePage() {
  const [form, setForm] = useState(initialForm);
  const [preview, setPreview] = useState([]);
  const [download, setDownload] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handlePreview(nextForm) {
    setLoadingPreview(true);
    setError("");
    try {
      const response = await generatePreview(nextForm);
      setForm(nextForm);
      setPreview(response.preview);
      setDownload(null);
    } catch (previewError) {
      setError(previewError.message);
    } finally {
      setLoadingPreview(false);
    }
  }

  async function handleGenerate(nextForm) {
    setSubmitting(true);
    setError("");
    try {
      const response = await generatePuzzleBook(nextForm);
      await downloadGeneratedPdf(response.fileUrl, response.fileName);
      setForm(nextForm);
      setDownload(response);
    } catch (generateError) {
      setError(generateError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Amazon KDP-ready export workflow</p>
          <h1>Puzzle book generator</h1>
          <p className="lead">
            Build printable Sudoku, Maze, Crossword, Word Search, and
            Tic-Tac-Toe books with preview, numbering, front and back cover
            support, and answer keys in a brighter, more premium creator
            workspace.
          </p>
          <div className="hero-badges">
            <span>Sudoku Studio</span>
            <span>Maze Lab</span>
            <span>Crossword Press</span>
            <span>Word Search Club</span>
            <span>Tic-Tac-Toe Corner</span>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="hero-orb hero-orb-sudoku"></div>
          <div className="hero-orb hero-orb-maze"></div>
          <div className="hero-orb hero-orb-crossword"></div>
          <div className="hero-grid-card hero-grid-sudoku">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div className="hero-grid-card hero-grid-crossword">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </section>

      <section className="dashboard">
        <PuzzleForm
          value={form}
          onPreview={handlePreview}
          onGenerate={handleGenerate}
          loadingPreview={loadingPreview}
          submitting={submitting}
        />
        <div className="side-panel">
          {error ? <div className="error-banner">{error}</div> : null}
          <PreviewPanel preview={preview} loading={loadingPreview} />
          <DownloadCard download={download} submitting={submitting} />
        </div>
      </section>
    </main>
  );
}
