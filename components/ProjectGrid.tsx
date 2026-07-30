"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FolderOpen } from "lucide-react";
import type { Project } from "@prisma/client";

export default function ProjectGrid({ projects }: { projects: Project[] }) {
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
            className="block border border-ink-line rounded-xl p-5 hover:border-wave/50 hover:shadow-lg hover:shadow-wave/5 transition-all"
          >
            <h3 className="font-display font-bold">{p.name}</h3>
            <p className="text-xs text-muted font-mono mt-2">
              {new Date(p.createdAt).toLocaleDateString()}
            </p>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
