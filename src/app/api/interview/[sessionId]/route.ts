import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { errorResponse, ApiError } from "@/lib/errors";

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

    return NextResponse.json({ state: session.state, status: session.status });
  } catch (e) {
    return errorResponse(e);
  }
}
