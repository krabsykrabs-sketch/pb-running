import { prisma } from "@/lib/prisma";
import {
  requireCoach,
  isErrorResponse,
  apiSuccess,
  apiError,
} from "@/lib/api-utils";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; goalId: string }> }
) {
  const { id, goalId } = await params;
  const authResult = await requireCoach();
  if (isErrorResponse(authResult)) return authResult.error;

  const existing = await prisma.goal.findFirst({
    where: { id: goalId, runnerId: id },
  });
  if (!existing) return apiError("Goal not found", 404);

  const body = await request.json();

  const goal = await prisma.goal.update({
    where: { id: goalId },
    data: {
      ...(body.description !== undefined && { description: body.description }),
      ...(body.targetDate !== undefined && {
        targetDate: new Date(body.targetDate),
      }),
      ...(body.status !== undefined && { status: body.status }),
    },
  });

  return apiSuccess(goal);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; goalId: string }> }
) {
  const { goalId, id } = await params;
  const authResult = await requireCoach();
  if (isErrorResponse(authResult)) return authResult.error;

  const existing = await prisma.goal.findFirst({
    where: { id: goalId, runnerId: id },
  });
  if (!existing) return apiError("Goal not found", 404);

  await prisma.goal.delete({ where: { id: goalId } });
  return apiSuccess({ deleted: true });
}
