import { callOpenAI } from "../../lib/aiClient";

export default async function handler(req, res) {
  const { question } = req.body;
  try {
    const result = await callOpenAI(`Answer this user query clearly:\n\n${question}`);
    res.status(200).json({ answer: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
