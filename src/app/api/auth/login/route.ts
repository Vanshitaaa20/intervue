import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/jwt";
import { errorResponse, ApiError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      throw new ApiError("email and password are required", 400);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new ApiError("Invalid credentials", 401);

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new ApiError("Invalid credentials", 401);

    const token = signToken({ userId: user.id, email: user.email });

    return NextResponse.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
