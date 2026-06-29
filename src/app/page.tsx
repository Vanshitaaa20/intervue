"use client";

import { motion, type Variants } from "framer-motion";
import Link from "next/link";

const FADE_UP: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
  }),
};

const FADE_LEFT: Variants = {
  hidden: { opacity: 0, x: 24 },
  show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const STEPS = [
  {
    num: "01",
    title: "Pick your interview",
    body: "Choose a role and competency set. The engine calibrates difficulty to your experience level from the first question.",
  },
  {
    num: "02",
    title: "Talk. Really talk.",
    body: "A voice interview with an AI that listens, remembers, and pushes back. No scripts. No easy passes.",
  },
  {
    num: "03",
    title: "Read your report",
    body: "Competency scores, STAR structure grade, your best and worst answers, and one concrete thing to fix.",
  },
];

const BENEFITS = [
  "Challenges weak answers on the spot — not after the fact",
  "Remembers what you said five minutes ago and asks about it",
  "Adjusts difficulty in real time based on your performance",
  "Generates a detailed report you can actually act on",
  "Covers six behavioral competencies every top company tests",
];

// Mock interview card data
const MOCK_TURNS = [
  { role: "ai", text: "Tell me about a time you had to deliver critical feedback to a peer. How did you handle it?" },
  { role: "user", text: "There was a situation at my last company where a colleague's code was consistently blocking deploys..." },
  { role: "ai", text: "You mentioned the deploys were blocked — what was the business impact during that period, and how did you quantify it?" },
];

const MOCK_COMPETENCIES = [
  { label: "Leadership", pct: 72 },
  { label: "Ownership", pct: 48 },
  { label: "Communication", pct: 25 },
];

export default function LandingPage() {
  return (
    <div style={{ background: "var(--background)", color: "var(--foreground)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* ── Nav ── */}
      <motion.nav
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 48px", maxWidth: 1200, margin: "0 auto", width: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
            <rect width="20" height="20" rx="5" fill="var(--brand)" />
            <path d="M6 10.5L9 13.5L14 7.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.03em" }}>Intervue</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {["How it works", "Features", "Reports"].map((item) => (
            <span key={item} style={{ fontSize: 14, color: "var(--muted)", cursor: "pointer" }}>{item}</span>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/login" style={{ fontSize: 14, color: "var(--muted)", textDecoration: "none", padding: "9px 18px" }}>
            Sign in
          </Link>
          <Link href="/register" className="btn-primary" style={{ padding: "9px 20px", fontSize: 14 }}>
            Get started
          </Link>
        </div>
      </motion.nav>

      {/* ── Hero — two column ── */}
      <section style={{
        maxWidth: 1200, margin: "0 auto", width: "100%",
        padding: "48px 48px 80px",
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 64, alignItems: "center",
      }}>
        {/* Left */}
        <div>
          <motion.div
            custom={0} variants={FADE_UP} initial="hidden" animate="show"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "6px 14px", borderRadius: 999,
              background: "var(--brand-dim)", border: "1px solid var(--brand-border)",
              color: "var(--brand)", fontSize: 12, fontWeight: 600,
              marginBottom: 28, letterSpacing: "0.01em",
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--brand)" }} />
            AI Behavioral Interview Practice
          </motion.div>

          <motion.h1
            custom={1} variants={FADE_UP} initial="hidden" animate="show"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(2.4rem, 4.5vw, 3.75rem)",
              fontWeight: 600,
              lineHeight: 1.06,
              letterSpacing: "-0.025em",
              marginBottom: 20,
              textWrap: "balance",
            }}
          >
            Your roadmap to{" "}
            <span style={{ color: "var(--brand)" }}>acing the interview.</span>
          </motion.h1>

          <motion.p
            custom={2} variants={FADE_UP} initial="hidden" animate="show"
            style={{ fontSize: 16, lineHeight: 1.7, color: "var(--muted)", marginBottom: 36, maxWidth: 420 }}
          >
            An AI interviewer that challenges weak answers, remembers what you said,
            and gives you the kind of feedback your last interviewer kept to themselves.
          </motion.p>

          <motion.div
            custom={3} variants={FADE_UP} initial="hidden" animate="show"
            style={{ display: "flex", gap: 12, marginBottom: 48 }}
          >
            <Link href="/register" className="btn-primary" style={{ padding: "12px 28px", fontSize: 15 }}>
              Start for free
            </Link>
            <Link href="/login" className="btn-ghost" style={{ padding: "12px 28px", fontSize: 15 }}>
              Sign in
            </Link>
          </motion.div>

          <motion.div
            custom={4} variants={FADE_UP} initial="hidden" animate="show"
            style={{ display: "flex", alignItems: "center", gap: 12 }}
          >
            <div style={{ display: "flex" }}>
              {["V", "A", "R", "K"].map((l, i) => (
                <div key={i} style={{
                  width: 30, height: 30, borderRadius: "50%",
                  background: `hsl(${20 + i * 15}, 60%, 40%)`,
                  border: "2px solid var(--background)",
                  marginLeft: i > 0 ? -8 : 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, color: "#fff",
                }}>
                  {l}
                </div>
              ))}
            </div>
            <p style={{ fontSize: 13, color: "var(--muted)" }}>
              <strong style={{ color: "var(--foreground)" }}>1,200+</strong> candidates practiced this week
            </p>
          </motion.div>
        </div>

        {/* Right — mock interview card */}
        <motion.div
          variants={FADE_LEFT}
          initial="hidden"
          animate="show"
          style={{ position: "relative" }}
        >
          {/* Glow behind card */}
          <div style={{
            position: "absolute", inset: -40,
            background: "radial-gradient(ellipse at 60% 40%, rgba(249,115,22,0.18) 0%, transparent 65%)",
            borderRadius: "50%", pointerEvents: "none",
          }} />

          <div style={{
            position: "relative",
            background: "var(--surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 18,
            overflow: "hidden",
          }}>
            {/* Card header */}
            <div style={{
              padding: "14px 20px",
              borderBottom: "1px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--brand)" }} />
                <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "-0.01em" }}>Interview in progress</span>
              </div>
              <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "monospace" }}>12:34</span>
            </div>

            {/* Transcript */}
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>
              {MOCK_TURNS.map((turn, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: turn.role === "ai" ? "flex-start" : "flex-end", gap: 4 }}>
                  <span style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    {turn.role === "ai" ? "Interviewer" : "You"}
                  </span>
                  <div style={{
                    maxWidth: "88%",
                    padding: "10px 14px",
                    borderRadius: turn.role === "ai" ? "4px 14px 14px 14px" : "14px 4px 14px 14px",
                    background: turn.role === "ai" ? "var(--surface-2)" : "var(--surface-hover)",
                    border: "1px solid var(--border)",
                    fontSize: 13,
                    lineHeight: 1.55,
                    color: turn.role === "ai" ? "var(--foreground)" : "var(--muted)",
                  }}>
                    {turn.text}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ display: "flex", gap: 4 }}>
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--brand)" }}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
                <span style={{ fontSize: 11, color: "var(--muted)" }}>AI is responding…</span>
              </div>
            </div>

            {/* Competency tracker */}
            <div style={{
              borderTop: "1px solid var(--border)",
              padding: "16px 20px",
              background: "var(--background)",
            }}>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 12 }}>
                Coverage
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {MOCK_COMPETENCIES.map((c) => (
                  <div key={c.label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 11, color: "var(--muted)" }}>{c.label}</span>
                      <span style={{ fontSize: 11, color: "var(--muted)" }}>{c.pct}%</span>
                    </div>
                    <div style={{ height: 3, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
                      <motion.div
                        style={{ height: "100%", background: "var(--brand)", borderRadius: 2 }}
                        initial={{ width: 0 }}
                        animate={{ width: `${c.pct}%` }}
                        transition={{ duration: 1, delay: 0.8, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── How it works ── */}
      <section style={{
        borderTop: "1px solid var(--border)",
        padding: "80px 48px",
        background: "var(--surface)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ marginBottom: 52 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--brand)", marginBottom: 12 }}>
              How it works
            </p>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.5rem, 2.5vw, 2rem)", fontWeight: 600, letterSpacing: "-0.02em" }}>
              Three steps to a better interview.
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
            {STEPS.map((step, i) => (
              <motion.div
                key={step.num}
                custom={i}
                variants={FADE_UP}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                style={{
                  padding: "36px 32px",
                  borderLeft: i > 0 ? "1px solid var(--border)" : "none",
                }}
              >
                <span style={{
                  fontSize: 13, fontWeight: 700, fontFamily: "monospace",
                  color: "var(--brand)", letterSpacing: "0.04em",
                  display: "block", marginBottom: 20,
                }}>
                  {step.num}
                </span>
                <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 17, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 12 }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--muted)" }}>
                  {step.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits — two column ── */}
      <section style={{ padding: "88px 48px", borderTop: "1px solid var(--border)" }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto",
          display: "grid", gridTemplateColumns: "1fr 1fr",
          gap: 80, alignItems: "center",
        }}>
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--brand)", marginBottom: 16 }}>
              Why Intervue
            </p>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.5rem, 2.5vw, 2.25rem)", fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 20, lineHeight: 1.2 }}>
              Not a chatbot.<br />An actual challenge.
            </h2>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: "var(--muted)", marginBottom: 40 }}>
              Most interview prep tools let you get away with vague answers.
              Intervue doesn't. It pushes until the answer is concrete, structured, and honest.
            </p>
            <Link href="/register" className="btn-primary" style={{ padding: "12px 28px", fontSize: 15, display: "inline-flex" }}>
              Try it free
            </Link>
          </motion.div>

          {/* Right — benefit list */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            style={{ display: "flex", flexDirection: "column", gap: 0 }}
          >
            {BENEFITS.map((b, i) => (
              <div
                key={i}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 16,
                  padding: "18px 0",
                  borderBottom: i < BENEFITS.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                <div style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                  background: "var(--brand-dim)", border: "1px solid var(--brand-border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginTop: 2,
                }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5.5L4 7.5L8 3" stroke="var(--brand)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--muted)" }}>{b}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA band ── */}
      <section style={{
        borderTop: "1px solid var(--border)",
        background: "var(--surface)",
        padding: "72px 48px",
        textAlign: "center",
      }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.5rem, 3vw, 2.5rem)", fontWeight: 600, letterSpacing: "-0.025em", marginBottom: 16 }}>
            Your next interview is closer than you think.
          </h2>
          <p style={{ fontSize: 16, color: "var(--muted)", marginBottom: 36 }}>
            Start practicing today. No credit card required.
          </p>
          <Link href="/register" className="btn-primary" style={{ padding: "13px 32px", fontSize: 15 }}>
            Get started for free
          </Link>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "24px 48px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--muted-2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <rect width="20" height="20" rx="5" fill="var(--brand)" />
              <path d="M6 10.5L9 13.5L14 7.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontWeight: 600, color: "var(--muted)" }}>Intervue</span>
          </div>
          <span>Built for candidates who want the job.</span>
        </div>
      </footer>
    </div>
  );
}
