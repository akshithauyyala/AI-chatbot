
import "dotenv/config";
import express from "express";
import Groq from "groq-sdk";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 3000;

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/chat", async (req, res) => {
  console.log("Chat request received");

  try {
    const messages = Array.isArray(req.body?.messages)
      ? req.body.messages
      : [];

    const safeMessages = messages
      .filter(
        (m) =>
          m &&
          ["user", "assistant"].includes(m.role) &&
          typeof m.content === "string" &&
          m.content.trim()
      )
      .slice(-20)
      .map((m) => ({
        role: m.role,
        content: m.content.trim().slice(0, 12000),
      }));

    if (!safeMessages.length) {
      return res.status(400).json({
        error: "Please enter a message.",
      });
    }

    console.log("Sending message to Groq...");

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content: "You are a helpful AI assistant. Answer clearly and naturally.",
        },
        ...safeMessages,
      ],
      max_tokens: 1024,
    });

    const reply = completion.choices?.[0]?.message?.content;

    console.log("Groq reply:", reply);

    return res.json({
      reply: reply || "The AI returned an empty response.",
    });
  } catch (error) {
    console.error("CHAT ERROR:", error.message);
    console.error("STATUS:", error.status);
    console.error("CODE:", error.code);

    return res.status(500).json({
      error: error.message || "Unknown server error",
    });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, () => {
  console.log(`AI chatbot running at http://localhost:${port}`);
});
