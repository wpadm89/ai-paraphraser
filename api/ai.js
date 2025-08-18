// /api/ai.js
export default async function handler(req, res) {
  if (req.query.debug === "true") {
    return res.status(200).json({ envKeyLoaded: !!process.env.OPENAI_API_KEY });
  }

  try {
    const { text, mode } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "API key missing" });
    }

    let prompt = "";

    if (mode === "paraphrase") {
      prompt = `Paraphrase the following text in clear, natural English:\n\n${text}`;
    } else if (mode === "summarize") {
      prompt = `Summarize the following text into **exactly 5–7 concise bullet points**.
Each bullet point should start with "•" and be clear, simple, and easy to read:\n\n${text}`;
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // ✅ lightweight & fast
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    res.status(200).json({ result: data.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
