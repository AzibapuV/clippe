"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { UploadCloud, Link as LinkIcon } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

export default function AddVideoForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [url, setUrl] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function getClientDuration(file: File): Promise<number | null> {
    return new Promise((resolve) => {
      const videoEl = document.createElement("video");
      videoEl.preload = "metadata";
      const objectUrl = URL.createObjectURL(file);

      videoEl.onloadedmetadata = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(Number.isFinite(videoEl.duration) ? Math.round(videoEl.duration) : null);
      };
      videoEl.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(null);
      };
      videoEl.src = objectUrl;
    });
  }

  async function submitFile(file: File) {
    if (!file.type.startsWith("video/")) {
      showToast("That file isn't a video", "error");
      return;
    }

    setLoading(true);
    setProgress(0);

    const durationSec = await getClientDuration(file);

    const form = new FormData();
    form.append("file", file);
    if (durationSec) form.append("durationSec", String(durationSec));

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/projects/${projectId}/videos`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        setProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      setLoading(false);
      setProgress(null);

      let data: { error?: string } = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        // ignore parse failure, status check below handles it
      }

      if (xhr.status < 200 || xhr.status >= 300) {
        showToast(data.error ?? "Upload failed", "error");
        return;
      }

      showToast("Video uploaded", "success");
      router.refresh();
    };

    xhr.onerror = () => {
      setLoading(false);
      setProgress(null);
      showToast("Upload failed. Check your connection and try again.", "error");
    };

    xhr.send(form);
  }

  async function submitUrl(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/projects/${projectId}/videos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error ?? "Import failed", "error");
        setLoading(false);
        return;
      }

      showToast("Video queued", "success");
      setUrl("");
      setLoading(false);
      router.refresh();
    } catch {
      showToast("Import failed. Try again.", "error");
      setLoading(false);
    }
  }

  return (
    <div className="border border-ink-line rounded-xl p-5">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode("upload")}
          className={`text-xs font-mono px-3 py-1.5 rounded-md transition-colors ${
            mode === "upload" ? "bg-signal text-ink" : "bg-ink border border-ink-line text-muted"
          }`}
        >
          UPLOAD FILE
        </button>
        <button
          onClick={() => setMode("url")}
          className={`text-xs font-mono px-3 py-1.5 rounded-md transition-colors ${
            mode === "url" ? "bg-signal text-ink" : "bg-ink border border-ink-line text-muted"
          }`}
        >
          PASTE LINK
        </button>
      </div>

      {mode === "upload" ? (
        <div
          onClick={() => !loading && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            if (!loading) setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            const file = e.dataTransfer.files?.[0];
            if (file && !loading) submitFile(file);
          }}
          className={`flex flex-col items-center justify-center gap-2 border rounded-lg py-10 cursor-pointer transition-colors ${
            dragActive
              ? "border-wave bg-wave/5"
              : "border-dashed border-ink-line hover:border-wave/50"
          }`}
        >
          <motion.div animate={dragActive ? { y: -4 } : { y: 0 }}>
            <UploadCloud className={`h-6 w-6 ${dragActive ? "text-wave" : "text-muted"}`} />
          </motion.div>

          {loading && progress !== null ? (
            <div className="w-full max-w-[200px] flex flex-col items-center gap-2">
              <div className="w-full h-1.5 bg-ink-line rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-signal"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "easeOut" }}
                />
              </div>
              <span className="text-xs font-mono text-muted">{progress}%</span>
            </div>
          ) : (
            <span className="text-sm text-muted">
              {dragActive ? "Drop it" : "Tap or drag a video file here"}
            </span>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            className="hidden"
            disabled={loading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) submitFile(file);
            }}
          />
        </div>
      ) : (
        <form onSubmit={submitUrl} className="flex flex-col gap-3">
          <div className="flex items-center gap-2 bg-ink border border-ink-line rounded-md px-3 py-2.5">
            <LinkIcon className="h-4 w-4 text-muted shrink-0" />
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-signal text-ink font-medium py-2.5 rounded-md hover:bg-signal/90 transition-colors disabled:opacity-60"
          >
            {loading ? "Importing…" : "Add video"}
          </button>
        </form>
      )}
    </div>
  );
}
