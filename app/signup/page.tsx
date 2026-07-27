"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Scissors } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        setLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false
      });

      if (result?.error) {
        setError("Account created — please sign in.");
        router.push("/login");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-ink text-paper flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center gap-2 justify-center mb-8">
          <Scissors className="h-5 w-5 text-signal" />
          <span className="font-display font-bold text-lg">Clippers Creator</span>
        </Link>

        <h1 className="font-display font-bold text-2xl text-center mb-1">Create your account</h1>
        <p className="text-muted text-sm text-center mb-8">30 minutes of clipping, free. No card.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="name" className="text-xs font-mono tracking-wide text-muted">
              NAME
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full rounded-md bg-ink-soft border border-ink-line px-3 py-2.5 text-sm focus:border-wave outline-none transition-colors"
              placeholder="Ada Lovelace"
            />
          </div>
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
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-md bg-ink-soft border border-ink-line px-3 py-2.5 text-sm focus:border-wave outline-none transition-colors"
              placeholder="At least 8 characters"
            />
          </div>

          {error && <p className="text-signal text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-signal text-ink font-medium py-2.5 rounded-md hover:bg-signal/90 transition-colors disabled:opacity-60"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-wave hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
