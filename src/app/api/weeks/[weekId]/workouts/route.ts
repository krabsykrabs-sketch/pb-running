import { prisma } from "@/lib/prisma";
import {
  requireCoach,
  isErrorResponse,
  apiSuccess,
  apiError,
} from "@/lib/api-utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ weekId: string }> }
) {
  const { weekId } = await params;
  const authResult = await requireCoach();
  if (isErrorResponse(authResult)) return authResult.error;

  const workouts = await prisma.workout.findMany({
    where: { weekId },
    orderBy: { date: "asc" },
    include: { catalogueSession: true },
  });

  return apiSuccess(workouts);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ weekId: string }> }
) {
  const { weekId } = await params;
  const authResult = await requireCoach();
  if (isErrorResponse(authResult)) return authResult.error;

  const week = await prisma.week.findUnique({ where: { id: weekId } });
  if (!week) return apiError("Week not found", 404);

  const body = await request.json();
  const { date, activity } = body;

  if (!date || !activity) {
    return apiError("Date and activity are required");
  }

  const workout = await prisma.workout.create({
    data: {
      weekId,
      date: new Date(date),
      title: body.title || "",
      workoutType: body.workoutType || "EASY",
      activity,
      distanceKm: body.distanceKm ?? null,
      targetPace: body.targetPace || null,
      durationMin: body.durationMin ? parseInt(body.durationMin) : null,
      intensity: body.intensity || "MODERATE",
      details: body.details || "",
      coachNotes: body.coachNotes || null,
      nutrition: body.nutrition || null,
      isPbRunning: body.isPbRunning ?? false,
      catalogueSessionId: body.catalogueSessionId || null,
    },
    include: { catalogueSession: true },
  });

  // Mark week as populated
  await prisma.week.update({
    where: { id: weekId },
    data: { isPopulated: true },
  });

  return apiSuccess(workout, 201);
}
