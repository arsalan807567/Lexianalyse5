import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import admin from "firebase-admin";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin (Only if credentials might be available or if we want to support it)
// For now, we'll try to initialize using environment variables or a local config if it exists
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(), // This works in Cloud Run if roles are set
    });
  }
} catch (error) {
  console.warn("Firebase Admin failed to initialize with default credentials. Plan updates will need manual handling or service account config.");
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
    const { orderID, planName, userId } = req.body;
    
    if (!orderID || !planName || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
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
