import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { absolutePathForKey } from "@/lib/storage";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { Readable } from "stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIME_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".mkv": "video/x-matroska",
  ".avi": "video/x-msvideo"
};

function mimeForKey(storageKey: string): string {
  const ext = storageKey.slice(storageKey.lastIndexOf("."));
  return MIME_TYPES[ext] ?? "video/mp4";
}

const ownershipCache = new Map<string, { storageKey: string; expires: number }>();
const CACHE_TTL_MS = 30_000;

async function getOwnedStorageKey(videoId: string, userId: string): Promise<string | null> {
  const cacheKey = `${userId}:${videoId}`;
  const cached = ownershipCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return cached.storageKey;
  }

  const video = await prisma.video.findFirst({ where: { id: videoId, project: { userId } } });
  if (!video || !video.storageKey) return null;

  ownershipCache.set(cacheKey, { storageKey: video.storageKey, expires: Date.now() + CACHE_TTL_MS });
  return video.storageKey;
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

  const storageKey = await getOwnedStorageKey(id, userId);
  if (!storageKey) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  const absolutePath = absolutePathForKey(storageKey);

  let fileStat;
  try {
    fileStat = await stat(absolutePath);
  } catch {
    return NextResponse.json(
      { error: "The source file is missing — it may have been cleared by a server restart." },
      { status: 404 }
    );
  }

  const fileSize = fileStat.size;
  const range = req.headers.get("range");
  const mimeType = mimeForKey(storageKey);

  if (range) {
    const match = /bytes=(\d*)-(\d*)/.exec(range);
    const start = match?.[1] ? parseInt(match[1], 10) : 0;
    const end = match?.[2] ? parseInt(match[2], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    const nodeStream = createReadStream(absolutePath, { start, end });
    const webStream = Readable.toWeb(nodeStream) as ReadableStream;

    return new Response(webStream, {
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": String(chunkSize),
        "Content-Type": mimeType
      }
    });
  }

  const nodeStream = createReadStream(absolutePath);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream;

  return new Response(webStream, {
    status: 200,
    headers: {
      "Content-Length": String(fileSize),
      "Content-Type": mimeType,
      "Accept-Ranges": "bytes"
    }
  });
}
