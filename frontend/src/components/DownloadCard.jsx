import { downloadGeneratedPdf } from "../services/api.js";

export default function DownloadCard({ download, submitting }) {
  async function handleDownloadInterior() {
    if (!download?.interiorFileUrl && !download?.fileUrl) return;
    await downloadGeneratedPdf(
      download.interiorFileUrl || download.fileUrl,
      download.interiorFileName || download.fileName
    );
  }

  async function handleDownloadCover() {
    if (!download?.coverFileUrl || !download?.coverFileName) return;
    await downloadGeneratedPdf(download.coverFileUrl, download.coverFileName);
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
            The generator now creates a KDP interior PDF and a separate wraparound cover PDF.
          </p>
          <p>Manifest: {download.manifestId}</p>
          <p>Total puzzles: {download.totalPuzzles}</p>
          <button type="button" onClick={handleDownloadInterior}>
            Download interior PDF
          </button>
          {download.coverFileUrl ? (
            <button type="button" onClick={handleDownloadCover}>
              Download cover PDF
            </button>
          ) : null}
        </div>
      )}
    </section>
  );
}
