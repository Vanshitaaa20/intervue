import type {
  InterviewState,
  Competency,
  CompetencyConfig,
  AnswerQuality,
} from "./types";

const QUALITY_COVERAGE_DELTA: Record<AnswerQuality, number> = {
  poor: 8,
  fair: 18,
  good: 30,
  excellent: 42,
};

// Minimum turns before a competency can be marked complete, regardless of coverage.
// Prevents a single "excellent" answer from rushing past a competency.
const MIN_TURNS_BEFORE_ADVANCE = 2;

// Returns the next competency to move to, or null if current should continue
export function getNextCompetency(state: InterviewState): Competency | null {
  const config = getCurrentCompetencyConfig(state);
  const currentState = state.competencyStates[state.currentCompetency];

  if (!config) return null;

  // Never advance before minimum turns — the interviewer must probe at least twice
  if (currentState.turnsSpent < MIN_TURNS_BEFORE_ADVANCE) return null;

  const shouldAdvance =
    currentState.coverage >= 80 ||
    currentState.turnsSpent >= config.targetTurns;

  if (!shouldAdvance) return null;

  const remaining = state.template.competencies
    .map((c) => c.competency)
    .filter(
      (c) =>
        c !== state.currentCompetency &&
        !state.completedCompetencies.includes(c) &&
        state.competencyStates[c].coverage < 80
    );

  // Even if no remaining competencies, mark current complete so allDone fires correctly
  return remaining[0] ?? "__done__" as Competency;
}

export function applyAnswerToCoverage(
  state: InterviewState,
  quality: AnswerQuality,
  competencySignal: number // -1 to 1
): InterviewState {
  const current = state.competencyStates[state.currentCompetency];
  // Use abs(competencySignal) so even negatively-framed answers that demonstrate
  // the competency still contribute — the quality score captures actual performance
  const signalBoost = Math.max(0.3, Math.abs(competencySignal));
  const delta = QUALITY_COVERAGE_DELTA[quality] * signalBoost;

  const updated: typeof current = {
    ...current,
    turnsSpent: current.turnsSpent + 1,
    coverage: Math.min(100, current.coverage + delta),
    quality,
  };

  return {
    ...state,
    competencyStates: {
      ...state.competencyStates,
      [state.currentCompetency]: updated,
    },
  };
}

export function markCompetencyComplete(state: InterviewState): InterviewState {
  const current = state.competencyStates[state.currentCompetency];

  return {
    ...state,
    competencyStates: {
      ...state.competencyStates,
      [state.currentCompetency]: { ...current, completed: true },
    },
    completedCompetencies: [
      ...state.completedCompetencies,
      state.currentCompetency,
    ],
  };
}

export function getTotalCoverage(state: InterviewState): number {
  const states = Object.values(state.competencyStates);
  if (states.length === 0) return 0;
  return states.reduce((sum, s) => sum + s.coverage, 0) / states.length;
}

function getCurrentCompetencyConfig(
  state: InterviewState
): CompetencyConfig | undefined {
  return state.template.competencies.find(
    (c) => c.competency === state.currentCompetency
  );
}
