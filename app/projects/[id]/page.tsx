import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Scissors } from "lucide-react";
import AddVideoForm from "@/components/AddVideoForm";
import DeleteProjectButton from "@/components/DeleteProjectButton";
import VideoList from "@/components/VideoList";

export default async function ProjectPage({
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
  const project = await prisma.project.findFirst({
    where: { id, userId },
    include: { videos: { orderBy: { createdAt: "desc" } } }
  });

  if (!project) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-ink text-paper">
      <header className="border-b border-ink-line/60">
        <div className="max-w-4xl mx-auto flex items-center gap-3 px-6 py-5">
          <Link href="/dashboard" className="text-muted hover:text-paper transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Scissors className="h-5 w-5 text-signal" />
          <span className="font-display font-bold text-lg">Clippers Creator</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12 flex flex-col gap-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-2xl">{project.name}</h1>
            <p className="text-xs text-muted font-mono mt-1">
              Created {new Date(project.createdAt).toLocaleDateString()}
            </p>
          </div>
          <DeleteProjectButton projectId={project.id} projectName={project.name} />
        </div>

        <AddVideoForm projectId={project.id} />

        <div className="flex flex-col gap-3">
          <h2 className="font-display font-bold text-sm text-muted tracking-wide uppercase">
            Videos
          </h2>
          <VideoList projectId={project.id} initialVideos={project.videos} />
        </div>
      </div>
    </main>
  );
}
