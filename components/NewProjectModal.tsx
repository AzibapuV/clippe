"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { FolderPlus, X, Loader2 } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

export default function NewProjectModal() {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error ?? "Something went wrong", "error");
        setLoading(false);
        return;
      }

      showToast(`"${data.name}" created`, "success");
      setOpen(false);
      setName("");
      setLoading(false);
      router.push(`/projects/${data.id}`);
      router.refresh();
    } catch {
      showToast("Something went wrong. Try again.", "error");
      setLoading(false);
    }
  }

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-signal text-ink text-sm font-medium px-4 py-2.5 rounded-md hover:bg-signal/90 transition-colors"
      >
        <FolderPlus className="h-4 w-4" /> New project
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-6"
            onClick={() => !loading && setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-sm bg-ink-soft border border-ink-line rounded-xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-bold text-lg">New project</h2>
                <button
                  onClick={() => !loading && setOpen(false)}
                  className="text-muted hover:text-paper transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="flex flex-col gap-3">
                <input
                  autoFocus
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Podcast Ep. 42"
                  className="w-full rounded-md bg-ink border border-ink-line px-3 py-2.5 text-sm focus:border-wave outline-none transition-colors"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 bg-signal text-ink font-medium py-2.5 rounded-md hover:bg-signal/90 transition-colors disabled:opacity-60"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? "Creating…" : "Create project"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
