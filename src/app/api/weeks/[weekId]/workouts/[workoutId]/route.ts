import { prisma } from "@/lib/prisma";
import {
  requireCoach,
  isErrorResponse,
  apiSuccess,
  apiError,
} from "@/lib/api-utils";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ weekId: string; workoutId: string }> }
) {
  const { weekId, workoutId } = await params;
  const authResult = await requireCoach();
  if (isErrorResponse(authResult)) return authResult.error;

  const existing = await prisma.workout.findFirst({
    where: { id: workoutId, weekId },
  });
  if (!existing) return apiError("Workout not found", 404);

  const body = await request.json();

  const workout = await prisma.workout.update({
    where: { id: workoutId },
    data: {
      ...(body.date !== undefined && { date: new Date(body.date) }),
      ...(body.title !== undefined && { title: body.title }),
      ...(body.workoutType !== undefined && { workoutType: body.workoutType }),
      ...(body.activity !== undefined && { activity: body.activity }),
      ...(body.distanceKm !== undefined && { distanceKm: body.distanceKm }),
      ...(body.targetPace !== undefined && {
        targetPace: body.targetPace || null,
      }),
      ...(body.durationMin !== undefined && {
        durationMin: body.durationMin ? parseInt(body.durationMin) : null,
      }),
      ...(body.intensity !== undefined && { intensity: body.intensity }),
      ...(body.details !== undefined && { details: body.details }),
      ...(body.coachNotes !== undefined && {
        coachNotes: body.coachNotes || null,
      }),
      ...(body.nutrition !== undefined && {
        nutrition: body.nutrition || null,
      }),
      ...(body.isPbRunning !== undefined && { isPbRunning: body.isPbRunning }),
      ...(body.catalogueSessionId !== undefined && {
        catalogueSessionId: body.catalogueSessionId || null,
      }),
    },
    include: { catalogueSession: true },
  });

  return apiSuccess(workout);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ weekId: string; workoutId: string }> }
) {
  const { weekId, workoutId } = await params;
  const authResult = await requireCoach();
  if (isErrorResponse(authResult)) return authResult.error;

  const existing = await prisma.workout.findFirst({
    where: { id: workoutId, weekId },
  });
  if (!existing) return apiError("Workout not found", 404);

  await prisma.workout.delete({ where: { id: workoutId } });

  // Check if week still has workouts, update isPopulated
  const remaining = await prisma.workout.count({ where: { weekId } });
  if (remaining === 0) {
    await prisma.week.update({
      where: { id: weekId },
      data: { isPopulated: false },
    });
  }

  return apiSuccess({ deleted: true });
}
