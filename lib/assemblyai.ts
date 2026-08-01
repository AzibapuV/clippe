const BASE_URL = "https://api.assemblyai.com/v2";

function apiKey(): string {
  const key = process.env.ASSEMBLYAI_API_KEY;
  if (!key) {
    throw new Error("ASSEMBLYAI_API_KEY isn't set in the environment.");
  }
  return key;
}

export interface TranscriptSentence {
  text: string;
  startSec: number;
  endSec: number;
}

export async function uploadToAssemblyAI(buffer: Buffer): Promise<string> {
  const res = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    headers: {
      authorization: apiKey(),
      "content-type": "application/octet-stream"
    },
    body: new Uint8Array(buffer)
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`AssemblyAI upload failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  return data.upload_url as string;
}

export async function submitTranscript(audioUrl: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/transcript`, {
    method: "POST",
    headers: {
      authorization: apiKey(),
      "content-type": "application/json"
    },
    body: JSON.stringify({ audio_url: audioUrl })
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`AssemblyAI transcript submission failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  return data.id as string;
}

interface PollResult {
  status: "queued" | "processing" | "completed" | "error";
  error?: string;
  audioDurationSec?: number;
}

async function getTranscriptStatus(transcriptId: string): Promise<PollResult> {
  const res = await fetch(`${BASE_URL}/transcript/${transcriptId}`, {
    headers: { authorization: apiKey() }
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`AssemblyAI status check failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  return {
    status: data.status,
    error: data.error,
    audioDurationSec: data.audio_duration
  };
}

export async function waitForTranscript(
  transcriptId: string,
  { intervalMs = 5000, maxAttempts = 120 } = {}
): Promise<{ audioDurationSec?: number }> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = await getTranscriptStatus(transcriptId);

    if (result.status === "completed") {
      return { audioDurationSec: result.audioDurationSec };
    }
    if (result.status === "error") {
      throw new Error(`AssemblyAI transcription failed: ${result.error ?? "unknown error"}`);
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error("Transcription timed out after 10 minutes.");
}

export async function getSentences(transcriptId: string): Promise<TranscriptSentence[]> {
  const res = await fetch(`${BASE_URL}/transcript/${transcriptId}/sentences`, {
    headers: { authorization: apiKey() }
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`AssemblyAI sentences fetch failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  const sentences: { text: string; start: number; end: number }[] = data.sentences ?? [];

  return sentences.map((s) => ({
    text: s.text,
    startSec: s.start / 1000,
    endSec: s.end / 1000
  }));
}
