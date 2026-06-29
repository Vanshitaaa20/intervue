// Deterministic state machine — no LLM calls here.
// Consumes LLMTurnOutput and produces the next InterviewState.

import type {
  InterviewState,
  LLMTurnOutput,
  TurnRecord,
  DecisionEvent,
} from "./types";
import {
  applyAnswerToCoverage,
  getNextCompetency,
  markCompetencyComplete,
  getTotalCoverage,
} from "./coverage-planner";
import { adjustDifficulty } from "./difficulty-controller";
import { addMemoryEntry, markMemoryRecalled, selectMemoryToRecall } from "./memory-manager";

export interface ReducerResult {
  nextState: InterviewState;
  decisionEvents: DecisionEvent[];
  shouldEndInterview: boolean;
}

export function applyTurnOutput(
  state: InterviewState,
  candidateAnswer: string,
  llmOutput: LLMTurnOutput
): ReducerResult {
  const events: DecisionEvent[] = [];
  let next = { ...state };

  // 1. Record candidate turn in transcript
  const candidateTurn: TurnRecord = {
    turn: state.turn,
    role: "candidate",
    content: candidateAnswer,
    timestamp: Date.now(),
    competency: state.currentCompetency,
    evaluation: llmOutput.evaluation,
  };
  next = { ...next, transcript: [...next.transcript, candidateTurn] };

  // 2. Apply coverage delta
  next = applyAnswerToCoverage(
    next,
    llmOutput.evaluation.quality,
    llmOutput.evaluation.competencySignal
  );

  // 3. Adjust difficulty
  next = adjustDifficulty(next, llmOutput.evaluation.difficultyRecommendation);
  events.push({
    turn: state.turn,
    event: "difficulty_adjustment",
    reason: `Quality: ${llmOutput.evaluation.quality} → ${llmOutput.evaluation.difficultyRecommendation}`,
  });

  // 4. Update confidence trend
  next = {
    ...next,
    confidenceTrend: [...next.confidenceTrend, llmOutput.evaluation.confidence],
  };

  // 5. Extract memory if candidate
  next = addMemoryEntry(next, llmOutput.evaluation, candidateAnswer);
  if (llmOutput.evaluation.memoryCandidate) {
    events.push({
      turn: state.turn,
      event: "memory_stored",
      reason: llmOutput.evaluation.memoryFact ?? "salient fact",
    });
  }

  // 6. Update strengths / weaknesses
  if (llmOutput.evaluation.quality === "excellent") {
    next = {
      ...next,
      strengths: [
        ...next.strengths,
        `Turn ${state.turn}: ${next.currentCompetency}`,
      ],
    };
  } else if (llmOutput.evaluation.quality === "poor") {
    next = {
      ...next,
      weaknesses: [
        ...next.weaknesses,
        `Turn ${state.turn}: ${next.currentCompetency}`,
      ],
    };
  }

  // 7. Record interviewer response in transcript
  const interviewerTurn: TurnRecord = {
    turn: state.turn + 1,
    role: "interviewer",
    content: llmOutput.spokenResponse,
    timestamp: Date.now(),
    competency: next.currentCompetency,
  };
  next = {
    ...next,
    transcript: [...next.transcript, interviewerTurn],
    turn: next.turn + 2,
  };

  // 8. Decide whether to advance competency
  const nextCompetency = getNextCompetency(next);
  if (nextCompetency !== null) {
    next = markCompetencyComplete(next);
    events.push({
      turn: state.turn,
      event: "competency_advanced",
      reason: `Coverage ${Math.round(next.competencyStates[next.currentCompetency].coverage)}% after ${next.competencyStates[next.currentCompetency].turnsSpent} turns → advancing`,
    });
    // "__done__" sentinel means all competencies are finished
    if (nextCompetency !== "__done__" as any) {
      next = { ...next, currentCompetency: nextCompetency };
    }
  }

  // 9. Advance interview stage
  next = advanceStage(next, events);

  // 10. Check for interview completion
  const totalCoverage = getTotalCoverage(next);
  const allDone =
    next.completedCompetencies.length >= next.template.competencies.length ||
    (next.stage === "wrap_up" && next.turn > 4);

  if (allDone) {
    next = { ...next, isComplete: true, stage: "complete" };
    events.push({
      turn: next.turn,
      event: "interview_complete",
      reason: `Total coverage: ${totalCoverage.toFixed(0)}%`,
    });
  }

  return {
    nextState: next,
    decisionEvents: events,
    shouldEndInterview: allDone,
  };
}

function advanceStage(
  state: InterviewState,
  events: DecisionEvent[]
): InterviewState {
  const { stage, turn, completedCompetencies, template } = state;
  const totalCompetencies = template.competencies.length;
  const completedRatio = completedCompetencies.length / totalCompetencies;

  let nextStage = stage;

  if (stage === "warmup" && turn >= 2) {
    nextStage = "core";
  } else if (stage === "core" && completedRatio >= 0.6) {
    nextStage = "deep_dive";
  } else if (stage === "deep_dive" && completedRatio >= 0.9) {
    nextStage = "wrap_up";
  }

  if (nextStage !== stage) {
    events.push({
      turn: state.turn,
      event: "stage_transition",
      reason: `${stage} → ${nextStage}`,
    });
    return { ...state, stage: nextStage };
  }

  return state;
}
