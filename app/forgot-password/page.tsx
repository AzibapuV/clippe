"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Scissors, Loader2, MailCheck } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong");
        setLoading(false);
        return;
      }

      setSent(true);
      setLoading(false);
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

        {sent ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-full bg-wave/10 border border-wave/30 flex items-center justify-center">
                <MailCheck className="h-5 w-5 text-wave" />
              </div>
            </div>
            <h1 className="font-display font-bold text-2xl mb-1">Check your email</h1>
            <p className="text-muted text-sm">
              If an account exists for <span className="text-paper">{email}</span>, a reset link
              is on its way. It expires in 1 hour.
            </p>
            <Link href="/login" className="inline-block mt-6 text-wave hover:underline text-sm">
              Back to sign in
            </Link>
          </motion.div>
        ) : (
          <>
            <h1 className="font-display font-bold text-2xl text-center mb-1">Reset your password</h1>
            <p className="text-muted text-sm text-center mb-8">
              Enter your email and we&apos;ll send you a reset link.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label htmlFor="email" className="text-xs font-mono tracking-wide text-muted">
                  EMAIL
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5 w-full rounded-md bg-ink-soft border border-ink-line px-3 py-2.5 text-sm focus:border-wave outline-none transition-colors"
                  placeholder="you@example.com"
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
                {loading ? "Sending…" : "Send reset link"}
              </motion.button>
            </form>

            <p className="text-center text-sm text-muted mt-6">
              Remembered it?{" "}
              <Link href="/login" className="text-wave hover:underline">
                Sign in
              </Link>
            </p>
          </>
        )}
      </motion.div>
    </main>
  );
}
