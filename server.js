import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 3000;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ===== API KEYS =====
const apiKeys = [
  process.env.GROQ_KEY_1,
  process.env.GROQ_KEY_2,
  process.env.GROQ_KEY_3
];

// ===== AI CALL WITH FALLBACK =====
async function callAIWithFallback(userPrompt) {
  let lastError;

  for (let i = 0; i < apiKeys.length; i++) {
    const key = apiKeys[i];
    if (!key) continue;

    try {
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [
              {
                role: "system",
                content: "You are an AI email assistant that writes helpful business replies."
              },
              {
                role: "user",
                content: userPrompt
              }
            ],
            temperature: 0.7,
          }),
        }
      );

      const data = await response.json();
      const reply = data?.choices?.[0]?.message?.content;

      if (reply) {
        console.log(`✅ Working API key index: ${i}`);
        return reply;
      }

      lastError = data;

    } catch (err) {
      console.log(`❌ Key ${i} failed`);
      lastError = err;
    }
  }

  throw new Error("All API keys failed: " + (lastError?.message || ""));
}

// ===== MIDDLEWARE =====
app.use(express.json());
app.use(express.static(__dirname));

// ===== MAIN ROUTE =====
app.post("/generate", async (req, res) => {
  try {
    const { email, tone, memory } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Missing email" });
    }

    const userPrompt = `
You are a professional AI customer support assistant.
You have to promote the shop so the customers actually want to buy the product.
Your job is to write ONE clean email reply.

RULES:
- Never repeat sentences
- Never invent fake company information
- Never create fake phone numbers or emails
- Never create fake dates
- Never change the business information
- Only use the memory you have (if you have it) and only use the bussiness information
- Keep replies short and natural
- Sound human, not robotic
- Only answer the customer's question directly
- Use the business info only if relevant
- Do NOT add marketing language
- Do NOT ramble
- Do NOT add unnecessary greetings multiple times

BUSINESS INFO:
Shop Name: ${memory?.shopName || "Business"}
Category: ${memory?.businessCategory || ""}
Hours: ${memory?.businessHours || ""}
Policies: ${memory?.policies || ""}
Products: ${memory?.products || ""}
Extra Info: ${memory?.extraInfo || ""}

CUSTOMER EMAIL:
${email}

TONE:
${tone}

Write the final reply now.
`;

    const reply = await callAIWithFallback(userPrompt);

    return res.json({ reply });

  } catch (err) {
    console.error("SERVER ERROR:", err);

    return res.status(500).json({
      error: err.message || "Server error"
    });
  }
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
