import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/jwt";
import { errorResponse, ApiError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const { email, name, password } = await req.json();

    if (!email || !name || !password) {
      throw new ApiError("email, name, and password are required", 400);
    }

    if (password.length < 8) {
      throw new ApiError("Password must be at least 8 characters", 400);
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new ApiError("Email already registered", 409);

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, name, passwordHash },
    });

    const token = signToken({ userId: user.id, email: user.email });

    return NextResponse.json(
      { token, user: { id: user.id, email: user.email, name: user.name } },
      { status: 201 }
    );
  } catch (e) {
    return errorResponse(e);
  }
}
