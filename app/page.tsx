import Link from "next/link";
import {
  Scissors,
  Captions,
  ScanFace,
  AudioWaveform,
  Sparkles,
  Hash,
  Clock,
  ArrowRight,
  Check
} from "lucide-react";

const markers = [
  { pos: "8%", label: "HOOK", time: "00:00:04:12", tone: "signal" },
  { pos: "27%", label: "LAUGH", time: "00:01:12:03", tone: "wave" },
  { pos: "49%", label: "PEAK", time: "00:03:41:20", tone: "signal" },
  { pos: "68%", label: "REACT", time: "00:05:02:07", tone: "wave" },
  { pos: "89%", label: "SHOCK", time: "00:07:58:14", tone: "signal" }
];

const signals = [
  { icon: AudioWaveform, label: "Audio peaks" },
  { icon: ScanFace, label: "Facial emotion" },
  { icon: Captions, label: "Speech + subtitles" },
  { icon: Sparkles, label: "Sentiment" },
  { icon: Hash, label: "Keyword weight" },
  { icon: Clock, label: "Retention curve" }
];

const features = [
  {
    title: "Auto captions, styled per platform",
    body: "Animated, emoji, or bold-block captions rendered to match TikTok, Reels, or Shorts conventions — burned in and ready to post."
  },
  {
    title: "Face tracking and auto-reframe",
    body: "Long-form 16:9 gets reframed to 9:16 automatically, following whoever's speaking so nothing important falls outside the crop."
  },
  {
    title: "Clip ranking, not just clipping",
    body: "Every candidate clip gets scored on hook strength, pacing, and payoff, so you open with the ones actually worth posting first."
  },
  {
    title: "Titles, captions, and hashtags per platform",
    body: "One clip in, five platform-ready posts out — each with its own tone, length, and hashtag mix."
  }
];

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    credits: "30 minutes of source video / month",
    features: ["720p exports", "Auto captions", "3 caption styles", "Watermark included"]
  },
  {
    name: "Pro",
    price: "$24",
    period: "/ month",
    credits: "10 hours of source video / month",
    features: ["1080p exports", "No watermark", "All caption styles", "Face tracking", "Priority processing"],
    featured: true
  },
  {
    name: "Business",
    price: "$79",
    period: "/ month",
    credits: "40 hours of source video / month",
    features: ["4K exports", "Team seats (5)", "Scheduling suggestions", "API access"]
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    credits: "Volume pricing",
    features: ["Dedicated storage", "SSO", "Custom model tuning", "Support SLA"]
  }
];

function TimelineMarker({
  pos,
  label,
  time,
  tone
}: {
  pos: string;
  label: string;
  time: string;
  tone: "signal" | "wave";
}) {
  const color = tone === "signal" ? "bg-signal" : "bg-wave";
  const ring = tone === "signal" ? "ring-signal/40" : "ring-wave/40";
  return (
    <div className="absolute -translate-x-1/2 flex flex-col items-center" style={{ left: pos, top: "-2.75rem" }}>
      <span className="text-[10px] font-mono tracking-wider text-muted mb-1">{time}</span>
      <span className={`text-[10px] font-mono tracking-widest px-1.5 py-0.5 rounded-sm ${color} text-ink font-medium mb-1.5`}>
        {label}
      </span>
      <span className={`h-3 w-3 rounded-full ${color} ring-4 ${ring} animate-marker`} />
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-ink text-paper">
      {/* NAV */}
      <header className="border-b border-ink-line/60">
        <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <Scissors className="h-5 w-5 text-signal" strokeWidth={2.25} />
            <span className="font-display font-bold text-lg tracking-tight">Clippers Creator</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted">
            <a href="#how" className="hover:text-paper transition-colors">How it works</a>
            <a href="#features" className="hover:text-paper transition-colors">Features</a>
            <a href="#pricing" className="hover:text-paper transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-muted hover:text-paper transition-colors px-3 py-2">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium bg-signal text-ink px-4 py-2 rounded-md hover:bg-signal/90 transition-colors"
            >
              Get started
            </Link>
          </div>
        </nav>
      </header>

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-32">
        <div className="max-w-2xl">
          <span className="inline-block font-mono text-xs tracking-widest text-wave border border-wave/30 rounded-full px-3 py-1 mb-6">
            NOW DETECTING VIRAL MOMENTS
          </span>
          <h1 className="font-display font-bold text-5xl md:text-6xl leading-[1.05] tracking-tight">
            Turn long videos into <span className="text-signal">viral shorts</span> in minutes.
          </h1>
          <p className="mt-6 text-lg text-muted max-w-lg">
            Drop in a podcast, stream, or long-form upload. Clippers Creator finds the hooks, laughs,
            and peaks, then hands you captioned, platform-ready clips.
          </p>
          <div className="mt-9 flex items-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-signal text-ink font-medium px-5 py-3 rounded-md hover:bg-signal/90 transition-colors"
            >
              Start clipping free <ArrowRight className="h-4 w-4" />
            </Link>
            <span className="text-sm text-muted font-mono">No card required</span>
          </div>
        </div>

        {/* TIMELINE SCRUBBER — signature element */}
        <div className="mt-28 relative">
          <div className="relative h-1.5 rounded-full bg-ink-soft overflow-visible">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-signal/20 via-wave/20 to-signal/20" />
            {markers.map((m) => (
              <TimelineMarker key={m.label} {...m} tone={m.tone as "signal" | "wave"} />
            ))}
            <div className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-paper animate-scrub" />
          </div>
          <div className="flex justify-between mt-3 font-mono text-[11px] text-muted">
            <span>00:00:00:00</span>
            <span>SOURCE — 00:09:14:00</span>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS / SIGNALS */}
      <section id="how" className="border-t border-ink-line/60 bg-ink-soft/40">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
            <h2 className="font-display font-bold text-3xl tracking-tight max-w-md">
              Every moment gets scored before a single clip is cut.
            </h2>
            <p className="text-muted max-w-sm text-sm">
              Six signals run across the whole video, not just the audio track — so quiet, visual
              moments get caught too.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-ink-line/60 rounded-lg overflow-hidden">
            {signals.map(({ icon: Icon, label }) => (
              <div key={label} className="bg-ink p-6 flex flex-col gap-4">
                <Icon className="h-5 w-5 text-wave" strokeWidth={1.75} />
                <span className="text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24">
        <h2 className="font-display font-bold text-3xl tracking-tight mb-12 max-w-md">
          Built for the parts that actually take time.
        </h2>
        <div className="grid md:grid-cols-2 gap-px bg-ink-line/60 rounded-lg overflow-hidden">
          {features.map((f) => (
            <div key={f.title} className="bg-ink p-8">
              <h3 className="font-display font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-muted text-sm leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="border-t border-ink-line/60 bg-ink-soft/40">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <h2 className="font-display font-bold text-3xl tracking-tight mb-12 text-center">
            Credits based on source minutes, not clips out.
          </h2>
          <div className="grid md:grid-cols-4 gap-5">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`rounded-xl p-6 flex flex-col border ${
                  p.featured ? "border-signal bg-ink" : "border-ink-line/60 bg-ink"
                }`}
              >
                {p.featured && (
                  <span className="text-[10px] font-mono tracking-widest text-signal mb-3">MOST USED</span>
                )}
                <h3 className="font-display font-bold text-xl">{p.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-display font-bold">{p.price}</span>
                  <span className="text-muted text-sm">{p.period}</span>
                </div>
                <p className="text-xs text-wave font-mono mt-2">{p.credits}</p>
                <ul className="mt-6 flex flex-col gap-3 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted">
                      <Check className="h-4 w-4 text-wave shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`mt-8 text-center text-sm font-medium py-2.5 rounded-md transition-colors ${
                    p.featured
                      ? "bg-signal text-ink hover:bg-signal/90"
                      : "border border-ink-line hover:border-paper/40"
                  }`}
                >
                  {p.name === "Enterprise" ? "Talk to us" : "Choose plan"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-ink-line/60">
        <div className="max-w-6xl mx-auto px-6 py-10 flex items-center justify-between text-sm text-muted">
          <div className="flex items-center gap-2">
            <Scissors className="h-4 w-4 text-signal" />
            <span>Clippers Creator</span>
          </div>
          <span>© {new Date().getFullYear()} Clippers Creator</span>
        </div>
      </footer>
    </main>
  );
}
