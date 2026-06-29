import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { errorResponse, ApiError } from "@/lib/errors";
import { callInterviewerLLM } from "@/lib/llm";
import {
  buildTurnPrompt,
  applyTurnOutput,
  buildOpeningQuestionPrompt,
  generateReport,
} from "@/engine";
import type { InterviewState, DecisionEvent } from "@/engine/types";

// POST /api/interview/[sessionId]/turn
// Called by Vapi on each candidate utterance.
// This is the single blocking LLM call per turn.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const user = requireAuth(req);
    const { sessionId } = await params;
    const { transcript } = await req.json() as { transcript: string };

    if (!transcript?.trim()) {
      throw new ApiError("transcript is required", 400);
    }

    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) throw new ApiError("Session not found", 404);
    if (session.userId !== user.userId) throw new ApiError("Forbidden", 403);
    if (session.status !== "ACTIVE") throw new ApiError("Session is not active", 400);

    const state = session.state as unknown as InterviewState;

    // Single LLM call — all intelligence lives here
    const { system, user: userMsg } = buildTurnPrompt(state, transcript);
    const llmOutput = await callInterviewerLLM(system, userMsg);

    // Deterministic reducers — no LLM involved
    const { nextState, decisionEvents, shouldEndInterview } = applyTurnOutput(
      state,
      transcript,
      llmOutput
    );

    const existingEvents = (session.events as unknown as DecisionEvent[]) ?? [];
    const allEvents = [...existingEvents, ...decisionEvents];

    // Persist state — single DB write
    if (shouldEndInterview) {
      const report = generateReport(nextState);
      await prisma.interviewSession.update({
        where: { id: sessionId },
        data: {
          state: nextState as any,
          events: allEvents as any,
          report: report as any,
          status: "COMPLETED",
          completedAt: new Date(),
          durationMs: Date.now() - state.startedAt,
        },
      });

      return NextResponse.json({
        response: llmOutput.spokenResponse,
        state: nextState,
        evaluation: llmOutput.evaluation,
        decisionEvents,
        shouldEndInterview: true,
      });
    }

    // Normal turn — check if we need an opening question for new competency
    let response = llmOutput.spokenResponse;
    if (
      decisionEvents.some((e) => e.event === "competency_advanced")
    ) {
      const { system: s, user: u } = buildOpeningQuestionPrompt(nextState);
      const opening = await callInterviewerLLM(s, u);
      // Append transition + new question
      response = `${llmOutput.spokenResponse} ${(opening as any).question ?? ""}`;
    }

    await prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        state: nextState as any,
        events: allEvents as any,
      },
    });

    return NextResponse.json({
      response,
      state: nextState,
      evaluation: llmOutput.evaluation,
      decisionEvents,
      shouldEndInterview: false,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
