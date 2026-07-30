import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  const clip = await prisma.clip.findFirst({
    where: { id, video: { project: { userId } } }
  });

  if (!clip) {
    return NextResponse.json({ error: "Clip not found" }, { status: 404 });
  }

  await prisma.clip.delete({ where: { id: clip.id } });

  return NextResponse.json({ ok: true });
}
