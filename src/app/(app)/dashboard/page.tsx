"use client";

import { useState, useEffect } from "react";
import { motion, type Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";

const TEMPLATES = [
  {
    id: "senior-engineer-behavioral",
    title: "Senior Engineer",
    role: "Senior Software Engineer",
    duration: "45 min",
    competencies: ["Leadership", "Ownership", "Execution", "Communication"],
    description:
      "Comprehensive behavioral assessment for senior IC roles. Expect follow-up questions and competency challenges.",
  },
  {
    id: "engineering-manager-behavioral",
    title: "Engineering Manager",
    role: "Engineering Manager",
    duration: "45 min",
    competencies: ["Leadership", "Conflict Resolution", "Execution", "Growth"],
    description:
      "Management-track behavioral interview. Evaluates people leadership, cross-functional collaboration, and strategic thinking.",
  },
];

const FADE_UP: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0, 0, 1] },
  }),
};

interface Session {
  id: string;
  status: string;
  startedAt: string;
  template: { title: string; role: string };
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
    fetchSessions();
  }, []);

  async function fetchSessions() {
    const token = localStorage.getItem("token");
    if (!token) return;
    const res = await fetch("/api/interview/sessions", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setSessions(data.sessions ?? []);
    }
  }

  function signOut() {
    localStorage.clear();
    router.push("/");
  }

  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <div style={{ minHeight: "100vh", background: "#090909", color: "#f2f2f2" }}>

      {/* ── Nav ── */}
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{
          borderBottom: "1px solid #242424",
          background: "#090909",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: "0 40px",
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect width="20" height="20" rx="5" fill="#f97316" />
              <path d="M6 10.5L9 13.5L14 7.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontWeight: 600, fontSize: 15, letterSpacing: "-0.02em" }}>Intervue</span>
          </div>

          {/* User */}
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <span style={{ fontSize: 13, color: "#666" }}>{user?.email}</span>
            <button
              onClick={signOut}
              style={{
                fontSize: 13,
                color: "#666",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#f2f2f2")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#666")}
            >
              Sign out
            </button>
          </div>
        </div>
      </motion.header>

      {/* ── Content ── */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "56px 40px 80px" }}>

        {/* Greeting */}
        <motion.div
          custom={0} variants={FADE_UP} initial="hidden" animate="show"
          style={{ marginBottom: 52 }}
        >
          <h1 style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(1.6rem, 3vw, 2.25rem)",
            fontWeight: 600,
            letterSpacing: "-0.025em",
            lineHeight: 1.15,
            marginBottom: 8,
          }}>
            Good to see you, {firstName}.
          </h1>
          <p style={{ fontSize: 14, color: "#666", lineHeight: 1.6 }}>
            Choose an interview to start, or review a past session.
          </p>
        </motion.div>

        {/* Section label */}
        <motion.p
          custom={1} variants={FADE_UP} initial="hidden" animate="show"
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#555",
            marginBottom: 16,
          }}
        >
          Interviews
        </motion.p>

        {/* Template cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 16,
          marginBottom: 56,
        }}>
          {TEMPLATES.map((t, i) => (
            <TemplateCard
              key={t.id}
              template={t}
              index={i + 2}
              onStart={() => router.push(`/prepare/${t.id}`)}
            />
          ))}
        </div>

        {/* Past sessions */}
        {sessions.length > 0 && (
          <motion.div custom={5} variants={FADE_UP} initial="hidden" animate="show">
            <p style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#555",
              marginBottom: 16,
            }}>
              Past Sessions
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {sessions.map((s) => (
                <Link
                  key={s.id}
                  href={s.status === "COMPLETED" ? `/report/${s.id}` : `/interview/${s.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 20px",
                    borderRadius: 12,
                    background: "#141414",
                    border: "1px solid #242424",
                    textDecoration: "none",
                    color: "inherit",
                    transition: "border-color 0.15s",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.borderColor = "#333")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.borderColor = "#242424")}
                >
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>
                      {s.template.title}
                    </p>
                    <p style={{ fontSize: 12, color: "#555" }}>
                      {new Date(s.startedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span style={{
                    fontSize: 12,
                    padding: "4px 10px",
                    borderRadius: 6,
                    background: s.status === "COMPLETED" ? "rgba(249,115,22,0.1)" : "#1e1e1e",
                    color: s.status === "COMPLETED" ? "#f97316" : "#666",
                    border: `1px solid ${s.status === "COMPLETED" ? "rgba(249,115,22,0.2)" : "#2a2a2a"}`,
                  }}>
                    {s.status === "COMPLETED" ? "View report" : "Resume"}
                  </span>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ── Template Card ────────────────────────────────────────────────────

function TemplateCard({
  template,
  index,
  onStart,
}: {
  template: typeof TEMPLATES[0];
  index: number;
  onStart: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      custom={index}
      variants={FADE_UP as Variants}
      initial="hidden"
      animate="show"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#141414",
        border: `1px solid ${hovered ? "#333" : "#242424"}`,
        borderRadius: 14,
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: 0,
        transition: "border-color 0.15s, box-shadow 0.2s",
        boxShadow: hovered
          ? "0 0 0 1px #2a2a2a, 0 8px 32px rgba(0,0,0,0.4)"
          : "0 1px 3px rgba(0,0,0,0.3)",
        cursor: "default",
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.015em", marginBottom: 4 }}>
            {template.title}
          </h3>
          <p style={{ fontSize: 12, color: "#555" }}>
            {template.role} · {template.duration}
          </p>
        </div>
        <span style={{
          fontSize: 11,
          fontWeight: 600,
          padding: "4px 10px",
          borderRadius: 6,
          background: "rgba(249,115,22,0.1)",
          color: "#f97316",
          border: "1px solid rgba(249,115,22,0.2)",
          letterSpacing: "0.01em",
        }}>
          Behavioral
        </span>
      </div>

      {/* Description */}
      <p style={{ fontSize: 13, color: "#666", lineHeight: 1.65, marginBottom: 16 }}>
        {template.description}
      </p>

      {/* Competency tags */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
        {template.competencies.map((c) => (
          <span key={c} style={{
            fontSize: 11,
            padding: "3px 10px",
            borderRadius: 6,
            background: "#1c1c1c",
            color: "#888",
            border: "1px solid #2e2e2e",
          }}>
            {c}
          </span>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={onStart}
        style={{
          width: "100%",
          padding: "10px 0",
          borderRadius: 8,
          border: "none",
          background: hovered ? "#f97316" : "#1e1e1e",
          color: hovered ? "#fff" : "#999",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          transition: "background 0.2s, color 0.2s",
          letterSpacing: "-0.01em",
        }}
      >
        Begin interview →
      </button>
    </motion.div>
  );
}
