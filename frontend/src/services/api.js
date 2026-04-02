/**
 * Calls the backend preview endpoint with the current form configuration.
 */
export async function generatePreview(payload) {
  return requestJson("/api/generate/preview", payload);
}

/**
 * Calls the backend generate endpoint and returns the PDF download data.
 */
export async function generatePuzzleBook(payload) {
  return requestJson("/api/generate", payload);
}

/**
 * Downloads a generated PDF to the user's system using the browser download flow.
 */
export async function downloadGeneratedPdf(fileUrl, fileName = "puzzle-book.pdf") {
  const response = await fetch(fileUrl);

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
