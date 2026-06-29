import type {
  InterviewState,
  InterviewReport,
  CompetencyReport,
  Competency,
} from "./types";
import { getTotalCoverage } from "./coverage-planner";

export function generateReport(state: InterviewState): InterviewReport {
  const totalCoverage = getTotalCoverage(state);
  const overallScore = computeOverallScore(state);

  const competencyBreakdown: CompetencyReport[] = state.template.competencies.map(
    (config) => {
      const cs = state.competencyStates[config.competency];
      const competencyTurns = state.transcript.filter(
        (t) => t.competency === config.competency && t.role === "candidate"
      );
      const avgQualityScore = competencyTurns.reduce((sum, t) => {
        return sum + qualityToScore(t.evaluation?.quality);
      }, 0) / Math.max(1, competencyTurns.length);

      const evidence =
        competencyTurns[competencyTurns.length - 1]?.content?.slice(0, 150) ??
        "No response recorded";

      return {
        competency: config.competency,
        label: config.label,
        score: Math.round(avgQualityScore),
        coverage: Math.round(cs.coverage),
        notes: cs.notes,
        evidence,
      };
    }
  );

  const candidateTurns = state.transcript.filter((t) => t.role === "candidate");

  const bestTurn = [...candidateTurns].sort(
    (a, b) =>
      qualityToScore(b.evaluation?.quality) -
      qualityToScore(a.evaluation?.quality)
  )[0];

  const worstTurn = [...candidateTurns].sort(
    (a, b) =>
      qualityToScore(a.evaluation?.quality) -
      qualityToScore(b.evaluation?.quality)
  )[0];

  const bestQuestion =
    state.transcript
      .filter((t) => t.role === "interviewer" && t.turn < (bestTurn?.turn ?? 0))
      .slice(-1)[0]?.content ?? "N/A";

  const worstQuestion =
    state.transcript
      .filter(
        (t) => t.role === "interviewer" && t.turn < (worstTurn?.turn ?? 0)
      )
      .slice(-1)[0]?.content ?? "N/A";

  const starScores = candidateTurns
    .filter((t) => t.evaluation?.starStructure)
    .map((t) => {
      const s = t.evaluation!.starStructure;
      return [s.situation, s.task, s.action, s.result].filter(Boolean).length / 4;
    });

  const avgStarScore =
    starScores.length > 0
      ? starScores.reduce((a, b) => a + b, 0) / starScores.length
      : 0;

  return {
    sessionId: state.sessionId,
    candidateName: state.candidateProfile.name,
    role: state.candidateProfile.role,
    completedAt: Date.now(),
    durationMs: state.elapsedMs || Date.now() - state.startedAt,

    overallScore,
    grade: scoreToGrade(overallScore),
    summary: generateSummary(state, overallScore),

    competencyBreakdown,

    strengths: state.strengths.slice(0, 5),
    weaknesses: state.weaknesses.slice(0, 5),
    actionableImprovements: generateImprovements(state),

    starStructureScore: Math.round(avgStarScore * 100),
    communicationScore: computeCommunicationScore(state),

    bestAnswer: {
      question: bestQuestion,
      answer: bestTurn?.content ?? "N/A",
      why: "Highest quality score with strong STAR structure",
    },
    weakestAnswer: {
      question: worstQuestion,
      answer: worstTurn?.content ?? "N/A",
      why: "Lowest quality score, missing key STAR components",
    },
    standoutMoment: findStandoutMoment(state),

    confidenceTrend: state.confidenceTrend,
    difficultyProgression: state.difficultyTrend.map((_, i) =>
      Math.max(1, Math.min(5, 2 + i)) as 1 | 2 | 3 | 4 | 5
    ),

    decisionTimeline: [], // populated from reducer events stored in DB
    finalAdvice: generateFinalAdvice(state, overallScore),
  };
}

function qualityToScore(quality?: string | null): number {
  return { poor: 20, fair: 50, good: 75, excellent: 95 }[quality ?? ""] ?? 0;
}

function computeOverallScore(state: InterviewState): number {
  const candidateTurns = state.transcript.filter((t) => t.role === "candidate");
  if (candidateTurns.length === 0) return 0;

  const avg =
    candidateTurns.reduce(
      (sum, t) => sum + qualityToScore(t.evaluation?.quality),
      0
    ) / candidateTurns.length;

  const coverageBonus = getTotalCoverage(state) * 0.1;
  return Math.min(100, Math.round(avg + coverageBonus));
}

function scoreToGrade(score: number): "A" | "B" | "C" | "D" | "F" {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "F";
}

function computeCommunicationScore(state: InterviewState): number {
  const turns = state.transcript.filter(
    (t) => t.role === "candidate" && t.evaluation
  );
  if (turns.length === 0) return 0;

  const avg =
    turns.reduce(
      (sum, t) => sum + (t.evaluation?.confidence ?? 0),
      0
    ) / turns.length;

  return Math.round(avg);
}

function generateSummary(state: InterviewState, score: number): string {
  const name = state.candidateProfile.name.split(" ")[0];
  const grade = scoreToGrade(score);
  const top = state.template.competencies[0]?.label ?? "leadership";

  if (grade === "A") {
    return `${name} demonstrated exceptional depth across all competencies, with particularly strong narrative structure and self-awareness. A clear standout candidate.`;
  } else if (grade === "B") {
    return `${name} showed solid experience with good examples in most areas. Some answers lacked measurable outcomes but the overall signal is positive.`;
  } else if (grade === "C") {
    return `${name} provided adequate responses but struggled with specificity and structured storytelling. Would benefit from coaching on the STAR framework.`;
  }
  return `${name} had difficulty articulating concrete examples. The signal for ${top} was especially unclear.`;
}

function generateImprovements(state: InterviewState): string[] {
  const improvements: string[] = [];
  const turns = state.transcript.filter((t) => t.role === "candidate");

  const noResult = turns.filter((t) => !t.evaluation?.starStructure.result);
  if (noResult.length > turns.length * 0.5) {
    improvements.push(
      "Quantify outcomes: Most answers lacked measurable results. Always end with 'The result was X%...'"
    );
  }

  const lowConfidence = state.confidenceTrend.filter((c) => c < 50);
  if (lowConfidence.length > state.confidenceTrend.length * 0.3) {
    improvements.push(
      "Project confidence: Speak more directly. Avoid hedging language like 'I think' or 'sort of'."
    );
  }

  if (state.weaknesses.length > state.strengths.length) {
    improvements.push(
      "Build a story bank: Prepare 8-10 specific stories that can flex across competencies."
    );
  }

  improvements.push(
    "STAR structure: Spend ~20% on Situation/Task, ~60% on Action, ~20% on measurable Result."
  );

  return improvements.slice(0, 4);
}

function findStandoutMoment(state: InterviewState): string {
  const recalledMemory = state.memory.find((m) => m.recalled);
  if (recalledMemory) {
    return `When asked to reflect on a previous point, the candidate built on their earlier insight about "${recalledMemory.fact}" — demonstrating self-awareness and consistency.`;
  }

  const excellentTurns = state.transcript.filter(
    (t) => t.evaluation?.quality === "excellent"
  );
  if (excellentTurns.length > 0) {
    return `The candidate's answer in turn ${excellentTurns[0].turn} showed exceptional depth and measurable impact.`;
  }

  return "The candidate maintained composure throughout, even under direct follow-up questioning.";
}

function generateFinalAdvice(state: InterviewState, score: number): string {
  if (score >= 85) {
    return "Move forward. Strong candidate who should be fast-tracked to the team conversation.";
  } else if (score >= 70) {
    return "Recommend second-round with a technical or leadership deep-dive. Strong baseline signal.";
  } else if (score >= 55) {
    return "Consider a structured take-home or a focused second conversation on ownership and execution.";
  }
  return "Not recommended for next stage at this time. May reconsider after 6 months of additional experience.";
}
