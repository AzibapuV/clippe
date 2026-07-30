import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Scissors, Clock } from "lucide-react";
import NewProjectModal from "@/components/NewProjectModal";
import ProjectGrid from "@/components/ProjectGrid";

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
          <NewProjectModal />
        </div>

        <ProjectGrid projects={projects} />
      </div>
    </main>
  );
}
