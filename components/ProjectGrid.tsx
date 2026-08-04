"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FolderOpen, FileVideo, Trash2, Loader2 } from "lucide-react";
import type { Project } from "@prisma/client";
import { useToast } from "@/components/ToastProvider";

type ProjectWithCount = Project & { _count?: { videos: number } };

export default function ProjectGrid({ projects: initialProjects }: { projects: ProjectWithCount[] }) {
  const { showToast } = useToast();
  const [projects, setProjects] = useState(initialProjects);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function deleteProject(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error ?? "Couldn't delete that project", "error");
        setDeletingId(null);
        return;
      }
      setProjects((prev) => prev.filter((p) => p.id !== id));
      showToast("Project deleted", "success");
    } catch {
      showToast("Couldn't delete that project", "error");
    } finally {
      setDeletingId(null);
      setConfirmingId(null);
    }
  }

  if (projects.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="border border-dashed border-ink-line rounded-xl p-16 text-center flex flex-col items-center gap-3"
      >
        <FolderOpen className="h-8 w-8 text-muted" />
        <p className="text-muted text-sm">
          No projects yet. Create one and drop in a video or a link to start finding clips.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <AnimatePresence>
        {projects.map((p, i) => {
          const confirming = confirmingId === p.id;
          const deleting = deletingId === p.id;

          return (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25, delay: i * 0.05 }}
              whileHover={{ y: -3 }}
            >
              <div className="group relative border border-ink-line rounded-xl p-5 pt-4 overflow-hidden transition-colors hover:border-wave/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-signal" />
                    <span className="h-1.5 w-1.5 rounded-full bg-wave" />
                    <span className="h-1.5 w-1.5 rounded-full bg-ink-line group-hover:bg-muted transition-colors" />
                    <span className="h-1.5 w-1.5 rounded-full bg-ink-line group-hover:bg-muted transition-colors" />
                  </div>

                  {!confirming && (
                    <button
                      onClick={() => setConfirmingId(p.id)}
                      className="text-muted hover:text-signal transition-colors opacity-0 group-hover:opacity-100"
                      aria-label="Delete project"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {confirming ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm">Delete &quot;{p.name}&quot;?</p>
                    <p className="text-xs text-muted">This removes all its videos and clips too.</p>
                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={() => deleteProject(p.id)}
                        disabled={deleting}
                        className="flex items-center gap-1.5 text-xs font-medium bg-signal text-ink px-3 py-1.5 rounded-md hover:bg-signal/90 transition-colors disabled:opacity-60"
                      >
                        {deleting && <Loader2 className="h-3 w-3 animate-spin" />}
                        {deleting ? "Deleting…" : "Delete"}
                      </button>
                      <button
                        onClick={() => setConfirmingId(null)}
                        disabled={deleting}
                        className="text-xs font-medium bg-ink border border-ink-line text-muted px-3 py-1.5 rounded-md hover:text-paper transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <Link href={`/projects/${p.id}`} className="block">
                    <h3 className="font-display font-bold">{p.name}</h3>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-muted font-mono">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </p>
                      {typeof p._count?.videos === "number" && (
                        <span className="flex items-center gap-1 text-xs text-muted font-mono">
                          <FileVideo className="h-3 w-3" />
                          {p._count.videos}
                        </span>
                      )}
                    </div>
                  </Link>
                )}

                {!confirming && (
                  <div className="pointer-events-none absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-[0_0_24px_-6px_rgba(255,90,54,0.35)]" />
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
