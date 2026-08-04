"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

export default function DeleteProjectButton({
  projectId,
  projectName
}: {
  projectId: string;
  projectName: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error ?? "Couldn't delete that project", "error");
        setDeleting(false);
        return;
      }
      showToast("Project deleted", "success");
      router.push("/dashboard");
    } catch {
      showToast("Couldn't delete that project", "error");
      setDeleting(false);
    }
  }

  return (
    <AnimatePresence mode="wait">
      {confirming ? (
        <motion.div
          key="confirm"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="flex items-center gap-2"
        >
          <span className="text-xs text-muted">Delete &quot;{projectName}&quot;?</span>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 text-xs font-medium bg-signal text-ink px-3 py-1.5 rounded-md hover:bg-signal/90 transition-colors disabled:opacity-60"
          >
            {deleting && <Loader2 className="h-3 w-3 animate-spin" />}
            {deleting ? "Deleting…" : "Confirm"}
          </button>
          <button
            onClick={() => setConfirming(false)}
            disabled={deleting}
            className="text-xs font-medium bg-ink border border-ink-line text-muted px-3 py-1.5 rounded-md hover:text-paper transition-colors"
          >
            Cancel
          </button>
        </motion.div>
      ) : (
        <motion.button
          key="trigger"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setConfirming(true)}
          className="flex items-center gap-1.5 text-xs text-muted hover:text-signal transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete project
        </motion.button>
      )}
    </AnimatePresence>
  );
}
