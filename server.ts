import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Supabase setup for secure backend checks
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  let supabase: any = null;
  if (supabaseUrl && supabaseUrl.startsWith("http") && supabaseKey) {
    try {
      supabase = createClient(supabaseUrl, supabaseKey);
    } catch (err) {
      console.warn("Failed to initialize Supabase client gracefully:", err);
    }
  } else {
    console.warn("Supabase credentials not fully configured in backend environment variables. Backend database functionality is disabled.");
  }

  // Stripe setup for webhook
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
  const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

  // Stripe webhook MUST use raw body parser
  app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (request, response) => {
    if (!stripe) {
       return response.status(400).send("Stripe is not configured");
    }
    const sig = request.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(request.body, sig as string, endpointSecret);
    } catch (err: any) {
      console.error("Webhook Error", err);
      response.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    // Handle successful payment
    if (event.type === 'checkout.session.completed' || event.type === 'invoice.paid') {
      const dataObject = event.data.object as any;
      // Get the userId. Usually passed in client_reference_id or metadata during checkout creation
      const userId = dataObject.client_reference_id || dataObject.metadata?.userId;
      
      if (userId && supabase) {
        console.log(`Payment verified for user ${userId}. Upgrading to premium...`);
        const { error } = await supabase
           .from('users')
           .update({ is_premium: true })
           .eq('id', userId);
        
        if (error) {
           console.error("Failed to upgrade user via webhook:", error);
        }
      }
    }

    response.send();
  });

  // Paystack Webhook
  app.post('/api/paystack/webhook', express.json(), async (request, response) => {
    const signature = request.headers['x-paystack-signature'];
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY || "";
    
    // In production we verify signature
    if (signature && paystackSecret) {
      const crypto = await import("crypto");
      const hash = crypto.createHmac('sha512', paystackSecret)
                         .update(JSON.stringify(request.body))
                         .digest('hex');
      if (hash !== signature) {
        console.warn("[Paystack Webhook] signature mismatch");
        return response.status(400).send("Invalid signature");
      }
    }

    const event = request.body;
    console.log(`[Paystack Webhook] Received Event: ${event?.event}`);

    if (event && event.event === 'charge.success') {
      const reference = event.data?.reference;
      const email = event.data?.customer?.email;
      const metadataUserId = event.data?.metadata?.userId;

      console.log(`[Paystack Webhook] Successful transaction ${reference} for ${email}`);

      if (metadataUserId && supabase) {
        console.log(`[Paystack Webhook] Upgrading user ${metadataUserId} to Premium...`);
        const { error } = await supabase
          .from('users')
          .update({ is_premium: true })
          .eq('id', metadataUserId);
        
        if (error) {
          console.error("[Paystack Webhook] Failed to update user premium status:", error);
        }
      } else if (email && supabase) {
        console.warn("[Paystack Webhook] No metadata.userId. Finding user by email...");
        const { data: userRecord, error: findError } = await supabase
          .from('users')
          .select('id')
          .eq('email', email)
          .maybeSingle();

        if (!findError && userRecord) {
          console.log(`[Paystack Webhook] Found user ${userRecord.id} by email. Upgrading...`);
          await supabase
            .from('users')
            .update({ is_premium: true })
            .eq('id', userRecord.id);
        }
      }
    }

    response.status(200).send("OK");
  });

  // Paystack Manual Verification Route
  app.post('/api/paystack/verify', express.json(), async (req, res) => {
    const { reference, userId } = req.body;
    if (!reference) {
      return res.status(400).json({ error: "Reference is required" });
    }

    try {
      const paystackSecret = process.env.PAYSTACK_SECRET_KEY || "";
      if (!paystackSecret) {
        return res.status(400).json({ error: "PAYSTACK_SECRET_KEY is not configured on the server. Please add it to your Environment Variables." });
      }

      const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Paystack API returned status ${response.status}`);
      }

      const verified = await response.json();
      if (verified.status && verified.data?.status === 'success') {
        const metUserId = verified.data.metadata?.userId || userId;
        if (metUserId && supabase) {
          console.log(`[Paystack Verify] Verified reference ${reference}. Upgrading user: ${metUserId}`);
          await supabase
            .from('users')
            .update({ is_premium: true })
            .eq('id', metUserId);
        }
        return res.json({ status: "success", data: verified.data });
      } else {
        return res.status(400).json({ error: "Verification status is not success", data: verified });
      }
    } catch (err: any) {
      console.error("[Paystack Verify Route Error]:", err);
      return res.status(500).json({ error: err.message || "Failed to verify transaction with backend Paystack router." });
    }
  });

  // Regular JSON body parser for other routes
  app.use(express.json({ limit: "50mb" }));

  // Initialize Gemini client
  let gemini: GoogleGenAI | null = null;
  const getGemini = () => {
    if (!gemini) {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not set.");
      }
      gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    return gemini;
  };

  // Middleware to verify user premium status securely from Database
  const requirePremium = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
     try {
        const { userId, isPremium: clientIsPremium } = req.body;
        if (!userId) {
           return res.status(403).json({ error: "Unauthorized. User ID is required to verify premium status." });
        }
        
        let isDbPremium = false;
        if (supabase) {
           try {
              // Secure backend database check
              const { data: user, error } = await supabase
                 .from('users')
                 .select('is_premium')
                 .eq('id', userId)
                 .maybeSingle();
                 
              if (!error && user && user.is_premium === true) {
                 isDbPremium = true;
              }
           } catch (dbErr) {
              console.warn("DB is_premium check failed, falling back.", dbErr);
           }
        }

        const isUserPremium = isDbPremium || (clientIsPremium === true && process.env.NODE_ENV !== "production") || !supabase;

        if (isUserPremium) {
           return next();
        }

        // Free User Welcome Tokens tracking inside general budgets ledger
        let tokenRecord: any = null;
        if (supabase) {
           try {
              let { data: fetchedRecord, error: fetchErr } = await supabase
                 .from('budgets')
                 .select('*')
                 .eq('user_id', userId)
                 .eq('category', '__AI_TOKENS__')
                 .maybeSingle();

              if (!fetchErr && fetchedRecord) {
                 tokenRecord = fetchedRecord;
              } else if (!fetchErr && !fetchedRecord) {
                 const { data: newRecord, error: insertErr } = await supabase
                    .from('budgets')
                    .insert({
                       user_id: userId,
                       category: '__AI_TOKENS__',
                       amount: 5,
                       period: 'all-time'
                    })
                    .select()
                    .maybeSingle();
                 
                 if (!insertErr) {
                    tokenRecord = newRecord;
                 }
              }
           } catch (tokenErr) {
              console.error("AI token processing failed:", tokenErr);
           }
        }

        const tokensRemaining = tokenRecord ? Math.max(0, Number(tokenRecord.amount)) : 5;

        if (tokensRemaining <= 0) {
           return res.status(403).json({ 
              error: "token_limit_reached", 
              message: "You’ve seen the magic. Upgrade to Pro for unlimited AI automated accounting." 
           });
        }

        (req as any).tokenRecordId = tokenRecord ? tokenRecord.id : null;
        (req as any).tokensRemaining = tokensRemaining;
        next();
     } catch (err: any) {
        res.status(500).json({ error: "Failed to verify payment status." });
     }
  };

  // API endpoints
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/gemini/chat", requirePremium, async (req, res) => {
    try {
      const { userMessage, systemInstruction, userId } = req.body;
      const ai = getGemini();
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userMessage,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      // Decrement tokens upon successful generation
      if ((req as any).tokenRecordId && supabase) {
         const newAmount = Math.max(0, (req as any).tokensRemaining - 1);
         await supabase
            .from('budgets')
            .update({ amount: newAmount })
            .eq('id', (req as any).tokenRecordId);
         console.log(`[AI Tokens] User ${userId} consumed 1 welcome token. Remaining: ${newAmount}`);
      }

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini Chat Error:", error);
      if (error.status === 401 || error.message?.includes('API key')) {
        res.status(401).json({ error: "Your Gemini API Key is invalid. Please update it in the AI Studio settings." });
      } else if (error.status === 429) {
        res.status(429).json({ error: "Our AI service is currently experiencing high demand. Please try again in a moment." });
      } else {
        res.status(500).json({ error: error.message || "Failed to communicate with AI" });
      }
    }
  });

  app.post("/api/gemini/generate", requirePremium, async (req, res) => {
    try {
      const { contents, config, userId } = req.body;
      const ai = getGemini();
      
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config,
      });

      // Decrement tokens upon successful generation
      if ((req as any).tokenRecordId && supabase) {
         const newAmount = Math.max(0, (req as any).tokensRemaining - 1);
         await supabase
            .from('budgets')
            .update({ amount: newAmount })
            .eq('id', (req as any).tokenRecordId);
         console.log(`[AI Tokens] User ${userId} consumed 1 welcome token. Remaining: ${newAmount}`);
      }

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini Generate Error:", error);
      if (error.status === 401 || error.message?.includes('API key')) {
        res.status(401).json({ error: "Your Gemini API Key is invalid. Please update it in the AI Studio settings." });
      } else if (error.status === 429) {
        res.status(429).json({ error: "Our AI service is currently experiencing high demand. Please try again in a moment." });
      } else {
        res.status(500).json({ error: error.message || "Failed to parse with AI" });
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
