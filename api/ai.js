import OpenAI from "openai";

export default async function handler(req, res) {
  try {
    const { text, mode } = req.body;

    const prompt =
      mode === "paraphrase"
        ? `Paraphrase this text in clear and simple words:\n\n${text}`
        : `Summarize this text in 3-4 bullet points:\n\n${text}`;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      stream: true,
    });

    res.writeHead(200, {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    });

    for await (const chunk of completion) {
      res.write(chunk.choices[0]?.delta?.content || "");
    }

    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).send("Something went wrong");
  }
}
