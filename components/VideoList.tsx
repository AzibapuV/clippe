"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { FileVideo, Clock, CheckCircle2, XCircle, ChevronRight } from "lucide-react";
import type { Video } from "@prisma/client";
import TimelineTrack from "@/components/TimelineTrack";

const IN_PROGRESS_STATUSES = ["PENDING", "DOWNLOADING", "TRANSCRIBING", "ANALYZING", "RENDERING"];

function StatusMarker({ status }: { status: string }) {
  if (status === "READY") {
    return <CheckCircle2 className="h-3.5 w-3.5 text-wave shrink-0" />;
  }
  if (status === "FAILED") {
    return <XCircle className="h-3.5 w-3.5 text-signal shrink-0" />;
  }
  return (
    <motion.span
      className="h-2.5 w-2.5 rounded-full bg-signal shrink-0"
      animate={{ opacity: [1, 0.4, 1], scale: [1, 1.3, 1] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
    />
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
        {videos.map((v) => {
          const inProgress = IN_PROGRESS_STATUSES.includes(v.status);
          const clickable = v.status === "READY" && v.sourceType === "UPLOAD";

          const rowInner = (
            <>
              <span
                className={`absolute left-0 top-0 bottom-0 w-1 ${
                  v.status === "READY"
                    ? "bg-wave"
                    : v.status === "FAILED"
                      ? "bg-signal"
                      : "bg-signal/50"
                }`}
              />
              <div className="flex items-center gap-3 min-w-0 pl-2">
                <FileVideo className="h-4 w-4 text-muted shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm truncate">{v.sourceUrl ?? v.storageKey ?? "Untitled video"}</p>
                  {v.statusDetail && (
                    <p className="text-xs text-muted mt-0.5">{v.statusDetail}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0 ml-3">
                {v.durationSec ? (
                  <span className="flex items-center gap-1 text-muted text-xs font-mono">
                    <Clock className="h-3 w-3" />
                    {Math.floor(v.durationSec / 60)}:{String(v.durationSec % 60).padStart(2, "0")}
                  </span>
                ) : null}
                {inProgress ? (
                  <TimelineTrack status={v.status} />
                ) : (
                  <StatusMarker status={v.status} />
                )}
                {clickable && <ChevronRight className="h-4 w-4 text-muted" />}
              </div>
            </>
          );

          const rowClass =
            "relative flex items-center justify-between border border-ink-line rounded-xl pl-4 pr-5 py-4 overflow-hidden";

          return (
            <motion.div
              key={v.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {clickable ? (
                <Link
                  href={`/videos/${v.id}`}
                  className={`${rowClass} hover:border-wave/50 transition-colors`}
                >
                  {rowInner}
                </Link>
              ) : (
                <div className={rowClass}>{rowInner}</div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
