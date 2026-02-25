import { prisma } from "@/lib/prisma";
import {
  requireCoach,
  isErrorResponse,
  apiSuccess,
  apiError,
} from "@/lib/api-utils";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ blockId: string; weekId: string }> }
) {
  try {
    const { blockId, weekId } = await params;
    const authResult = await requireCoach();
    if (isErrorResponse(authResult)) return authResult.error;

    const existing = await prisma.week.findFirst({
      where: { id: weekId, blockId },
    });
    if (!existing) return apiError("Week not found", 404);

    const body = await request.json();

    const week = await prisma.week.update({
      where: { id: weekId },
      data: {
        ...(body.weekNumber !== undefined && {
          weekNumber: parseInt(body.weekNumber),
        }),
        ...(body.startDate !== undefined && {
          startDate: new Date(body.startDate),
        }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.targetKm !== undefined && { targetKm: body.targetKm }),
        ...(body.weekIntensity !== undefined && {
          weekIntensity: body.weekIntensity,
        }),
        ...(body.pacesFocus !== undefined && { pacesFocus: body.pacesFocus }),
        ...(body.coachWeekNote !== undefined && {
          coachWeekNote: body.coachWeekNote,
        }),
        ...(body.isPopulated !== undefined && {
          isPopulated: body.isPopulated,
        }),
      },
    });

    return apiSuccess(week);
  } catch (err) {
    console.error("PUT /api/blocks/[blockId]/weeks/[weekId] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return apiError(`Failed to update week: ${message}`, 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ blockId: string; weekId: string }> }
) {
  const { blockId, weekId } = await params;
  const authResult = await requireCoach();
  if (isErrorResponse(authResult)) return authResult.error;

  const existing = await prisma.week.findFirst({
    where: { id: weekId, blockId },
  });
  if (!existing) return apiError("Week not found", 404);

  await prisma.week.delete({ where: { id: weekId } });
  return apiSuccess({ deleted: true });
}
