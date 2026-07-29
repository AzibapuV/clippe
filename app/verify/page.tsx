"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Scissors, Loader2, MailCheck } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

const RESEND_COOLDOWN_SEC = 45;

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyPageInner />
    </Suspense>
  );
}

function VerifyPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const email = searchParams.get("email") ?? "";

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        setLoading(false);
        return;
      }

      showToast("Email verified — signing you in", "success");
      router.push("/login");
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0 || resending) return;
    setResending(true);

    try {
      const res = await fetch("/api/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      if (res.ok) {
        showToast("A new code is on its way", "success");
        setCooldown(RESEND_COOLDOWN_SEC);
      } else {
        showToast("Couldn't resend the code. Try again shortly.", "error");
      }
    } catch {
      showToast("Couldn't resend the code. Try again shortly.", "error");
    } finally {
      setResending(false);
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

        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 rounded-full bg-wave/10 border border-wave/30 flex items-center justify-center">
            <MailCheck className="h-5 w-5 text-wave" />
          </div>
        </div>

        <h1 className="font-display font-bold text-2xl text-center mb-1">Check your email</h1>
        <p className="text-muted text-sm text-center mb-8">
          We sent a 6-digit code to{" "}
          <span className="text-paper">{email || "your email"}</span>
        </p>

        <form onSubmit={handleVerify} className="flex flex-col gap-4">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="w-full rounded-md bg-ink-soft border border-ink-line px-3 py-3 text-center text-2xl tracking-[0.5em] font-mono focus:border-wave outline-none transition-colors"
            placeholder="------"
          />

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-signal text-sm text-center"
            >
              {error}
            </motion.p>
          )}

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading || code.length !== 6}
            className="flex items-center justify-center gap-2 bg-signal text-ink font-medium py-2.5 rounded-md hover:bg-signal/90 transition-colors disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Verifying…" : "Verify email"}
          </motion.button>
        </form>

        <p className="text-center text-sm text-muted mt-6">
          Didn&apos;t get a code?{" "}
          <button
            onClick={handleResend}
            disabled={cooldown > 0 || resending}
            className="text-wave hover:underline disabled:opacity-50 disabled:no-underline"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? "Sending…" : "Resend code"}
          </button>
        </p>
      </motion.div>
    </main>
  );
}
