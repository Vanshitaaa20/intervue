import type {
  InterviewState,
  Competency,
  CompetencyConfig,
  AnswerQuality,
} from "./types";

const QUALITY_COVERAGE_DELTA: Record<AnswerQuality, number> = {
  poor: 10,
  fair: 20,
  good: 35,
  excellent: 50,
};

// Returns the next competency to move to, or null if current should continue
export function getNextCompetency(state: InterviewState): Competency | null {
  const config = getCurrentCompetencyConfig(state);
  const currentState = state.competencyStates[state.currentCompetency];

  if (!config) return null;

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

  return remaining[0] ?? null;
}

export function applyAnswerToCoverage(
  state: InterviewState,
  quality: AnswerQuality,
  competencySignal: number // -1 to 1
): InterviewState {
  const current = state.competencyStates[state.currentCompetency];
  const delta = QUALITY_COVERAGE_DELTA[quality] * Math.max(0, competencySignal);

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
