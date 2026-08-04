import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { unlink } from "fs/promises";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { absolutePathForKey } from "@/lib/storage";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const userId = (session.user as { id: string }).id;

  const project = await prisma.project.findFirst({
    where: { id, userId },
    include: { videos: true }
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  await Promise.all(
    project.videos
      .filter((v: { storageKey: string | null }) => v.storageKey)
      .map((v: { storageKey: string | null }) => unlink(absolutePathForKey(v.storageKey!)).catch(() => {}))
  );

  await prisma.project.delete({ where: { id: project.id } });

  return NextResponse.json({ ok: true });
}
