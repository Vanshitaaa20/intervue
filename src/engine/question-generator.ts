import type { InterviewState } from "./types";
import { difficultyLabel } from "./difficulty-controller";

// Builds the opening question prompt for a new competency.
// Used when the interviewer transitions to a new area.
export function buildOpeningQuestionPrompt(
  state: InterviewState
): { system: string; user: string } {
  const { currentCompetency, difficulty, candidateProfile, template } = state;

  const config = template.competencies.find(
    (c) => c.competency === currentCompetency
  );

  const system = `You are an elite behavioral interviewer. Generate the opening question for a new competency.

CONTEXT:
- Candidate: ${candidateProfile.name}, ${candidateProfile.role}, ${candidateProfile.yearsOfExperience} years experience
- Competency: ${config?.label ?? currentCompetency}
- Description: ${config?.description ?? ""}
- Difficulty: ${difficultyLabel(difficulty)} (${difficulty}/5)

Generate a single, specific behavioral question that:
- Starts with "Tell me about a time..." or "Walk me through..." or "Describe a situation..."
- Is calibrated to difficulty level ${difficulty}
- Will elicit a STAR-format answer
- Is not generic — tie it to the competency's nuance

Respond with JSON only:
{
  "question": "<the question>",
  "rationale": "<why this question at this difficulty>"
}`;

  const user = `Generate the opening question for the ${currentCompetency} competency.`;

  return { system, user };
}

export function buildWarmupQuestion(state: InterviewState): string {
  const name = state.candidateProfile.name.split(" ")[0];
  return `Hi ${name}, welcome. I'm excited to learn more about your experience today. To start — can you walk me through a recent project you're proud of and your specific role in it?`;
}

export function buildWrapUpQuestion(): string {
  return `We're wrapping up. Is there a moment from your career that you feel best represents how you operate at your best — something we haven't covered yet?`;
}
