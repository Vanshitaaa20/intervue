"use client";

import { motion } from "framer-motion";
import type { InterviewState } from "@/engine/types";

interface DebugPanelProps {
  state: InterviewState;
  onClose: () => void;
}

export function DebugPanel({ state, onClose }: DebugPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.25 }}
      className="fixed bottom-0 left-0 right-0 z-50 max-h-[45vh] overflow-y-auto"
      style={{
        background: "rgba(0,0,0,0.95)",
        borderTop: "1px solid var(--border)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-3 sticky top-0"
        style={{
          background: "rgba(0,0,0,0.95)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: "var(--brand)" }}
          />
          <span className="text-xs font-mono font-medium" style={{ color: "var(--brand)" }}>
            DEBUG MODE
          </span>
          <span className="text-xs font-mono" style={{ color: "var(--muted)" }}>
            Session {state.sessionId.slice(0, 8)}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-xs font-mono"
          style={{ color: "var(--muted)" }}
        >
          [Shift+D to close]
        </button>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px" style={{ background: "var(--border)" }}>
        <DebugSection title="INTERVIEW STATE">
          <Row label="Stage" value={state.stage} />
          <Row label="Turn" value={String(state.turn)} />
          <Row label="Difficulty" value={`${state.difficulty}/5`} />
          <Row label="Competency" value={state.currentCompetency} />
          <Row label="Completed" value={`${state.completedCompetencies.length}/${state.template.competencies.length}`} />
        </DebugSection>

        <DebugSection title="COVERAGE">
          {state.template.competencies.map((c) => {
            const cs = state.competencyStates[c.competency];
            return (
              <Row
                key={c.competency}
                label={c.label}
                value={`${Math.round(cs?.coverage ?? 0)}%`}
                highlight={state.currentCompetency === c.competency}
              />
            );
          })}
        </DebugSection>

        <DebugSection title="MEMORY">
          {state.memory.length === 0 ? (
            <span className="text-xs font-mono" style={{ color: "var(--muted)" }}>
              No memories yet
            </span>
          ) : (
            state.memory.map((m) => (
              <div key={m.id} className="mb-2">
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className="text-xs font-mono"
                    style={{ color: m.recalled ? "var(--brand)" : "var(--muted)" }}
                  >
                    T{m.turn} · {m.competency}
                  </span>
                  {m.recalled && (
                    <span className="text-xs" style={{ color: "var(--brand)" }}>
                      ✓ recalled
                    </span>
                  )}
                </div>
                <p className="text-xs font-mono leading-relaxed" style={{ color: "var(--foreground)" }}>
                  {m.fact}
                </p>
              </div>
            ))
          )}
        </DebugSection>

        <DebugSection title="LAST EVALUATION">
          {(() => {
            const lastEval = [...state.transcript]
              .reverse()
              .find((t) => t.evaluation)?.evaluation;

            if (!lastEval) {
              return (
                <span className="text-xs font-mono" style={{ color: "var(--muted)" }}>
                  No evaluation yet
                </span>
              );
            }

            return (
              <>
                <Row label="Quality" value={lastEval.quality} />
                <Row label="Confidence" value={`${lastEval.confidence}%`} />
                <Row label="STAR" value={
                  [
                    lastEval.starStructure.situation && "S",
                    lastEval.starStructure.task && "T",
                    lastEval.starStructure.action && "A",
                    lastEval.starStructure.result && "R",
                  ]
                    .filter(Boolean)
                    .join("") || "—"
                } />
                <Row label="Difficulty" value={lastEval.difficultyRecommendation} />
                <Row label="Needs FU" value={lastEval.needsFollowUp ? "yes" : "no"} />
                {lastEval.followUpReason && (
                  <p className="text-xs font-mono mt-1" style={{ color: "var(--muted)" }}>
                    {lastEval.followUpReason}
                  </p>
                )}
              </>
            );
          })()}
        </DebugSection>
      </div>
    </motion.div>
  );
}

function DebugSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-4" style={{ background: "rgba(0,0,0,0.95)" }}>
      <p
        className="text-xs font-mono font-medium uppercase mb-3"
        style={{ color: "var(--muted)" }}
      >
        {title}
      </p>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-xs font-mono" style={{ color: "var(--muted)" }}>
        {label}
      </span>
      <span
        className="text-xs font-mono"
        style={{ color: highlight ? "var(--brand)" : "var(--foreground)" }}
      >
        {value}
      </span>
    </div>
  );
}
