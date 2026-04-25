import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisSummary, DocumentType } from "../types";

/**
 * SECURITY NOTE: 
 * In this specific AI Studio environment, the GEMINI_API_KEY is securely injected 
 * and managed by the platform. For production applications intended to be shared 
 * externally, it is recommended to keep this logic on the server to prevent exposure 
 * of your secret API keys in the client-side bundle.
 */
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    simpleSummary: { type: Type.STRING, description: "A simple summary of the document in plain language." },
    keyInformation: {
      type: Type.OBJECT,
      properties: {
        parties: { type: Type.STRING },
        dates: { type: Type.STRING },
        paymentTerms: { type: Type.STRING },
        responsibilities: { type: Type.STRING },
      },
      required: ["parties", "dates", "paymentTerms", "responsibilities"]
    },
    clauses: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          section: { type: Type.STRING },
          description: { type: Type.STRING },
        },
        required: ["title", "section", "description"]
      }
    },
    risks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
        },
        required: ["title", "description"]
      }
    },
    benefits: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
        },
        required: ["title", "description"]
      }
    },
    checkCarefully: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
        },
        required: ["title", "description"]
      }
    },
    questions: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    verdict: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.STRING },
        reasoning: { type: Type.STRING },
        confidence: { type: Type.NUMBER },
      },
      required: ["score", "reasoning", "confidence"]
    }
  },
  required: [
    "simpleSummary", 
    "keyInformation", 
    "clauses", 
    "risks", 
    "benefits", 
    "checkCarefully", 
    "questions", 
    "verdict"
  ]
};

export async function analyzeDocument(
  content: string | { data: string; mimeType: string },
  docType: DocumentType,
  language: string = "English"
): Promise<AnalysisSummary> {
  const modelName = "gemini-3-flash-preview";

  const systemInstruction = `
    You are an advanced AI-powered document analysis engine "LexiAnalyse".
    Analyze the provided document which is a ${docType}.
    
    IMPORTANT: You MUST respond in ${language}. 
    All string values in the JSON output (summaries, clauses, risks, etc.) MUST be translated into ${language}.
    
    Follow these rules:
    - Simplify complex documents into plain language in ${language}.
    - Highlight risks (unfair terms, hidden conditions, penalties).
    - Provide structured output.
    - Disclaimer: Include that this is an AI-generated explanation and not a substitute for professional legal advice.
    - Be accurate and cautious.
    - Do NOT hallucinate.
  `;

  let userPart: any;
  if (typeof content === 'string') {
    userPart = { text: content };
  } else {
    userPart = {
      inlineData: {
        data: content.data,
        mimeType: content.mimeType
      }
    };
  }

  const response = await ai.models.generateContent({
    model: modelName,
    contents: [{ role: 'user', parts: [userPart] }],
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: ANALYSIS_SCHEMA as any
    }
  });

  const text = response.text;
  if (!text) {
    throw new Error("Empty response from AI");
  }

  return JSON.parse(text);
}
