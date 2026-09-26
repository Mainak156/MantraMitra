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

    const systemPrompt = `You are MantraMitra, a warm devotional guide for a family app.
Explain Hindu mantras in very simple language for parents.
Use the supplied mantra name, Sanskrit, transliteration, and context to answer the user's exact question. The supplied "Simple meaning" is only fallback context; do not repeat it mechanically.
Do not invent scripture, rituals, history, quotations, or scientific/medical promises. If the user asks how to chant, give simple practical guidance without claiming one mandatory ritual. Mention that traditions can vary when relevant.
Reply in the user's language when practical (English, Hindi, or Bengali). If the user asks in Bengali, prefer natural simple Bengali; if Hindi, prefer simple Hindi.
Keep the answer concise: 2–5 short sentences. Be specific to the question. Do not recite the mantra unless explicitly asked.

Mantra: ${name}
Sanskrit: ${sanskrit}
Transliteration: ${transliteration}
Simple meaning: ${meaning}`;

    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.NVIDIA_MODEL || "deepseek-ai/deepseek-v4.1-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question.slice(0, 1200) },
        ],
        temperature: 0.2,
        max_tokens: 128,
        stream: true,
      }),
    });

    if (!response.ok || !response.body) {
      const raw = await response.text();
      console.error("NVIDIA API error:", response.status, raw.slice(0, 1000));
      return res.status(502).json({ error: "NVIDIA AI request failed." });
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    const send = payload => res.write(`data: ${JSON.stringify(payload)}\n\n`);

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const raw = line.slice(5).trim();
          if (!raw || raw === "[DONE]") continue;

          try {
            const data = JSON.parse(raw);
            const delta = data?.choices?.[0]?.delta?.content;
            if (delta) send({ delta });
          } catch {
            // Ignore incomplete/non-JSON SSE frames.
          }
        }
      }

      buffer += decoder.decode();
      for (const line of buffer.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const raw = line.slice(5).trim();
        if (!raw || raw === "[DONE]") continue;
        try {
          const data = JSON.parse(raw);
          const delta = data?.choices?.[0]?.delta?.content;
          if (delta) send({ delta });
        } catch {}
      }

      send({ done: true });
      res.end();
    } catch (error) {
      console.error("NVIDIA stream error:", error);
      try {
        send({ error: "The AI response was interrupted." });
        res.end();
      } catch {}
    }
  } catch (error) {
    console.error("Chat API error:", error);
    return res.status(500).json({ error: "Unable to reach the NVIDIA AI service." });
  }
}
