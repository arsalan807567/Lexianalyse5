import { AnalysisSummary, DocumentType } from "../types";

export async function analyzeDocument(
  content: string | { data: string; mimeType: string },
  docType: DocumentType,
  language: string = "English"
): Promise<AnalysisSummary> {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, docType, language }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Analysis failed" }));
    throw new Error(err.error || "Analysis failed");
  }

  return response.json();
}
