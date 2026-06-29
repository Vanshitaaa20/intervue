import type { InterviewState, LLMTurnOutput } from "./types";
import { formatMemoryForPrompt } from "./memory-manager";
import { difficultyLabel } from "./difficulty-controller";

// Builds the system prompt for the LLM acting as interviewer + evaluator.
// The LLM must return structured JSON matching LLMTurnOutput.
export function buildTurnPrompt(
  state: InterviewState,
  candidateAnswer: string
): { system: string; user: string } {
  const { candidateProfile, currentCompetency, difficulty, template } = state;

  const competencyConfig = template.competencies.find(
    (c) => c.competency === currentCompetency
  );

  const recentTranscript = state.transcript
    .slice(-6)
    .map((t) => `${t.role === "interviewer" ? "Interviewer" : "Candidate"}: ${t.content}`)
    .join("\n");

  const memoryContext = formatMemoryForPrompt(state.memory.filter((m) => !m.recalled));

  const system = `You are an elite behavioral interviewer conducting a ${template.title} interview for a ${candidateProfile.role} candidate with ${candidateProfile.yearsOfExperience} years of experience.

CURRENT STATE:
- Competency: ${competencyConfig?.label ?? currentCompetency} — ${competencyConfig?.description ?? ""}
- Difficulty: ${difficultyLabel(difficulty)} (${difficulty}/5)
- Interview Stage: ${state.stage}
- Turns in this competency: ${state.competencyStates[currentCompetency].turnsSpent}
- Coverage so far: ${state.competencyStates[currentCompetency].coverage}%

CANDIDATE MEMORY (salient facts you know about this candidate):
${memoryContext}

RECENT TRANSCRIPT:
${recentTranscript}

YOUR RESPONSIBILITIES:
1. Evaluate the candidate's answer across multiple dimensions
2. Decide whether to follow up, challenge, or move to next competency
3. If recalling a memory, weave it naturally into your spoken response
4. Adjust your questioning to the current difficulty level
5. Never be sycophantic. Challenge weak answers directly but professionally.

DIFFICULTY GUIDANCE:
- Level 1: Ask for a simple example, accept surface-level answers
- Level 2: Ask for context and outcomes, probe lightly
- Level 3: Challenge assumptions, ask what they'd do differently
- Level 4: Probe for systemic thinking, ask about failure modes
- Level 5: Ask about org-level impact, push on trade-offs and counterfactuals

You MUST respond with valid JSON only. No markdown, no explanation outside the JSON.

REQUIRED JSON SHAPE:
{
  "evaluation": {
    "quality": "poor" | "fair" | "good" | "excellent",
    "confidence": <0-100 integer>,
    "starStructure": {
      "situation": <boolean>,
      "task": <boolean>,
      "action": <boolean>,
      "result": <boolean>
    },
    "needsFollowUp": <boolean>,
    "followUpReason": <string | null>,
    "difficultyRecommendation": "decrease" | "maintain" | "increase",
    "memoryCandidate": <boolean>,
    "memoryFact": <string | null>,
    "competencySignal": <-1.0 to 1.0 float>
  },
  "spokenResponse": "<what the interviewer says aloud — natural, conversational, 1-3 sentences max>",
  "internalReasoning": "<your private evaluation reasoning, 1-2 sentences>"
}

SPOKEN RESPONSE RULES:
- Do NOT summarize what the candidate said
- Do NOT say "Great answer" or any affirmations
- Ask exactly one question per turn
- If recalling a memory, start with "Earlier you mentioned..."
- Keep it under 40 words
- Never reveal the evaluation scores`;

  const user = `Candidate's answer: "${candidateAnswer}"

Evaluate this answer and respond with JSON only.`;

  return { system, user };
}
