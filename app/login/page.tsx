"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Scissors } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false
    });

    setLoading(false);

    if (result?.error) {
      setError("Incorrect email or password");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen bg-ink text-paper flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center gap-2 justify-center mb-8">
          <Scissors className="h-5 w-5 text-signal" />
          <span className="font-display font-bold text-lg">Clippers Creator</span>
        </Link>

        <h1 className="font-display font-bold text-2xl text-center mb-1">Welcome back</h1>
        <p className="text-muted text-sm text-center mb-8">Sign in to your dashboard.</p>

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
          <div>
            <label htmlFor="password" className="text-xs font-mono tracking-wide text-muted">
              PASSWORD
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-md bg-ink-soft border border-ink-line px-3 py-2.5 text-sm focus:border-wave outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-signal text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-signal text-ink font-medium py-2.5 rounded-md hover:bg-signal/90 transition-colors disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-wave hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
