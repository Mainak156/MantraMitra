export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "NVIDIA_API_KEY is not configured on the server." });
  }

  try {
    const body = req.body || {};
    const question = typeof body.question === "string" ? body.question.trim() : "";
    const mantra = body.mantra || {};

    if (!question) {
      return res.status(400).json({ error: "A question is required." });
    }

    const name = String(mantra.name || "Unknown mantra").slice(0, 200);
    const sanskrit = String(mantra.sanskrit || "").slice(0, 2000);
    const transliteration = String(mantra.transliteration || "").slice(0, 1000);
    const meaning = String(mantra.meaning || "").slice(0, 2000);

    const systemPrompt = `You are MantraMitra, a warm and respectful devotional guide for a family app.

Explain Hindu mantras in very simple, clear language that parents can easily understand.
Use the supplied mantra information as the primary context.
Do not invent scripture, quotations, rituals, historical claims, or religious promises.
Do not present devotional beliefs as scientific facts.
When traditions differ, say that practices or interpretations can vary.
Do not give medical, financial, or other professional advice.
Keep answers concise unless the user asks for detail.
Reply in the language the user uses when practical (English, Hindi, or Bengali).
Never recite the mantra unless the user explicitly asks for the text.

Current mantra:
Name: ${name}
Sanskrit: ${sanskrit}
Transliteration: ${transliteration}
Simple meaning already provided by MantraMitra: ${meaning}`;

    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.NVIDIA_MODEL || "openai/gpt-oss-20b",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question.slice(0, 2000) },
        ],
        temperature: 0.4,
        top_p: 0.9,
        max_tokens: 500,
        stream: false,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("NVIDIA API error:", response.status, data);
      return res.status(502).json({ error: "NVIDIA AI request failed." });
    }

    const answer = data?.choices?.[0]?.message?.content?.trim();

    if (!answer) {
      return res.status(502).json({ error: "NVIDIA AI returned an empty response." });
    }

    return res.status(200).json({ answer });
  } catch (error) {
    console.error("Chat API error:", error);
    return res.status(500).json({ error: "Unable to reach the NVIDIA AI service." });
  }
}
