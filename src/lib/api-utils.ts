import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export function apiSuccess(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

type SessionUser = { id: string; role: string; email: string; name: string };

type AuthResult =
  | { user: SessionUser; error?: undefined }
  | { user?: undefined; error: NextResponse };

export function isErrorResponse(
  result: AuthResult
): result is { error: NextResponse } {
  return result.error !== undefined;
}

export async function requireCoach(): Promise<AuthResult> {
  const session = await auth();
  if (!session?.user) {
    return { error: apiError("Unauthorized", 401) };
  }
  const user = session.user as SessionUser;
  if (user.role !== "COACH") {
    return { error: apiError("Forbidden", 403) };
  }
  return { user };
}

export async function requireRunner(): Promise<AuthResult> {
  const session = await auth();
  if (!session?.user) {
    return { error: apiError("Unauthorized", 401) };
  }
  const user = session.user as SessionUser;
  if (user.role !== "RUNNER") {
    return { error: apiError("Forbidden", 403) };
  }
  return { user };
}

export async function requireAuth(): Promise<AuthResult> {
  const session = await auth();
  if (!session?.user) {
    return { error: apiError("Unauthorized", 401) };
  }
  const user = session.user as SessionUser;
  if (user.role !== "COACH" && user.role !== "RUNNER") {
    return { error: apiError("Forbidden", 403) };
  }
  return { user };
}

export async function requireCoachOrSelf(
  runnerId: string
): Promise<AuthResult> {
  const session = await auth();
  if (!session?.user) {
    return { error: apiError("Unauthorized", 401) };
  }
  const user = session.user as SessionUser;
  if (user.role !== "COACH" && user.id !== runnerId) {
    return { error: apiError("Forbidden", 403) };
  }
  return { user };
}
