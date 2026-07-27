import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Project } from "@prisma/client";
import { Scissors, FolderPlus, Clock } from "lucide-react";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const userId = (session.user as { id: string }).id;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 10
  });

  const creditMinutes = Math.floor((user?.creditSeconds ?? 0) / 60);

  return (
    <main className="min-h-screen bg-ink text-paper">
      <header className="border-b border-ink-line/60">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <Scissors className="h-5 w-5 text-signal" />
            <span className="font-display font-bold text-lg">Clippers Creator</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted">
            <span className="font-mono flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> {creditMinutes} min left
            </span>
            <span>{user?.email}</span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display font-bold text-2xl">Your projects</h1>
          <button className="flex items-center gap-2 bg-signal text-ink text-sm font-medium px-4 py-2.5 rounded-md hover:bg-signal/90 transition-colors">
            <FolderPlus className="h-4 w-4" /> New project
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="border border-dashed border-ink-line rounded-xl p-16 text-center">
            <p className="text-muted text-sm">
              No projects yet. Create one and drop in a video or a link to start finding clips.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {projects.map((p: Project) => (
              <div key={p.id} className="border border-ink-line rounded-xl p-5 hover:border-wave/50 transition-colors">
                <h3 className="font-display font-bold">{p.name}</h3>
                <p className="text-xs text-muted font-mono mt-2">
                  {new Date(p.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
