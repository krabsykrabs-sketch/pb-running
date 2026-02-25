import { prisma } from "@/lib/prisma";
import {
  requireCoach,
  requireCoachOrSelf,
  isErrorResponse,
  apiSuccess,
  apiError,
} from "@/lib/api-utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await requireCoachOrSelf(id);
  if (isErrorResponse(authResult)) return authResult.error;

  const runner = await prisma.user.findUnique({
    where: { id, role: "RUNNER" },
    include: {
      profile: true,
      nutritionPlan: true,
      personalBests: { orderBy: { date: "desc" } },
      goals: { orderBy: { targetDate: "asc" } },
      healthLogsAsRunner: { orderBy: { date: "desc" } },
      reviews: { orderBy: { reviewedAt: "desc" }, take: 5 },
    },
  });

  if (!runner) return apiError("Runner not found", 404);
  return apiSuccess(runner);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await requireCoach();
  if (isErrorResponse(authResult)) return authResult.error;

  const body = await request.json();
  const { name, email, isActive } = body;

  const runner = await prisma.user.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email }),
      ...(isActive !== undefined && { isActive }),
    },
    include: { profile: true },
  });

  return apiSuccess(runner);
}
