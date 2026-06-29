import type { InterviewState, MemoryEntry, TurnEvaluation } from "./types";
import { nanoid } from "./utils";

export function addMemoryEntry(
  state: InterviewState,
  evaluation: TurnEvaluation,
  verbatim: string
): InterviewState {
  if (!evaluation.memoryCandidate || !evaluation.memoryFact) {
    return state;
  }

  const entry: MemoryEntry = {
    id: nanoid(),
    turn: state.turn,
    competency: state.currentCompetency,
    fact: evaluation.memoryFact,
    verbatim,
    recalled: false,
  };

  return {
    ...state,
    memory: [...state.memory, entry],
  };
}

// Returns a memory entry to recall this turn, if appropriate
export function selectMemoryToRecall(
  state: InterviewState
): MemoryEntry | null {
  const unrecalled = state.memory.filter((m) => !m.recalled);

  if (unrecalled.length === 0) return null;

  // Don't recall too early or too often
  if (state.turn < 4) return null;

  // Only recall every ~3 turns to avoid feeling robotic
  const lastRecallTurn = state.memory
    .filter((m) => m.recalled)
    .reduce((max, m) => Math.max(max, m.turn), 0);

  if (state.turn - lastRecallTurn < 3) return null;

  // Prefer memories from a different competency than current (creates contrast)
  const crossCompetency = unrecalled.filter(
    (m) => m.competency !== state.currentCompetency
  );

  return crossCompetency[0] ?? unrecalled[0] ?? null;
}

export function markMemoryRecalled(
  state: InterviewState,
  memoryId: string
): InterviewState {
  return {
    ...state,
    memory: state.memory.map((m) =>
      m.id === memoryId ? { ...m, recalled: true } : m
    ),
  };
}

export function formatMemoryForPrompt(memory: MemoryEntry[]): string {
  if (memory.length === 0) return "No salient memories yet.";
  return memory
    .map(
      (m) =>
        `[Turn ${m.turn}, ${m.competency}]: ${m.fact} (verbatim: "${m.verbatim.slice(0, 100)}...")`
    )
    .join("\n");
}
