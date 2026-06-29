"use client";

import { useState, useEffect, use } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useRouter } from "next/navigation";

interface Template {
  id: string;
  slug: string;
  title: string;
  role: string;
  duration: number;
  description: string;
  config: Array<{ competency: string; label: string; description: string }>;
}

const TIPS = [
  "Use specific examples — vague answers will be challenged.",
  "Structure answers with Situation, Task, Action, Result.",
  "The AI will ask follow-ups. Depth matters more than breadth.",
  "Speak naturally. Pausing to think is a sign of seriousness.",
];

const FADE_UP: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: [0.25, 0, 0, 1] },
  }),
};

export default function PreparePage({ params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = use(params);
  const router = useRouter();

  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTip, setActiveTip] = useState(0);

  useEffect(() => {
    fetch("/api/interview/templates")
      .then((r) => r.json())
      .then((d) => {
        const found = d.templates?.find(
          (t: Template) => t.slug === templateId || t.id === templateId
        );
        setTemplate(found ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [templateId]);

  // Cycle tips
  useEffect(() => {
    const id = setInterval(() => setActiveTip((t) => (t + 1) % TIPS.length), 4000);
    return () => clearInterval(id);
  }, []);

  async function beginInterview() {
    if (!template) return;
    setStarting(true);
    setError(null);

    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    const userData = storedUser ? JSON.parse(storedUser) : null;

    try {
      const res = await fetch("/api/interview/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          templateId: template.id,
          candidateProfile: {
            name: userData?.name ?? "Candidate",
            role: template.role,
            yearsOfExperience: 5,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to start session");
      router.push(`/interview/${data.sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStarting(false);
    }
  }

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--background)" }}
      >
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "var(--muted)" }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ background: "var(--background)", color: "var(--foreground)" }}
      >
        <p style={{ color: "var(--muted)" }}>Interview not found.</p>
        <button onClick={() => router.push("/dashboard")} className="btn-ghost text-sm">
          ← Back to dashboard
        </button>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2">
          <div style={{ background: "var(--brand)", borderRadius: 4 }} className="w-4 h-4" />
          <span className="font-semibold tracking-tight text-sm">Intervue</span>
        </div>
        <button
          onClick={() => router.push("/dashboard")}
          className="text-sm transition-colors"
          style={{ color: "var(--muted)" }}
        >
          ← Dashboard
        </button>
      </nav>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-8 py-16">
        <div className="w-full max-w-3xl">
          {/* Ready badge */}
          <motion.div
            custom={0}
            variants={FADE_UP}
            initial="hidden"
            animate="show"
            className="flex items-center gap-2 mb-8"
          >
            <motion.div
              className="w-2 h-2 rounded-full"
              style={{ background: "var(--brand)" }}
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span
              className="text-xs font-semibold tracking-widest uppercase"
              style={{ color: "var(--brand)" }}
            >
              Your interviewer is ready
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            custom={1}
            variants={FADE_UP}
            initial="hidden"
            animate="show"
            className="display-lg mb-4"
          >
            {template.title}
          </motion.h1>

          <motion.p
            custom={2}
            variants={FADE_UP}
            initial="hidden"
            animate="show"
            className="text-base mb-12 max-w-lg"
            style={{ color: "var(--muted)", lineHeight: 1.75 }}
          >
            {template.description}
          </motion.p>

          {/* Two-column: competencies + meta */}
          <motion.div
            custom={3}
            variants={FADE_UP}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10"
          >
            {/* Competencies */}
            <div
              className="rounded-xl p-6"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <p
                className="text-xs font-medium uppercase tracking-widest mb-5"
                style={{ color: "var(--muted)" }}
              >
                What will be evaluated
              </p>
              <div className="flex flex-col gap-3">
                {(template.config ?? []).map((c, i) => (
                  <motion.div
                    key={c.competency}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.07, duration: 0.35 }}
                    className="flex items-start gap-3"
                  >
                    <div
                      className="mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0"
                      style={{ background: "var(--brand-dim)", border: "1px solid var(--brand-border)" }}
                    >
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path
                          d="M1.5 4L3 5.5L6.5 2"
                          stroke="var(--brand)"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-tight">{c.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                        {c.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Meta + tips */}
            <div className="flex flex-col gap-4">
              {/* Interview details */}
              <div
                className="rounded-xl p-5"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <p
                  className="text-xs font-medium uppercase tracking-widest mb-4"
                  style={{ color: "var(--muted)" }}
                >
                  Interview details
                </p>
                <div className="flex flex-col gap-3">
                  {[
                    { label: "Role", value: template.role },
                    { label: "Duration", value: `~${template.duration} min` },
                    { label: "Format", value: "Voice · AI interviewer" },
                    { label: "Difficulty", value: "Adaptive" },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between items-center">
                      <span className="text-sm" style={{ color: "var(--muted)" }}>
                        {row.label}
                      </span>
                      <span className="text-sm font-medium">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rotating tip */}
              <div
                className="rounded-xl p-5 flex-1"
                style={{
                  background: "var(--brand-dim)",
                  border: "1px solid var(--brand-border)",
                }}
              >
                <p
                  className="text-xs font-medium uppercase tracking-widest mb-3"
                  style={{ color: "var(--brand)" }}
                >
                  Tip
                </p>
                <div style={{ minHeight: 56 }}>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={activeTip}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.3 }}
                      className="text-sm leading-relaxed"
                      style={{ color: "var(--foreground)" }}
                    >
                      {TIPS[activeTip]}
                    </motion.p>
                  </AnimatePresence>
                </div>
                {/* Tip progress dots */}
                <div className="flex gap-1.5 mt-3">
                  {TIPS.map((_, i) => (
                    <div
                      key={i}
                      className="rounded-full transition-all duration-300"
                      style={{
                        width: i === activeTip ? 14 : 4,
                        height: 4,
                        background: i === activeTip ? "var(--brand)" : "var(--brand-border)",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            custom={4}
            variants={FADE_UP}
            initial="hidden"
            animate="show"
            className="flex flex-col items-start gap-3"
          >
            {error && (
              <p className="text-sm" style={{ color: "var(--destructive)" }}>
                {error}
              </p>
            )}
            <div className="flex items-center gap-4">
              <button
                onClick={beginInterview}
                disabled={starting}
                className="btn-primary"
                style={{ padding: "13px 32px", fontSize: 15 }}
              >
                {starting ? "Starting interview…" : "Begin interview"}
              </button>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                Your microphone will be requested when the interview starts.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
