// lib/aiClient.js

export async function callOpenAI(prompt, model = "gpt-4o-mini", stream = false) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OpenAI API key");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      stream,
    }),
  });

  if (!response.ok) {
    const errorDetails = await response.text();
    throw new Error(`OpenAI API error: ${errorDetails}`);
  }

  if (!stream) {
    // Normal (non-streaming) mode
    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || "";
  }

  // Streaming mode → return an async generator
  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");

  async function* streamGenerator() {
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const parts = buffer.split("\n\n");
      buffer = parts.pop(); // keep unfinished part

      for (const part of parts) {
        if (part.includes("[DONE]")) return;
        if (part.startsWith("data:")) {
          try {
            const json = JSON.parse(part.replace(/^data:\s*/, ""));
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) yield delta;
          } catch (err) {
            console.error("Stream parse error:", err);
          }
        }
      }
    }
  }

  return streamGenerator();
}
