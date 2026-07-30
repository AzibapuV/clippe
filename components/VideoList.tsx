"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FileVideo, Clock, Loader2, CheckCircle2, XCircle } from "lucide-react";
import type { Video } from "@prisma/client";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  DOWNLOADING: "Downloading",
  TRANSCRIBING: "Transcribing",
  ANALYZING: "Analyzing",
  RENDERING: "Rendering",
  READY: "Ready",
  FAILED: "Failed"
};

const IN_PROGRESS_STATUSES = ["PENDING", "DOWNLOADING", "TRANSCRIBING", "ANALYZING", "RENDERING"];

function StatusBadge({ status }: { status: string }) {
  if (status === "READY") {
    return (
      <span className="flex items-center gap-1 text-wave">
        <CheckCircle2 className="h-3.5 w-3.5" /> {STATUS_LABEL[status]}
      </span>
    );
  }
  if (status === "FAILED") {
    return (
      <span className="flex items-center gap-1 text-signal">
        <XCircle className="h-3.5 w-3.5" /> {STATUS_LABEL[status]}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-muted">
      <Loader2 className="h-3.5 w-3.5 animate-spin" /> {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export default function VideoList({
  projectId,
  initialVideos
}: {
  projectId: string;
  initialVideos: Video[];
}) {
  const [videos, setVideos] = useState<Video[]>(initialVideos);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setVideos(initialVideos);
  }, [initialVideos]);

  useEffect(() => {
    const hasInProgress = videos.some((v) => IN_PROGRESS_STATUSES.includes(v.status));
    if (!hasInProgress) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/videos`);
        if (res.ok) {
          const data = await res.json();
          setVideos(data);
        }
      } catch {
        // Silent — next poll will retry.
      }
    }, 4000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [videos, projectId]);

  if (videos.length === 0) {
    return (
      <div className="border border-dashed border-ink-line rounded-xl p-10 text-center">
        <p className="text-muted text-sm">No videos yet. Add one above to get started.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <AnimatePresence initial={false}>
        {videos.map((v) => (
          <motion.div
            key={v.id}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-between border border-ink-line rounded-xl px-5 py-4"
          >
            <div className="flex items-center gap-3 min-w-0">
              <FileVideo className="h-4 w-4 text-muted shrink-0" />
              <div className="min-w-0">
                <p className="text-sm truncate">{v.sourceUrl ?? v.storageKey ?? "Untitled video"}</p>
                {v.statusDetail && (
                  <p className="text-xs text-muted mt-0.5">{v.statusDetail}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono shrink-0 ml-3">
              {v.durationSec ? (
                <span className="flex items-center gap-1 text-muted">
                  <Clock className="h-3 w-3" />
                  {Math.floor(v.durationSec / 60)}:{String(v.durationSec % 60).padStart(2, "0")}
                </span>
              ) : null}
              <StatusBadge status={v.status} />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
