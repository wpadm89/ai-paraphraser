// pages/api/ai.js
import { callOpenAI } from "../../lib/aiClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text, mode, stream } = req.body;
  if (!text || !mode) {
    return res.status(400).json({ error: "Missing text or mode" });
  }

  let prompt;
  if (mode === "paraphrase") {
    prompt = `Paraphrase the following text in clear, simple English:\n\n${text}`;
  } else if (mode === "summarize") {
    prompt = `Summarize the following text into 5–7 concise bullet points (each starting with •):\n\n${text}`;
  } else if (mode === "citation") {
    prompt = `Generate a proper citation (APA style preferred) for the following text or source:\n\n${text}\n\nIf incomplete, return the best possible formatted citation.`;
  } else {
    return res.status(400).json({ error: "Invalid mode" });
  }

  try {
    if (stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const generator = await callOpenAI(prompt, "gpt-4o-mini", true);
      for await (const chunk of generator) {
        res.write(`data: ${chunk}\n\n`);
      }
      res.write("data: [DONE]\n\n");
      res.end();
    } else {
      const result = await callOpenAI(prompt);
      res.status(200).json({ result });
    }
  } catch (error) {
    console.error("AI API error:", error);
    if (stream) {
      res.write(`data: ERROR: ${error.message}\n\n`);
      res.end();
    } else {
      res.status(500).json({ error: error.message });
    }
  }
}
