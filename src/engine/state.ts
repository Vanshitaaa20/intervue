import type {
  InterviewState,
  InterviewTemplate,
  CandidateProfile,
  CompetencyState,
  Competency,
} from "./types";

export function createInitialState(
  sessionId: string,
  candidate: CandidateProfile,
  template: InterviewTemplate
): InterviewState {
  const competencyStates = {} as Record<Competency, CompetencyState>;

  for (const config of template.competencies) {
    competencyStates[config.competency] = {
      competency: config.competency,
      turnsSpent: 0,
      coverage: 0,
      quality: null,
      followUpsAsked: 0,
      completed: false,
      notes: [],
    };
  }

  return {
    sessionId,
    candidateProfile: candidate,
    template,

    stage: "warmup",
    currentCompetency: template.competencies[0].competency,
    turn: 0,
    startedAt: Date.now(),
    elapsedMs: 0,

    competencyStates,
    completedCompetencies: [],

    difficulty: 2,
    difficultyTrend: [],

    memory: [],
    transcript: [],

    strengths: [],
    weaknesses: [],
    confidenceTrend: [],

    overallScore: null,
    isComplete: false,
  };
}
