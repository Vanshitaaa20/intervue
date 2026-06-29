import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { errorResponse, ApiError } from "@/lib/errors";
import { generateReport } from "@/engine";
import type { InterviewState } from "@/engine/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const user = requireAuth(req);
    const { sessionId } = await params;

    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) throw new ApiError("Session not found", 404);
    if (session.userId !== user.userId) throw new ApiError("Forbidden", 403);

    const state = session.state as unknown as InterviewState;
    const report = generateReport(state);

    await prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        durationMs: Date.now() - state.startedAt,
        report: report as any,
      },
    });

    return NextResponse.json({ report });
  } catch (e) {
    return errorResponse(e);
  }
}
