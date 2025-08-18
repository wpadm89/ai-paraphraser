// /api/ai.js
export default async function handler(req, res) {
  // Debug mode check
  const debugMode = req.query.debug === "true";

  if (debugMode) {
    const envKeyLoaded = !!process.env.OPENAI_API_KEY;
    return res.status(200).json({
      envKeyLoaded,
      receivedBody: req.body || {},
      message: envKeyLoaded
        ? "✅ OPENAI_API_KEY is loaded correctly."
        : "❌ OPENAI_API_KEY is NOT loaded. Check your Vercel env settings.",
    });
  }

  // --- Normal production behavior ---
  const { text, mode } = req.body;

  const prompt =
    mode === "paraphrase"
      ? `Paraphrase this text in clear and simple words:\n\n${text}`
      : `Summarize this text in 3-4 bullet points:\n\n${text}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // cheap + fast
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();

    res.status(200).json({ result: data.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
}
