import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { readFile } from "fs/promises";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { absolutePathForKey } from "@/lib/storage";
import { uploadToAssemblyAI, submitTranscript, waitForTranscript, getSentences } from "@/lib/assemblyai";
import { findClipSuggestions } from "@/lib/claude";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function runAnalysis(videoId: string) {
  try {
    const video = await prisma.video.findUnique({ where: { id: videoId } });
    if (!video || !video.storageKey) throw new Error("Video file not found");

    await prisma.video.update({
      where: { id: videoId },
      data: { status: "TRANSCRIBING", statusDetail: "Uploading to AssemblyAI…" }
    });

    const buffer = await readFile(absolutePathForKey(video.storageKey));
    const uploadUrl = await uploadToAssemblyAI(buffer);
    const transcriptId = await submitTranscript(uploadUrl);

    await prisma.video.update({
      where: { id: videoId },
      data: { statusDetail: "Transcribing audio…" }
    });

    const { audioDurationSec } = await waitForTranscript(transcriptId);
    const durationSec = video.durationSec ?? audioDurationSec ?? 0;

    await prisma.video.update({
      where: { id: videoId },
      data: { status: "ANALYZING", statusDetail: "Finding clip-worthy moments…" }
    });

    const sentences = await getSentences(transcriptId);
    const transcriptText = sentences.map((s) => s.text).join(" ");
    const suggestions = await findClipSuggestions(sentences, durationSec);

    await prisma.$transaction([
      prisma.video.update({
        where: { id: videoId },
        data: { transcript: transcriptText }
      }),
      ...suggestions.map((s) =>
        prisma.clip.create({
          data: {
            videoId,
            startSec: s.startSec,
            endSec: s.endSec,
            title: s.title,
            score: s.score,
            scoreBreakdown: { reason: s.reason },
            status: "READY"
          }
        })
      )
    ]);

    await prisma.video.update({
      where: { id: videoId },
      data: {
        status: "READY",
        statusDetail:
          suggestions.length > 0
            ? `AI found ${suggestions.length} clip${suggestions.length === 1 ? "" : "s"}`
            : "AI didn't find any standout moments in this video"
      }
    });
  } catch (err) {
    console.error("Video analysis failed:", err);
    await prisma.video
      .update({
        where: { id: videoId },
        data: {
          status: "FAILED",
          statusDetail: `AI analysis failed: ${(err as Error).message}`.slice(0, 300)
        }
      })
      .catch(() => {});
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const userId = (session.user as { id: string }).id;

  const video = await prisma.video.findFirst({
    where: { id, project: { userId } }
  });

  if (!video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }
  if (video.sourceType !== "UPLOAD" || !video.storageKey) {
    return NextResponse.json(
      { error: "Only uploaded video files can be analyzed right now" },
      { status: 400 }
    );
  }
  if (video.status === "TRANSCRIBING" || video.status === "ANALYZING") {
    return NextResponse.json({ error: "Analysis is already in progress" }, { status: 409 });
  }

  await prisma.video.update({
    where: { id: video.id },
    data: { status: "TRANSCRIBING", statusDetail: "Starting…" }
  });

  void runAnalysis(video.id);

  return NextResponse.json({ status: "TRANSCRIBING" }, { status: 202 });
}
