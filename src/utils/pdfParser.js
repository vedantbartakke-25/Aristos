import * as pdfjsLib from "pdfjs-dist";

// Use the bundled worker from pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();

/**
 * Extract text content from a PDF file (client-side)
 * @param {File} file - The PDF file from file input
 * @returns {Promise<string>} - Combined text from all pages
 */
async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item) => item.str).join(" ");
    fullText += pageText + "\n";
  }

  return fullText;
}

/**
 * Parse soil health data (N, P, K, pH) from extracted PDF text.
 * Handles multiple common formats of Indian Soil Health Cards.
 */
function parseSoilValues(text) {
  const result = { nitrogen: null, phosphorus: null, potassium: null, ph: null };

  // Normalize text: collapse whitespace, lowercase for matching
  const normalized = text.replace(/\s+/g, " ").toLowerCase();

  // ── Nitrogen (N) ──
  // Patterns: "nitrogen 62", "N : 62", "nitrogen (n) 62", "N 62 kg/ha", "Nitrogen(N) : 45.2"
  const nitrogenPatterns = [
    /nitrogen\s*\(?n?\)?\s*[:\-=]?\s*([\d.]+)/i,
    /\bn\b\s*[:\-=]\s*([\d.]+)/i,
    /nitrogen\s+([\d.]+)/i,
    /(?:available\s+)?nitrogen\s*[:\-=]?\s*([\d.]+)/i,
  ];
  for (const pat of nitrogenPatterns) {
    const match = text.match(pat);
    if (match) {
      result.nitrogen = parseFloat(match[1]);
      break;
    }
  }

  // ── Phosphorus (P) ──
  const phosphorusPatterns = [
    /phosphorus\s*\(?p?\)?\s*[:\-=]?\s*([\d.]+)/i,
    /phosphorous\s*\(?p?\)?\s*[:\-=]?\s*([\d.]+)/i, // common misspelling
    /\bp\b\s*[:\-=]\s*([\d.]+)/i,
    /phosphorus\s+([\d.]+)/i,
    /(?:available\s+)?phosphorus\s*[:\-=]?\s*([\d.]+)/i,
  ];
  for (const pat of phosphorusPatterns) {
    const match = text.match(pat);
    if (match) {
      result.phosphorus = parseFloat(match[1]);
      break;
    }
  }

  // ── Potassium (K) ──
  const potassiumPatterns = [
    /potassium\s*\(?k?\)?\s*[:\-=]?\s*([\d.]+)/i,
    /\bk\b\s*[:\-=]\s*([\d.]+)/i,
    /potassium\s+([\d.]+)/i,
    /(?:available\s+)?potassium\s*[:\-=]?\s*([\d.]+)/i,
    /potash\s*\(?k?\)?\s*[:\-=]?\s*([\d.]+)/i,
  ];
  for (const pat of potassiumPatterns) {
    const match = text.match(pat);
    if (match) {
      result.potassium = parseFloat(match[1]);
      break;
    }
  }

  // ── pH ──
  const phPatterns = [
    /\bph\b\s*[:\-=]?\s*([\d.]+)/i,
    /soil\s*ph\s*[:\-=]?\s*([\d.]+)/i,
    /ph\s*(?:level|value)?\s*[:\-=]?\s*([\d.]+)/i,
  ];
  for (const pat of phPatterns) {
    const match = text.match(pat);
    if (match) {
      const val = parseFloat(match[1]);
      // pH should be between 0 and 14
      if (val >= 0 && val <= 14) {
        result.ph = val;
        break;
      }
    }
  }

  return result;
}

/**
 * Main function: Parse a Soil Health Card PDF and extract N, P, K, pH values
 * @param {File} file - PDF file from file input
 * @returns {Promise<{nitrogen: number|null, phosphorus: number|null, potassium: number|null, ph: number|null, rawText: string, parsed: boolean}>}
 */
export async function parseSoilHealthCardPDF(file) {
  try {
    const text = await extractTextFromPDF(file);
    const values = parseSoilValues(text);

    // Check if we got at least some values
    const parsed =
      values.nitrogen !== null ||
      values.phosphorus !== null ||
      values.potassium !== null ||
      values.ph !== null;

    return {
      ...values,
      rawText: text,
      parsed,
    };
  } catch (error) {
    console.error("PDF parsing error:", error);
    return {
      nitrogen: null,
      phosphorus: null,
      potassium: null,
      ph: null,
      rawText: "",
      parsed: false,
      error: error.message,
    };
  }
}
