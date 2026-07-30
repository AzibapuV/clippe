import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveUploadedVideo } from "@/lib/storage";
import type { SourceType } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_UPLOAD_BYTES = 500 * 1024 * 1024; // 500MB safety cap

const urlImportSchema = z.object({
  url: z.string().url("Enter a valid URL")
});

function detectSourceType(url: string): SourceType {
  let host = "";
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "YOUTUBE";
  }
  if (host.includes("youtube.com") || host.includes("youtu.be")) return "YOUTUBE";
  if (host.includes("tiktok.com")) return "TIKTOK";
  if (host.includes("instagram.com")) return "INSTAGRAM";
  if (host.includes("facebook.com") || host.includes("fb.watch")) return "FACEBOOK";
  if (host.includes("twitter.com") || host.includes("x.com")) return "TWITTER";
  if (host.includes("vimeo.com")) return "VIMEO";
  if (host.includes("twitch.tv")) return "TWITCH";
  return "YOUTUBE";
}

async function getOwnedProject(projectId: string, userId: string) {
  return prisma.project.findFirst({ where: { id: projectId, userId } });
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
  const project = await getOwnedProject(id, userId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const videos = await prisma.video.findMany({
    where: { projectId: project.id },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(videos);
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
  const project = await getOwnedProject(id, userId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    const durationField = form.get("durationSec");
    const durationSec =
      typeof durationField === "string" ? Math.round(parseFloat(durationField)) : null;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!file.type.startsWith("video/")) {
      return NextResponse.json({ error: "File must be a video" }, { status: 400 });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "File is larger than 500MB" }, { status: 400 });
    }

    const video = await prisma.video.create({
      data: { projectId: project.id, sourceType: "UPLOAD", status: "PENDING" }
    });

    try {
      const { storageKey } = await saveUploadedVideo(file);

      const updated = await prisma.video.update({
        where: { id: video.id },
        data: {
          storageKey,
          durationSec: durationSec && durationSec > 0 ? durationSec : null,
          status: "READY"
        }
      });

      return NextResponse.json(updated, { status: 201 });
    } catch (err) {
      await prisma.video.update({
        where: { id: video.id },
        data: { status: "FAILED", statusDetail: "Could not save the uploaded file" }
      });
      return NextResponse.json({ error: "Could not save the uploaded file" }, { status: 500 });
    }
  }

  const body = await req.json();
  const parsed = urlImportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const video = await prisma.video.create({
    data: {
      projectId: project.id,
      sourceType: detectSourceType(parsed.data.url),
      sourceUrl: parsed.data.url,
      status: "PENDING",
      statusDetail: "Queued — downloading isn't wired up yet (Phase 3)"
    }
  });

  return NextResponse.json(video, { status: 201 });
}
