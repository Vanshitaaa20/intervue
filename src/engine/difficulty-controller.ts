import type { Difficulty, InterviewState } from "./types";

export function adjustDifficulty(
  state: InterviewState,
  recommendation: "decrease" | "maintain" | "increase"
): InterviewState {
  const current = state.difficulty;
  let next = current;

  if (recommendation === "increase" && current < 5) {
    next = (current + 1) as Difficulty;
  } else if (recommendation === "decrease" && current > 1) {
    next = (current - 1) as Difficulty;
  }

  return {
    ...state,
    difficulty: next,
    difficultyTrend: [...state.difficultyTrend, recommendation],
  };
}

export function difficultyLabel(d: Difficulty): string {
  return (
    ["", "Foundational", "Standard", "Challenging", "Advanced", "Expert"][d] ??
    "Standard"
  );
}
