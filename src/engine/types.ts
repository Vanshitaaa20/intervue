// Core domain types for the Interview Engine.
// These are pure data shapes — no framework dependencies.

export type InterviewStage =
  | "warmup"
  | "core"
  | "deep_dive"
  | "wrap_up"
  | "complete";

export type Difficulty = 1 | 2 | 3 | 4 | 5;

export type AnswerQuality = "poor" | "fair" | "good" | "excellent";

export type Competency =
  | "leadership"
  | "ownership"
  | "conflict_resolution"
  | "communication"
  | "growth_mindset"
  | "execution"
  | "collaboration"
  | "problem_solving";

export interface CompetencyConfig {
  competency: Competency;
  label: string;
  description: string;
  targetTurns: number; // how many quality turns before moving on
  minTurns: number;
}

export interface CompetencyState {
  competency: Competency;
  turnsSpent: number;
  coverage: number; // 0–100
  quality: AnswerQuality | null;
  followUpsAsked: number;
  completed: boolean;
  notes: string[];
}

export interface MemoryEntry {
  id: string;
  turn: number;
  competency: Competency;
  fact: string; // distilled salient fact
  verbatim: string; // the candidate's exact words
  recalled: boolean; // has this been surfaced back to the candidate
}

export interface TurnRecord {
  turn: number;
  role: "interviewer" | "candidate";
  content: string;
  timestamp: number;
  competency: Competency;
  evaluation?: TurnEvaluation;
}

export interface TurnEvaluation {
  quality: AnswerQuality;
  confidence: number; // 0–100
  starStructure: {
    situation: boolean;
    task: boolean;
    action: boolean;
    result: boolean;
  };
  needsFollowUp: boolean;
  followUpReason: string | null;
  difficultyRecommendation: "decrease" | "maintain" | "increase";
  memoryCandidate: boolean;
  memoryFact: string | null;
  competencySignal: number; // -1 to 1, how much this answer covers the competency
}

export interface CandidateProfile {
  name: string;
  role: string; // e.g., "Senior Software Engineer"
  yearsOfExperience: number;
}

export interface InterviewTemplate {
  id: string;
  slug?: string;
  title: string;
  role: string;
  duration: number; // minutes
  competencies: CompetencyConfig[];
  openingContext: string;
}

export interface InterviewState {
  sessionId: string;
  candidateProfile: CandidateProfile;
  template: InterviewTemplate;

  stage: InterviewStage;
  currentCompetency: Competency;
  turn: number;
  startedAt: number;
  elapsedMs: number;

  competencyStates: Record<Competency, CompetencyState>;
  completedCompetencies: Competency[];

  difficulty: Difficulty;
  difficultyTrend: ("increase" | "maintain" | "decrease")[];

  memory: MemoryEntry[];
  transcript: TurnRecord[];

  strengths: string[];
  weaknesses: string[];
  confidenceTrend: number[]; // confidence per turn

  overallScore: number | null; // set on completion
  isComplete: boolean;
}

// What the LLM returns — consumed by reducers
export interface LLMTurnOutput {
  evaluation: TurnEvaluation;
  spokenResponse: string;
  internalReasoning: string; // never spoken, used for debug
}

// Input to the LLM turn handler
export interface TurnInput {
  state: InterviewState;
  candidateTranscript: string; // current turn's speech
}

// What the report generator produces
export interface InterviewReport {
  sessionId: string;
  candidateName: string;
  role: string;
  completedAt: number;
  durationMs: number;

  overallScore: number; // 0–100
  grade: "A" | "B" | "C" | "D" | "F";
  summary: string;

  competencyBreakdown: CompetencyReport[];

  strengths: string[];
  weaknesses: string[];
  actionableImprovements: string[];

  starStructureScore: number; // average across turns
  communicationScore: number;

  bestAnswer: { question: string; answer: string; why: string };
  weakestAnswer: { question: string; answer: string; why: string };
  standoutMoment: string;

  confidenceTrend: number[];
  difficultyProgression: Difficulty[];

  decisionTimeline: DecisionEvent[];
  finalAdvice: string;
}

export interface CompetencyReport {
  competency: Competency;
  label: string;
  score: number; // 0–100
  coverage: number; // 0–100
  notes: string[];
  evidence: string; // transcript quote
}

export interface DecisionEvent {
  turn: number;
  event: string;
  reason: string;
}
