import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import admin from "firebase-admin";
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { Type } from "@google/genai";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin (Only if credentials might be available or if we want to support it)
// For now, we'll try to initialize using environment variables or a local config if it exists
if (!admin.apps.length) {
  const projectId   = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey  = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    console.log("✓ Firebase Admin initialized successfully.");
  } else {
    const msg = "Firebase Admin credentials missing. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in .env";
    console.error(msg);
    if (process.env.NODE_ENV === 'production') {
      throw new Error(msg);
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON
  app.use(express.json({ limit: '20mb' }));

  // API routes go here
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });
  const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    simpleSummary: { type: Type.STRING },
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
  required: ["simpleSummary","keyInformation","clauses","risks","benefits","checkCarefully","questions","verdict"]
};

app.post("/api/analyze", async (req: any, res: any) => {
  const { content, docType, language } = req.body;

  if (!content || !docType) {
    return res.status(400).json({ error: "Missing content or docType" });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const systemInstruction = `
      You are an advanced AI-powered document analysis engine "LexiAnalyse".
      Analyze the provided document which is a ${docType}.
      IMPORTANT: You MUST respond in ${language || "English"}.
      All string values in the JSON output MUST be in ${language || "English"}.
      Rules:
      - Simplify complex documents into plain language.
      - Highlight risks (unfair terms, hidden conditions, penalties).
      - Provide structured output.
      - Be accurate and cautious. Do NOT hallucinate.
    `;

    const userPart = typeof content === 'string'
      ? { text: content }
      : { inlineData: { data: content.data, mimeType: content.mimeType } };

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: 'user', parts: [userPart] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: ANALYSIS_SCHEMA as any
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("Analysis error:", error);
    res.status(500).json({ error: error.message || "Analysis failed" });
  }
});

  // PayPal Token Retrieval
  const getPayPalAccessToken = async () => {
    const clientId = process.env.PAYPAL_CLIENT_ID || process.env.VITE_PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_SECRET || process.env.PAYPAL_SECRET_KEY;

    if (!clientId || !clientSecret) {
      throw new Error("PayPal credentials missing in environment variables");
    }

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    
    const response = await axios.post(
      "https://api-m.paypal.com/v1/oauth2/token",
      "grant_type=client_credentials",
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    return response.data.access_token;
  };

  // Secure PayPal Capture Endpoint
  app.post("/api/paypal/capture", async (req: any, res: any) => {
  // Get the Authorization header — the client sends "Bearer <idToken>"
  const authHeader = req.headers.authorization || "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!idToken) {
    return res.status(401).json({ error: "Unauthorized — no token provided" });
  }

  // Verify the token with Firebase Admin
  let decodedToken;
  try {
    decodedToken = await getAdminAuth().verifyIdToken(idToken);
  } catch (e) {
    return res.status(401).json({ error: "Unauthorized — invalid token" });
  }

  // Use the verified UID from the token, never from the request body
  const userId = decodedToken.uid;

  const { orderID, planName } = req.body;

  if (!orderID || !planName) {
    return res.status(400).json({ error: "Missing orderID or planName" });
  }

  try {
    const accessToken = await getPayPalAccessToken();

    const captureResponse = await axios.post(
      `https://api-m.paypal.com/v2/checkout/orders/${orderID}/capture`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (captureResponse.data.status === "COMPLETED") {
      const db = admin.firestore();
      await db.collection("users").doc(userId).update({
        plan: planName.toLowerCase(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      res.json({ status: "COMPLETED", message: "Plan upgraded successfully" });
    } else {
      res.status(400).json({ error: "Payment not completed" });
    }
  } catch (error: any) {
    console.error("PayPal Capture Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to capture PayPal payment" });
  }
});
    }

    try {
      const accessToken = await getPayPalAccessToken();
      
      // Capture the order
      const captureResponse = await axios.post(
        `https://api-m.paypal.com/v2/checkout/orders/${orderID}/capture`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (captureResponse.data.status === "COMPLETED") {
        // Update user plan in Firestore via Admin SDK
        try {
          // Check if admin is initialized properly
          if (!admin.apps.length) {
            throw new Error("Firebase Admin not initialized");
          }
          const db = admin.firestore();
          await db.collection("users").doc(userId).update({
            plan: planName.toLowerCase(),
            updatedAt: new Date().toISOString(),
          });
          
          res.json({ status: "COMPLETED", message: "Plan upgraded successfully" });
        } catch (dbError) {
          console.error("Firestore Update Error:", dbError);
          // If admin fails, the client might still try with client SDK as fallback if we don't want to break the UX
          res.status(500).json({ status: "PARTIAL", error: "Payment captured but profile update failed" });
        }
      } else {
        res.status(400).json({ error: "Payment not completed" });
      }
    } catch (error: any) {
      console.error("PayPal Capture Error:", error.response?.data || error.message);
      res.status(500).json({ error: "Failed to capture PayPal payment" });
    }
  });


  // Example API route for analysis (placeholder - Gemini should be client-side as per skill guidelines if possible, but large docs might benefit from server proxies if needed. However, the skill explicitly says 'Always call Gemini API from the frontend')
  
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    const indexPath = path.join(distPath, 'index.html');
    
    // Check if dist/index.html exists to prevent white screen
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (req.accepts('html')) {
        res.sendFile(indexPath, (err) => {
          if (err) {
            console.error("Error sending index.html. Did you run 'npm run build'?", err);
            res.status(500).send("Application not built. Please run 'npm run build' before starting the server.");
          }
        });
      } else {
        res.status(404).json({ error: "Not found" });
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
