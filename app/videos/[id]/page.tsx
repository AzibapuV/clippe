import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Scissors } from "lucide-react";
import ClipEditor from "@/components/ClipEditor";

export default async function VideoEditorPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const userId = (session.user as { id: string }).id;

  const video = await prisma.video.findFirst({
    where: { id, project: { userId } },
    include: { clips: { orderBy: { startSec: "asc" } }, project: true }
  });

  if (!video) {
    notFound();
  }

  const playable = video.sourceType === "UPLOAD" && !!video.storageKey;

  return (
    <main className="min-h-screen bg-ink text-paper">
      <header className="border-b border-ink-line/60">
        <div className="max-w-4xl mx-auto flex items-center gap-3 px-6 py-5">
          <Link
            href={`/projects/${video.projectId}`}
            className="text-muted hover:text-paper transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Scissors className="h-5 w-5 text-signal" />
          <span className="font-display font-bold text-lg">Clippers Creator</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12 flex flex-col gap-6">
        <div>
          <p className="text-xs text-muted font-mono">{video.project.name}</p>
          <h1 className="font-display font-bold text-2xl truncate">
            {video.storageKey ?? video.sourceUrl ?? "Untitled video"}
          </h1>
        </div>

        {playable ? (
          <ClipEditor
            videoId={video.id}
            videoSrc={`/api/videos/${video.id}/file`}
            initialDurationSec={video.durationSec}
            initialStatus={video.status}
            initialStatusDetail={video.statusDetail}
            initialClips={video.clips.map(
              (c: {
                id: string;
                startSec: number;
                endSec: number;
                title: string | null;
                score: number | null;
                scoreBreakdown: unknown;
              }) => ({
                id: c.id,
                startSec: c.startSec,
                endSec: c.endSec,
                title: c.title,
                score: c.score,
                scoreBreakdown: c.scoreBreakdown as { reason?: string } | null
              })
            )}
          />
        ) : (
          <div className="border border-dashed border-ink-line rounded-xl p-10 text-center">
            <p className="text-muted text-sm">
              This video was imported from a link, which isn&apos;t downloaded yet —
              only uploaded video files can be clipped right now.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
