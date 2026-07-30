"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FolderOpen, FileVideo } from "lucide-react";
import type { Project } from "@prisma/client";

type ProjectWithCount = Project & { _count?: { videos: number } };

export default function ProjectGrid({ projects }: { projects: ProjectWithCount[] }) {
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
      {projects.map((p, i) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: i * 0.05 }}
          whileHover={{ y: -3 }}
        >
          <Link
            href={`/projects/${p.id}`}
            className="group block relative border border-ink-line rounded-xl p-5 pt-4 overflow-hidden transition-colors hover:border-wave/50"
            style={{ transition: "box-shadow 0.25s ease, border-color 0.25s ease" }}
          >
            <div className="flex items-center gap-1 mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-signal" />
              <span className="h-1.5 w-1.5 rounded-full bg-wave" />
              <span className="h-1.5 w-1.5 rounded-full bg-ink-line group-hover:bg-muted transition-colors" />
              <span className="h-1.5 w-1.5 rounded-full bg-ink-line group-hover:bg-muted transition-colors" />
            </div>

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

            <div className="pointer-events-none absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-[0_0_24px_-6px_rgba(255,90,54,0.35)]" />
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
