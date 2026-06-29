import Anthropic from "@anthropic-ai/sdk";
import type { LLMTurnOutput } from "@/engine/types";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Single structured call — the only LLM call per turn.
// Returns parsed, validated output ready for reducers.
export async function callInterviewerLLM(
  system: string,
  user: string
): Promise<LLMTurnOutput> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system,
    messages: [{ role: "user", content: user }],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  // Strip any accidental markdown fences
  const clean = text.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();

  try {
    return JSON.parse(clean) as LLMTurnOutput;
  } catch {
    throw new Error(`LLM returned non-JSON: ${text.slice(0, 200)}`);
  }
}

// Streaming version — for Vapi custom LLM endpoint
export async function streamInterviewerResponse(
  system: string,
  user: string,
  onChunk: (text: string) => void
): Promise<string> {
  let full = "";

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system,
    messages: [{ role: "user", content: user }],
  });

  for await (const chunk of stream) {
    if (
      chunk.type === "content_block_delta" &&
      chunk.delta.type === "text_delta"
    ) {
      onChunk(chunk.delta.text);
      full += chunk.delta.text;
    }
  }

  return full;
}
