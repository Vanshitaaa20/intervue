import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/errors";

export async function GET(_req: NextRequest) {
  try {
    const templates = await prisma.interviewTemplate.findMany({
      select: { id: true, slug: true, title: true, role: true, duration: true, description: true, config: true },
    });
    return NextResponse.json({ templates });
  } catch (e) {
    return errorResponse(e);
  }
}
