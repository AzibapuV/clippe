import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createClipSchema = z
  .object({
    startSec: z.number().min(0),
    endSec: z.number().min(0),
    title: z.string().max(120).optional()
  })
  .refine((data) => data.endSec > data.startSec, {
    message: "End must be after start",
    path: ["endSec"]
  });

async function getOwnedVideo(videoId: string, userId: string) {
  return prisma.video.findFirst({ where: { id: videoId, project: { userId } } });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const userId = (session.user as { id: string }).id;
  const video = await getOwnedVideo(id, userId);
  if (!video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  const clips = await prisma.clip.findMany({
    where: { videoId: video.id },
    orderBy: { startSec: "asc" }
  });

  return NextResponse.json(clips);
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
  const video = await getOwnedVideo(id, userId);
  if (!video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = createClipSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { startSec, endSec, title } = parsed.data;

  if (video.durationSec && endSec > video.durationSec) {
    return NextResponse.json(
      { error: "Clip end is past the video's duration" },
      { status: 400 }
    );
  }

  const clip = await prisma.clip.create({
    data: {
      videoId: video.id,
      startSec,
      endSec,
      title: title || null,
      status: "READY"
    }
  });

  return NextResponse.json(clip, { status: 201 });
}
