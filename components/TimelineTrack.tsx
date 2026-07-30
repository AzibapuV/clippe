"use client";

import { motion } from "framer-motion";

const STAGES = ["PENDING", "DOWNLOADING", "TRANSCRIBING", "ANALYZING", "RENDERING", "READY"] as const;

const STAGE_LABEL: Record<(typeof STAGES)[number], string> = {
  PENDING: "Queued",
  DOWNLOADING: "Downloading",
  TRANSCRIBING: "Transcribing",
  ANALYZING: "Finding moments",
  RENDERING: "Rendering",
  READY: "Ready"
};

export default function TimelineTrack({ status }: { status: string }) {
  const stageIndex = STAGES.indexOf(status as (typeof STAGES)[number]);
  const activeIndex = stageIndex === -1 ? 0 : stageIndex;
  const isDone = status === "READY";

  return (
    <div className="flex items-center gap-3 w-full max-w-[260px]">
      <div className="relative flex-1 h-1 rounded-full bg-ink-line overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-wave"
          initial={{ width: 0 }}
          animate={{ width: `${(activeIndex / (STAGES.length - 1)) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
        {!isDone && (
          <motion.div
            className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-paper/40 to-transparent"
            animate={{ left: ["-10%", "110%"] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </div>
      <span className="text-xs font-mono text-muted whitespace-nowrap">
        {STAGE_LABEL[STAGES[activeIndex]]}
      </span>
    </div>
  );
}
