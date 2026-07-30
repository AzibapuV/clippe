"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Play,
  Pause,
  Scissors,
  Trash2,
  Loader2,
  SkipBack,
  SkipForward
} from "lucide-react";
import { useToast } from "@/components/ToastProvider";

interface ClipData {
  id: string;
  startSec: number;
  endSec: number;
  title: string | null;
}

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

const MIN_CLIP_LEN = 1;

export default function ClipEditor({
  videoId,
  videoSrc,
  initialDurationSec,
  initialClips
}: {
  videoId: string;
  videoSrc: string;
  initialDurationSec: number | null;
  initialClips: ClipData[];
}) {
  const { showToast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const previewEndRef = useRef<number | null>(null);

  const [duration, setDuration] = useState(initialDurationSec ?? 0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [selStart, setSelStart] = useState(0);
  const [selEnd, setSelEnd] = useState(Math.min(10, initialDurationSec ?? 10));
  const [dragging, setDragging] = useState<"start" | "end" | null>(null);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [clips, setClips] = useState<ClipData[]>(initialClips);

  const clientXToSeconds = useCallback(
    (clientX: number) => {
      if (!trackRef.current || duration <= 0) return 0;
      const rect = trackRef.current.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      return ratio * duration;
    },
    [duration]
  );

  useEffect(() => {
    if (!dragging) return;

    function onMove(e: PointerEvent) {
      const t = clientXToSeconds(e.clientX);
      if (dragging === "start") {
        setSelStart(Math.min(t, selEnd - MIN_CLIP_LEN));
      } else {
        setSelEnd(Math.max(t, selStart + MIN_CLIP_LEN));
      }
    }
    function onUp() {
      setDragging(null);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragging, clientXToSeconds, selStart, selEnd]);

  function handleLoadedMetadata() {
    const d = videoRef.current?.duration;
    if (d && Number.isFinite(d)) {
      setDuration(d);
      setSelEnd((prev) => (prev > d ? d : prev));
    }
  }

  function handleTimeUpdate() {
    const t = videoRef.current?.currentTime ?? 0;
    setCurrentTime(t);
    if (previewEndRef.current !== null && t >= previewEndRef.current) {
      videoRef.current?.pause();
      previewEndRef.current = null;
    }
  }

  function seekTo(t: number) {
    if (videoRef.current) {
      videoRef.current.currentTime = t;
      setCurrentTime(t);
    }
  }

  function togglePlay() {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      previewEndRef.current = null;
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  }

  function previewSelection() {
    if (!videoRef.current) return;
    previewEndRef.current = selEnd;
    videoRef.current.currentTime = selStart;
    videoRef.current.play();
  }

  function handleTrackClick(e: React.MouseEvent) {
    if (dragging) return;
    const t = clientXToSeconds(e.clientX);
    seekTo(t);
  }

  async function saveClip() {
    setSaving(true);
    try {
      const res = await fetch(`/api/videos/${videoId}/clips`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startSec: selStart,
          endSec: selEnd,
          title: title.trim() || undefined
        })
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error ?? "Couldn't save that clip", "error");
        setSaving(false);
        return;
      }

      setClips((prev) => [...prev, data].sort((a, b) => a.startSec - b.startSec));
      setTitle("");
      showToast("Clip saved", "success");
      setSaving(false);
    } catch {
      showToast("Couldn't save that clip. Try again.", "error");
      setSaving(false);
    }
  }

  async function deleteClip(id: string) {
    const prev = clips;
    setClips((c) => c.filter((clip) => clip.id !== id));

    try {
      const res = await fetch(`/api/clips/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setClips(prev);
        showToast("Couldn't delete that clip", "error");
        return;
      }
      showToast("Clip deleted", "success");
    } catch {
      setClips(prev);
      showToast("Couldn't delete that clip", "error");
    }
  }

  const startPct = duration > 0 ? (selStart / duration) * 100 : 0;
  const endPct = duration > 0 ? (selEnd / duration) * 100 : 0;
  const playheadPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl overflow-hidden border border-ink-line bg-black">
        <video
          ref={videoRef}
          src={videoSrc}
          className="w-full max-h-[420px] bg-black"
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          playsInline
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          className="flex items-center justify-center h-9 w-9 rounded-full bg-signal text-ink hover:bg-signal/90 transition-colors shrink-0"
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
        </button>
        <button
          onClick={() => seekTo(Math.max(0, currentTime - 5))}
          className="text-muted hover:text-paper transition-colors"
        >
          <SkipBack className="h-4 w-4" />
        </button>
        <button
          onClick={() => seekTo(Math.min(duration, currentTime + 5))}
          className="text-muted hover:text-paper transition-colors"
        >
          <SkipForward className="h-4 w-4" />
        </button>
        <span className="text-xs font-mono text-muted ml-1">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <div
          ref={trackRef}
          onClick={handleTrackClick}
          className="relative h-12 rounded-lg bg-ink-soft border border-ink-line cursor-pointer select-none"
        >
          {clips.map((c) => (
            <div
              key={c.id}
              className="absolute top-0 bottom-0 bg-wave/15 border-x border-wave/40"
              style={{
                left: `${(c.startSec / duration) * 100}%`,
                width: `${((c.endSec - c.startSec) / duration) * 100}%`
              }}
            />
          ))}

          <div
            className="absolute top-0 bottom-0 bg-signal/25"
            style={{ left: `${startPct}%`, width: `${endPct - startPct}%` }}
          />

          <div
            className="absolute top-0 bottom-0 w-px bg-paper/70"
            style={{ left: `${playheadPct}%` }}
          />

          <motion.div
            onPointerDown={(e) => {
              e.stopPropagation();
              setDragging("start");
            }}
            whileTap={{ scale: 1.15 }}
            className="absolute top-0 bottom-0 w-3 -ml-1.5 cursor-ew-resize flex items-center justify-center touch-none"
            style={{ left: `${startPct}%` }}
          >
            <div className="h-full w-1 rounded-full bg-signal" />
          </motion.div>

          <motion.div
            onPointerDown={(e) => {
              e.stopPropagation();
              setDragging("end");
            }}
            whileTap={{ scale: 1.15 }}
            className="absolute top-0 bottom-0 w-3 -ml-1.5 cursor-ew-resize flex items-center justify-center touch-none"
            style={{ left: `${endPct}%` }}
          >
            <div className="h-full w-1 rounded-full bg-signal" />
          </motion.div>
        </div>

        <div className="flex items-center justify-between text-xs font-mono text-muted">
          <span>{formatTime(selStart)} — {formatTime(selEnd)}</span>
          <span>{formatTime(selEnd - selStart)} selected</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 border border-ink-line rounded-xl p-4">
        <div className="flex gap-2">
          <button
            onClick={() => setSelStart(currentTime)}
            className="text-xs font-mono px-3 py-1.5 rounded-md bg-ink border border-ink-line text-muted hover:text-paper transition-colors"
          >
            Set start here
          </button>
          <button
            onClick={() => setSelEnd(currentTime)}
            className="text-xs font-mono px-3 py-1.5 rounded-md bg-ink border border-ink-line text-muted hover:text-paper transition-colors"
          >
            Set end here
          </button>
          <button
            onClick={previewSelection}
            className="text-xs font-mono px-3 py-1.5 rounded-md bg-ink border border-ink-line text-wave hover:border-wave/50 transition-colors ml-auto"
          >
            Preview
          </button>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Clip title (optional)"
            className="flex-1 rounded-md bg-ink border border-ink-line px-3 py-2 text-sm focus:border-wave outline-none transition-colors"
          />
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={saveClip}
            disabled={saving}
            className="flex items-center gap-2 bg-signal text-ink font-medium px-4 py-2 rounded-md hover:bg-signal/90 transition-colors disabled:opacity-60 shrink-0"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scissors className="h-4 w-4" />}
            Save clip
          </motion.button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="font-display font-bold text-sm text-muted tracking-wide uppercase">
          Saved clips
        </h3>

        {clips.length === 0 ? (
          <p className="text-muted text-sm">
            No clips saved yet — drag the handles above and hit &quot;Save clip&quot;.
          </p>
        ) : (
          <AnimatePresence initial={false}>
            {clips.map((c) => (
              <motion.div
                key={c.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-between border border-ink-line rounded-lg px-4 py-3"
              >
                <button
                  onClick={() => {
                    setSelStart(c.startSec);
                    setSelEnd(c.endSec);
                    previewEndRef.current = c.endSec;
                    if (videoRef.current) {
                      videoRef.current.currentTime = c.startSec;
                      videoRef.current.play();
                    }
                  }}
                  className="flex items-center gap-3 min-w-0 text-left"
                >
                  <Play className="h-3.5 w-3.5 text-wave shrink-0" />
                  <span className="text-sm truncate">
                    {c.title || `Clip ${formatTime(c.startSec)}`}
                  </span>
                  <span className="text-xs font-mono text-muted shrink-0">
                    {formatTime(c.startSec)}–{formatTime(c.endSec)}
                  </span>
                </button>
                <button
                  onClick={() => deleteClip(c.id)}
                  className="text-muted hover:text-signal transition-colors shrink-0 ml-3"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
