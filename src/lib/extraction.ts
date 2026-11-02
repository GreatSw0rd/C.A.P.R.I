// Extraction locale du texte d'un fichier (PDF, Word .docx, ou texte brut).
// Les bibliotheques lourdes sont chargees a la demande (import dynamique).

async function extractPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url"))
    .default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const data = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data }).promise;
  let out = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items
      .map((it) => ("str" in it ? it.str : ""))
      .join(" ");
    out += strings + "\n";
  }
  return out.trim();
}

async function extractDocx(file: File): Promise<string> {
  const mammoth = (await import("mammoth/mammoth.browser")).default;
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return (result.value || "").trim();
}

/**
 * Extrait le texte d'un fichier selon son extension. Formats : PDF, .docx, et texte brut
 * (txt, md, csv, json...). Renvoie une erreur pour un format non pris en charge (ex. .doc ancien).
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) {
    return extractPdf(file);
  }
  if (name.endsWith(".docx")) {
    return extractDocx(file);
  }
  if (name.endsWith(".doc")) {
    throw new Error(
      "Les anciens fichiers .doc ne sont pas pris en charge. Enregistrez en .docx ou collez le texte."
    );
  }
  // Texte brut (txt, md, csv, json, etc.)
  return (await file.text()).trim();
}
