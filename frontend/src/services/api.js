const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

/**
 * Calls the backend preview endpoint with the current form configuration.
 */
export async function generatePreview(payload) {
  return requestJson(buildApiUrl("/api/generate/preview"), payload);
}

/**
 * Calls the backend generate endpoint and returns the PDF download data.
 */
export async function generatePuzzleBook(payload) {
  const response = await requestJson(buildApiUrl("/api/generate"), payload);

  return {
    ...response,
    fileUrl: buildApiUrl(response.fileUrl)
  };
}

/**
 * Downloads a generated PDF to the user's system using the browser download flow.
 */
export async function downloadGeneratedPdf(fileUrl, fileName = "puzzle-book.pdf") {
  const response = await fetch(buildApiUrl(fileUrl));

  if (!response.ok) {
    throw new Error("Unable to download the generated PDF.");
  }

  const pdfBlob = await response.blob();
  const objectUrl = window.URL.createObjectURL(pdfBlob);
  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(objectUrl);
}

async function requestJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}

function buildApiUrl(path) {
  if (!path) return API_BASE_URL || "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path}`;
}
