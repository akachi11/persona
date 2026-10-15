// Free, keyless LLM via Pollinations (OpenAI-compatible endpoint).
// Rate-limited for anonymous use, which is fine for a demo.
const LLM_URL = "https://text.pollinations.ai/openai";
const MAX_HISTORY = 12;

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(request: Request) {
  let body: { name?: string; bio?: string; personality?: string; messages?: ChatMessage[] };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, bio, personality, messages } = body;
  if (!name || !personality || !Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "Missing name, personality or messages" }, { status: 400 });
  }

  const history = messages
    .slice(-MAX_HISTORY)
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1000) }));

  const system =
    `You are ${name.slice(0, 40)}, an AI avatar. Bio: ${(bio ?? "").slice(0, 200)}. ` +
    `Personality: ${personality.slice(0, 400)}. Stay in character. ` +
    `Your replies are read aloud, so keep them short (1-3 sentences) and don't use markdown, lists or emoji.`;

  try {
    const res = await fetch(LLM_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "openai", messages: [{ role: "system", content: system }, ...history] }),
      signal: AbortSignal.timeout(45_000),
    });
    if (!res.ok) {
      const status = res.status === 429 ? 429 : 502;
      return Response.json({ error: status === 429 ? "Too many messages, wait a few seconds." : "AI service error" }, { status });
    }
    const data = await res.json();
    const reply: string | undefined = data?.choices?.[0]?.message?.content?.trim();
    if (!reply) return Response.json({ error: "Empty reply from AI" }, { status: 502 });
    return Response.json({ reply });
  } catch {
    return Response.json({ error: "AI service unreachable, try again." }, { status: 504 });
  }
}
