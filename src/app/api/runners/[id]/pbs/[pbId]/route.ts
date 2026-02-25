import { prisma } from "@/lib/prisma";
import {
  requireCoach,
  isErrorResponse,
  apiSuccess,
  apiError,
} from "@/lib/api-utils";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; pbId: string }> }
) {
  const { id, pbId } = await params;
  const authResult = await requireCoach();
  if (isErrorResponse(authResult)) return authResult.error;

  const existing = await prisma.personalBest.findFirst({
    where: { id: pbId, runnerId: id },
  });
  if (!existing) return apiError("PB not found", 404);

  const body = await request.json();

  const pb = await prisma.personalBest.update({
    where: { id: pbId },
    data: {
      ...(body.distance !== undefined && { distance: body.distance }),
      ...(body.time !== undefined && { time: body.time }),
      ...(body.raceName !== undefined && { raceName: body.raceName || null }),
      ...(body.date !== undefined && { date: new Date(body.date) }),
    },
  });

  return apiSuccess(pb);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; pbId: string }> }
) {
  const { pbId, id } = await params;
  const authResult = await requireCoach();
  if (isErrorResponse(authResult)) return authResult.error;

  const existing = await prisma.personalBest.findFirst({
    where: { id: pbId, runnerId: id },
  });
  if (!existing) return apiError("PB not found", 404);

  await prisma.personalBest.delete({ where: { id: pbId } });
  return apiSuccess({ deleted: true });
}
