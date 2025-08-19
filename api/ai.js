// pages/api/ai.js

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
      // Prepare SSE headers
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Call OpenAI with streaming enabled
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          stream: true,
        }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data:")) continue;

          if (trimmed === "data: [DONE]") {
            res.write("data: [DONE]\n\n");
            res.end();
            return;
          }

          try {
            const json = JSON.parse(trimmed.replace("data: ", ""));
            const token = json.choices?.[0]?.delta?.content;
            if (token) {
              res.write(`data: ${token}\n\n`);
            }
          } catch (err) {
            console.error("Stream JSON parse error:", err);
          }
        }
      }
    } else {
      // Non-streaming fallback
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await response.json();
      const result = data.choices?.[0]?.message?.content ?? "No response.";
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
