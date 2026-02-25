import { prisma } from "@/lib/prisma";
import {
  requireCoach,
  isErrorResponse,
  apiSuccess,
  apiError,
} from "@/lib/api-utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const authResult = await requireCoach();
  if (isErrorResponse(authResult)) return authResult.error;

  const session = await prisma.sessionCatalogue.findUnique({
    where: { id: sessionId },
    include: { _count: { select: { workouts: true } } },
  });

  if (!session) return apiError("Session not found", 404);

  return apiSuccess(session);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const authResult = await requireCoach();
  if (isErrorResponse(authResult)) return authResult.error;

  const existing = await prisma.sessionCatalogue.findUnique({
    where: { id: sessionId },
  });
  if (!existing) return apiError("Session not found", 404);

  const body = await request.json();

  const session = await prisma.sessionCatalogue.update({
    where: { id: sessionId },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.activity !== undefined && { activity: body.activity }),
      ...(body.workoutType !== undefined && { workoutType: body.workoutType }),
      ...(body.distanceKm !== undefined && { distanceKm: body.distanceKm }),
      ...(body.targetPace !== undefined && { targetPace: body.targetPace }),
      ...(body.durationMin !== undefined && { durationMin: body.durationMin }),
      ...(body.intensity !== undefined && { intensity: body.intensity }),
      ...(body.details !== undefined && { details: body.details }),
      ...(body.coachNotes !== undefined && { coachNotes: body.coachNotes }),
      ...(body.nutrition !== undefined && { nutrition: body.nutrition }),
      ...(body.isPbRunning !== undefined && { isPbRunning: body.isPbRunning }),
    },
  });

  return apiSuccess(session);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const authResult = await requireCoach();
  if (isErrorResponse(authResult)) return authResult.error;

  const existing = await prisma.sessionCatalogue.findUnique({
    where: { id: sessionId },
  });
  if (!existing) return apiError("Session not found", 404);

  await prisma.sessionCatalogue.delete({ where: { id: sessionId } });
  return apiSuccess({ deleted: true });
}
