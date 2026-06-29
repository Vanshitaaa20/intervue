"use client";

import { motion } from "framer-motion";
import type { InterviewState } from "@/engine/types";

interface CompetencyProgressProps {
  state: InterviewState;
}

const COMPETENCY_LABELS: Record<string, string> = {
  leadership: "Leadership",
  ownership: "Ownership",
  conflict_resolution: "Conflict",
  communication: "Communication",
  growth_mindset: "Growth",
  execution: "Execution",
  collaboration: "Collaboration",
  problem_solving: "Problem Solving",
};

export function CompetencyProgress({ state }: CompetencyProgressProps) {
  const competencies = state.template.competencies;

  return (
    <div className="flex flex-col gap-3">
      {competencies.map((config) => {
        const cs = state.competencyStates[config.competency];
        const isActive = state.currentCompetency === config.competency;
        const isComplete = state.completedCompetencies.includes(config.competency);

        return (
          <div key={config.competency} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: isComplete
                      ? "var(--brand)"
                      : isActive
                      ? "var(--foreground)"
                      : "var(--subtle)",
                  }}
                />
                <span
                  className="text-xs"
                  style={{
                    color: isActive ? "var(--foreground)" : "var(--muted)",
                    fontWeight: isActive ? 500 : 400,
                  }}
                >
                  {COMPETENCY_LABELS[config.competency] ?? config.label}
                </span>
              </div>
              <span className="text-xs" style={{ color: "var(--muted)" }}>
                {Math.round(cs?.coverage ?? 0)}%
              </span>
            </div>

            {/* Progress bar */}
            <div
              className="h-0.5 rounded-full overflow-hidden"
              style={{ background: "var(--border)" }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: isComplete
                    ? "var(--brand)"
                    : isActive
                    ? "var(--foreground)"
                    : "var(--subtle)",
                }}
                initial={{ width: 0 }}
                animate={{ width: `${cs?.coverage ?? 0}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
