import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse, ApiError } from "@/lib/errors";
import { callInterviewerLLM } from "@/lib/llm";
import {
  buildTurnPrompt,
  applyTurnOutput,
  buildOpeningQuestionPrompt,
  generateReport,
  buildWarmupQuestion,
} from "@/engine";
import type { InterviewState, DecisionEvent } from "@/engine/types";

// Vapi Custom LLM endpoint.
// Vapi sends OpenAI-compatible chat completion requests here.
// We respond with the interviewer's next spoken line.
//
// Vapi docs: https://docs.vapi.ai/customization/custom-llm
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Vapi sends OpenAI-format: { messages, model, stream, ... }
    // We embed sessionId in the system message or metadata
    const messages: { role: string; content: string }[] = body.messages ?? [];
    const sessionId = body.call?.metadata?.sessionId as string | undefined;

    if (!sessionId) {
      // No session context — return a generic opening
      return vapiResponse("Hello! I'm ready to begin your interview. Could you tell me a bit about yourself?");
    }

    // Extract last user message (candidate's speech)
    const lastUser = [...messages]
      .reverse()
      .find((m) => m.role === "user");

    if (!lastUser?.content) {
      return vapiResponse("I didn't catch that — could you repeat?");
    }

    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.status !== "ACTIVE") {
      return vapiResponse("It looks like this interview session has ended.");
    }

    const state = session.state as unknown as InterviewState;

    // Warmup turn: return opening question without LLM call
    if (state.turn === 0 && lastUser.content.toLowerCase().includes("hello")) {
      const opening = buildWarmupQuestion(state);
      return vapiResponse(opening);
    }

    // Single LLM call
    const { system, user } = buildTurnPrompt(state, lastUser.content);
    const llmOutput = await callInterviewerLLM(system, user);

    const { nextState, decisionEvents, shouldEndInterview } = applyTurnOutput(
      state,
      lastUser.content,
      llmOutput
    );

    const existingEvents = (session.events as unknown as DecisionEvent[]) ?? [];

    let spokenResponse = llmOutput.spokenResponse;

    if (decisionEvents.some((e) => e.event === "competency_advanced")) {
      const { system: s, user: u } = buildOpeningQuestionPrompt(nextState);
      const opening = await callInterviewerLLM(s, u);
      spokenResponse = `${llmOutput.spokenResponse} ${(opening as any).question ?? ""}`;
    }

    if (shouldEndInterview) {
      const report = generateReport(nextState);
      await prisma.interviewSession.update({
        where: { id: sessionId },
        data: {
          state: nextState as any,
          events: [...existingEvents, ...decisionEvents] as any,
          report: report as any,
          status: "COMPLETED",
          completedAt: new Date(),
          durationMs: Date.now() - state.startedAt,
        },
      });
      spokenResponse =
        "That brings us to the end of our conversation. Thank you so much — you'll receive a detailed report shortly.";
    } else {
      await prisma.interviewSession.update({
        where: { id: sessionId },
        data: {
          state: nextState as any,
          events: [...existingEvents, ...decisionEvents] as any,
        },
      });
    }

    return vapiResponse(spokenResponse);
  } catch (e) {
    console.error("Vapi webhook error:", e);
    return vapiResponse("I encountered a technical issue. Let's continue — please go ahead.");
  }
}

// Vapi expects OpenAI chat completion format
function vapiResponse(content: string) {
  return NextResponse.json({
    id: `chatcmpl-${Date.now()}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: "intervue-v1",
    choices: [
      {
        index: 0,
        message: { role: "assistant", content },
        finish_reason: "stop",
      },
    ],
    usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
  });
}
