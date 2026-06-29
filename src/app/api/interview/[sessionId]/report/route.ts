import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { errorResponse, ApiError } from "@/lib/errors";
import { generateReport } from "@/engine";
import type { InterviewState } from "@/engine/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const user = requireAuth(req);
    const { sessionId } = await params;

    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: { template: true },
    });

    if (!session) throw new ApiError("Session not found", 404);
    if (session.userId !== user.userId) throw new ApiError("Forbidden", 403);

    // If report was already generated on completion, return it
    if (session.report) {
      return NextResponse.json({ report: session.report });
    }

    // Generate on demand (e.g., abandoned session)
    const state = session.state as unknown as InterviewState;
    const report = generateReport(state);

    return NextResponse.json({ report });
  } catch (e) {
    return errorResponse(e);
  }
}
