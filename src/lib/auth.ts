import { NextRequest } from "next/server";
import { verifyToken, extractTokenFromHeader, type JWTPayload } from "./jwt";
import { ApiError } from "./errors";

export function requireAuth(req: NextRequest): JWTPayload {
  const token = extractTokenFromHeader(req.headers.get("authorization"));
  if (!token) throw new ApiError("Missing authorization header", 401);

  try {
    return verifyToken(token);
  } catch {
    throw new ApiError("Invalid or expired token", 401);
  }
}
