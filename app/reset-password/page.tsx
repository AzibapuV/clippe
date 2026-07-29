"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Scissors, Loader2 } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordPageInner />
    </Suspense>
  );
}

function ResetPasswordPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (!token) {
      setError("This reset link is missing its token. Request a new one.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        setLoading(false);
        return;
      }

      showToast("Password updated — sign in with your new password", "success");
      router.push("/login");
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-ink text-paper flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm"
      >
        <Link href="/" className="flex items-center gap-2 justify-center mb-8">
          <Scissors className="h-5 w-5 text-signal" />
          <span className="font-display font-bold text-lg">Clippers Creator</span>
        </Link>

        <h1 className="font-display font-bold text-2xl text-center mb-1">Set a new password</h1>
        <p className="text-muted text-sm text-center mb-8">Make it at least 8 characters.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="password" className="text-xs font-mono tracking-wide text-muted">
              NEW PASSWORD
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-md bg-ink-soft border border-ink-line px-3 py-2.5 text-sm focus:border-wave outline-none transition-colors"
              placeholder="At least 8 characters"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="text-xs font-mono tracking-wide text-muted">
              CONFIRM PASSWORD
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1.5 w-full rounded-md bg-ink-soft border border-ink-line px-3 py-2.5 text-sm focus:border-wave outline-none transition-colors"
              placeholder="Re-enter your password"
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-signal text-sm"
            >
              {error}
            </motion.p>
          )}

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="mt-2 flex items-center justify-center gap-2 bg-signal text-ink font-medium py-2.5 rounded-md hover:bg-signal/90 transition-colors disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Updating…" : "Update password"}
          </motion.button>
        </form>
      </motion.div>
    </main>
  );
}
