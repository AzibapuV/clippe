import type { TranscriptSentence } from "@/lib/assemblyai";

const ANTHROPIC_URL = process.env.CLAUDE_API_BASE_URL || "https://api.anthropic.com/v1/messages";
const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-5";
const MAX_CLIPS = 6;

export interface ClipSuggestion {
  startSec: number;
  endSec: number;
  title: string;
  score: number;
  reason: string;
}

function apiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error("ANTHROPIC_API_KEY isn't set in the environment.");
  }
  return key;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

const SYSTEM_PROMPT = `You analyze timestamped video transcripts and identify the moments most likely to work as standalone short-form clips (TikTok/Reels/Shorts style).

Look for: emotional moments, laughter, excitement, dramatic pauses, strong reactions, voice intensity shifts, keyword emphasis, compelling hooks, and self-contained conversational highlights that make sense without the rest of the video.

Respond with ONLY a JSON array, no other text, no markdown fences. Each element:
{"startSec": number, "endSec": number, "title": string, "score": number, "reason": string}

Rules:
- Use timestamps that align with the sentence boundaries provided — don't invent times outside that range.
- Each clip should be roughly 15-90 seconds long.
- "title" is a short, punchy suggested title for the clip (under 60 characters).
- "score" is 0-100, your estimate of how engaging/shareable the moment is.
- "reason" is one short sentence explaining why this moment works.
- Return at most ${MAX_CLIPS} clips, best ones first. Return fewer if the transcript doesn't have that many good moments.
- If nothing stands out, return an empty array.`;

function buildUserPrompt(sentences: TranscriptSentence[], durationSec: number): string {
  const lines = sentences
    .map((s) => `[${formatTime(s.startSec)}-${formatTime(s.endSec)}] ${s.text}`)
    .join("\n");

  return `Video duration: ${formatTime(durationSec)}\n\nTranscript:\n${lines}`;
}

function extractJsonArray(text: string): string {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("Claude's response didn't contain a JSON array.");
  }
  return text.slice(start, end + 1);
}

export async function findClipSuggestions(
  sentences: TranscriptSentence[],
  durationSec: number
): Promise<ClipSuggestion[]> {
  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey(),
      "anthropic-version": "2023-06-01",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(sentences, durationSec) }]
    })
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Claude API error (${res.status}): ${body}`);
  }

  const data = await res.json();
  const text: string = data.content?.[0]?.text ?? "";

  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJsonArray(text));
  } catch (err) {
    throw new Error(`Couldn't parse Claude's response as JSON: ${(err as Error).message}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Claude's response wasn't a JSON array.");
  }

  return parsed
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as Record<string, unknown>).startSec === "number" &&
        typeof (item as Record<string, unknown>).endSec === "number"
    )
    .map((item) => ({
      startSec: Math.max(0, Math.min(durationSec, item.startSec as number)),
      endSec: Math.max(0, Math.min(durationSec, item.endSec as number)),
      title: typeof item.title === "string" ? item.title.slice(0, 120) : "Suggested clip",
      score: Math.max(0, Math.min(100, Number(item.score) || 0)),
      reason: typeof item.reason === "string" ? item.reason.slice(0, 300) : ""
    }))
    .filter((c) => c.endSec > c.startSec)
    .slice(0, MAX_CLIPS);
}
