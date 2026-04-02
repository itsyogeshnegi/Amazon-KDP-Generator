import { downloadGeneratedPdf } from "../services/api.js";

export default function DownloadCard({ download, submitting }) {
  async function handleDownloadAgain() {
    if (!download?.fileUrl) return;
    await downloadGeneratedPdf(download.fileUrl, download.fileName);
  }

  return (
    <section className="card download-card">
      <div className="section-heading">
        <h2>Export</h2>
        <span className="download-status">{submitting ? "Working..." : "Ready"}</span>
      </div>
      {!download ? (
        <div className="download-placeholder">
          <div className="download-glow" aria-hidden="true"></div>
          <p className="muted">
            Once the backend finishes generating the batch, your PDF link will appear here.
          </p>
        </div>
      ) : (
        <div className="download-box">
          <p className="download-label">Your book is ready</p>
          <p className="download-note">
            The PDF is downloaded to your system through the browser download flow.
          </p>
          <p>Manifest: {download.manifestId}</p>
          <p>Total puzzles: {download.totalPuzzles}</p>
          <button type="button" onClick={handleDownloadAgain}>
            Download generated PDF
          </button>
        </div>
      )}
    </section>
  );
}
