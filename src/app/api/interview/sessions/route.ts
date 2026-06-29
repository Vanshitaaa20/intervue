import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { errorResponse, ApiError } from "@/lib/errors";
import { createInitialState, buildWarmupQuestion } from "@/engine";
import type { InterviewTemplate, CandidateProfile } from "@/engine/types";

// POST /api/interview/sessions — create a new interview session
export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const { templateId, candidateProfile } = await req.json() as {
      templateId: string;
      candidateProfile: CandidateProfile;
    };

    if (!templateId || !candidateProfile) {
      throw new ApiError("templateId and candidateProfile are required", 400);
    }

    const template = await prisma.interviewTemplate.findUnique({
      where: { id: templateId },
    });
    if (!template) throw new ApiError("Template not found", 404);

    const engineTemplate: InterviewTemplate = {
      id: template.id,
      slug: template.slug,
      title: template.title,
      role: template.role,
      duration: template.duration,
      competencies: template.config as any,
      openingContext: template.description,
    };

    const sessionId = crypto.randomUUID();
    const initialState = createInitialState(sessionId, candidateProfile, engineTemplate);

    const session = await prisma.interviewSession.create({
      data: {
        id: sessionId,
        userId: user.userId,
        templateId,
        state: initialState as any,
        events: [],
      },
    });

    const openingQuestion = buildWarmupQuestion(initialState);

    return NextResponse.json({
      sessionId: session.id,
      openingQuestion,
      state: initialState,
    }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}

// GET /api/interview/sessions — list user's sessions
export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);

    const sessions = await prisma.interviewSession.findMany({
      where: { userId: user.userId },
      include: { template: { select: { title: true, role: true } } },
      orderBy: { startedAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ sessions });
  } catch (e) {
    return errorResponse(e);
  }
}
