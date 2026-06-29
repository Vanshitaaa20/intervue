"use client";

import { useState, useEffect, use } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import type { InterviewReport, CompetencyReport } from "@/engine/types";

const FADE_UP: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.45, ease: "easeOut" },
  }),
};

export default function ReportPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const router = useRouter();
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [analysisStep, setAnalysisStep] = useState(0);

  const ANALYSIS_STEPS = [
    "Reviewing your responses...",
    "Scoring STAR structure...",
    "Mapping competency coverage...",
    "Identifying standout moments...",
    "Generating recommendations...",
    "Compiling your report...",
  ];

  useEffect(() => {
    // Progressive analysis display — runs while fetch is in flight
    const interval = setInterval(() => {
      setAnalysisStep((s) => Math.min(s + 1, ANALYSIS_STEPS.length - 1));
    }, 900);

    const token = localStorage.getItem("token");
    fetch(`/api/interview/${sessionId}/report`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        clearInterval(interval);
        setReport(d.report);
        setLoading(false);
      })
      .catch(() => {
        clearInterval(interval);
        setLoading(false);
      });

    return () => clearInterval(interval);
  }, [sessionId]);

  if (loading) return <AnalysisLoader step={analysisStep} steps={ANALYSIS_STEPS} />;
  if (!report) return <div className="p-8 text-center" style={{ color: "var(--muted)" }}>Report not found.</div>;

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      {/* Nav */}
      <nav
        className="flex items-center justify-between px-8 py-5"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
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

      <div className="max-w-4xl mx-auto px-8 py-14">
        {/* Header */}
        <motion.div custom={0} variants={FADE_UP} initial="hidden" animate="show" className="mb-14">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>
                Interview Report
              </p>
              <h1 className="display-md mb-1">{report.candidateName}</h1>
              <p style={{ color: "var(--muted)" }} className="text-base">{report.role}</p>
            </div>

            {/* Score */}
            <div className="text-right">
              <div
                className="text-5xl font-semibold tracking-tight mb-1"
                style={{ color: gradeColor(report.grade) }}
              >
                {report.grade}
              </div>
              <div className="text-sm" style={{ color: "var(--muted)" }}>
                {report.overallScore}/100
              </div>
            </div>
          </div>

          {/* Summary */}
          <p className="text-base leading-relaxed max-w-2xl" style={{ color: "var(--muted)" }}>
            {report.summary}
          </p>
        </motion.div>

        {/* Competency breakdown */}
        <motion.section custom={1} variants={FADE_UP} initial="hidden" animate="show" className="mb-12">
          <SectionLabel>Competency Breakdown</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {report.competencyBreakdown.map((c, i) => (
              <CompetencyCard key={c.competency} competency={c} index={i} />
            ))}
          </div>
        </motion.section>

        {/* Scores row */}
        <motion.section custom={2} variants={FADE_UP} initial="hidden" animate="show" className="mb-12">
          <SectionLabel>Scores</SectionLabel>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Overall", value: report.overallScore },
              { label: "STAR Structure", value: report.starStructureScore },
              { label: "Communication", value: report.communicationScore },
              {
                label: "Confidence Avg",
                value:
                  report.confidenceTrend.length > 0
                    ? Math.round(
                        report.confidenceTrend.reduce((a, b) => a + b, 0) /
                          report.confidenceTrend.length
                      )
                    : 0,
              },
            ].map((s) => (
              <ScoreCard key={s.label} label={s.label} value={s.value} />
            ))}
          </div>
        </motion.section>

        {/* Strengths / Weaknesses */}
        <motion.section custom={3} variants={FADE_UP} initial="hidden" animate="show" className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ListCard title="Strengths" items={report.strengths} accent="var(--brand)" />
            <ListCard title="Areas to improve" items={report.weaknesses} accent="var(--muted)" />
          </div>
        </motion.section>

        {/* Best / Weakest answers */}
        <motion.section custom={4} variants={FADE_UP} initial="hidden" animate="show" className="mb-12">
          <SectionLabel>Answer Spotlight</SectionLabel>
          <div className="flex flex-col gap-3">
            <AnswerCard
              label="Best answer"
              question={report.bestAnswer.question}
              answer={report.bestAnswer.answer}
              why={report.bestAnswer.why}
              positive
            />
            <AnswerCard
              label="Weakest answer"
              question={report.weakestAnswer.question}
              answer={report.weakestAnswer.answer}
              why={report.weakestAnswer.why}
              positive={false}
            />
          </div>
        </motion.section>

        {/* Standout moment */}
        <motion.section custom={5} variants={FADE_UP} initial="hidden" animate="show" className="mb-12">
          <SectionLabel>Standout Moment</SectionLabel>
          <div
            className="rounded-xl px-6 py-5"
            style={{ background: "var(--brand-dim)", border: "1px solid rgba(34,197,94,0.2)" }}
          >
            <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
              {report.standoutMoment}
            </p>
          </div>
        </motion.section>

        {/* Actionable improvements */}
        <motion.section custom={6} variants={FADE_UP} initial="hidden" animate="show" className="mb-12">
          <SectionLabel>Actionable Improvements</SectionLabel>
          <div className="flex flex-col gap-2">
            {report.actionableImprovements.map((item, i) => (
              <div
                key={i}
                className="flex gap-4 px-5 py-4 rounded-xl"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <span className="text-sm font-mono shrink-0" style={{ color: "var(--muted)" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-sm leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Final advice */}
        <motion.section custom={7} variants={FADE_UP} initial="hidden" animate="show" className="mb-16">
          <SectionLabel>Final Verdict</SectionLabel>
          <div
            className="rounded-xl px-6 py-5"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <p className="text-base font-medium mb-1">Recommendation</p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
              {report.finalAdvice}
            </p>
          </div>
        </motion.section>

        {/* CTA */}
        <motion.div
          custom={8}
          variants={FADE_UP}
          initial="hidden"
          animate="show"
          className="flex justify-center"
        >
          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-3 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
            style={{ background: "var(--foreground)", color: "var(--background)" }}
          >
            Practice again
          </button>
        </motion.div>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────

function AnalysisLoader({ step, steps }: { step: number; steps: string[] }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-6"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div style={{ background: "var(--brand)", borderRadius: 4 }} className="w-4 h-4" />
        <span className="font-semibold tracking-tight text-sm">Intervue</span>
      </div>

      {/* Progress bar */}
      <div
        className="w-64 h-0.5 rounded-full overflow-hidden"
        style={{ background: "var(--border)" }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ background: "var(--brand)" }}
          animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={step}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
          className="text-sm"
          style={{ color: "var(--muted)" }}
        >
          {steps[step]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: "var(--muted)" }}>
      {children}
    </p>
  );
}

function CompetencyCard({ competency, index }: { competency: CompetencyReport; index: number }) {
  return (
    <motion.div
      custom={index}
      variants={FADE_UP}
      initial="hidden"
      animate="show"
      className="px-5 py-4 rounded-xl"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium">{competency.label}</span>
        <span className="text-sm font-semibold">{competency.score}/100</span>
      </div>
      <div
        className="h-0.5 w-full rounded-full mb-3 overflow-hidden"
        style={{ background: "var(--border)" }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{
            background:
              competency.score >= 75 ? "var(--brand)" : competency.score >= 50 ? "var(--foreground)" : "var(--muted)",
          }}
          initial={{ width: 0 }}
          animate={{ width: `${competency.score}%` }}
          transition={{ duration: 0.7, delay: index * 0.05, ease: "easeOut" }}
        />
      </div>
      {competency.evidence && (
        <p
          className="text-xs leading-relaxed italic"
          style={{ color: "var(--muted)" }}
        >
          &ldquo;{competency.evidence.slice(0, 100)}{competency.evidence.length > 100 ? "..." : ""}&rdquo;
        </p>
      )}
    </motion.div>
  );
}

function ScoreCard({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="px-5 py-4 rounded-xl flex flex-col gap-1"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <span className="text-xs" style={{ color: "var(--muted)" }}>{label}</span>
      <span className="text-2xl font-semibold tracking-tight">{value}</span>
    </div>
  );
}

function ListCard({ title, items, accent }: { title: string; items: string[]; accent: string }) {
  return (
    <div
      className="px-5 py-5 rounded-xl"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: "var(--muted)" }}>
        {title}
      </p>
      {items.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--muted)" }}>None recorded.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="mt-1.5 w-1 h-1 rounded-full shrink-0" style={{ background: accent }} />
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AnswerCard({
  label,
  question,
  answer,
  why,
  positive,
}: {
  label: string;
  question: string;
  answer: string;
  why: string;
  positive: boolean;
}) {
  return (
    <div
      className="px-5 py-5 rounded-xl"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span
          className="text-xs px-2 py-0.5 rounded-md font-medium"
          style={{
            background: positive ? "var(--brand-dim)" : "var(--surface-hover)",
            color: positive ? "var(--brand)" : "var(--muted)",
          }}
        >
          {label}
        </span>
      </div>
      <p className="text-xs mb-2 font-medium" style={{ color: "var(--muted)" }}>
        Q: {question}
      </p>
      <p className="text-sm leading-relaxed mb-3 italic" style={{ color: "var(--foreground)" }}>
        &ldquo;{answer.slice(0, 200)}{answer.length > 200 ? "..." : ""}&rdquo;
      </p>
      <p className="text-xs" style={{ color: "var(--muted)" }}>{why}</p>
    </div>
  );
}

function gradeColor(grade: string): string {
  return (
    { A: "var(--brand)", B: "#60a5fa", C: "#f59e0b", D: "#f97316", F: "#ef4444" }[grade] ??
    "var(--foreground)"
  );
}
