import { prisma } from "@/lib/prisma";
import {
  requireCoach,
  isErrorResponse,
  apiSuccess,
  apiError,
} from "@/lib/api-utils";

export async function GET() {
  const authResult = await requireCoach();
  if (isErrorResponse(authResult)) return authResult.error;

  const sessions = await prisma.sessionCatalogue.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { workouts: true } } },
  });

  return apiSuccess(sessions);
}

export async function POST(request: Request) {
  const authResult = await requireCoach();
  if (isErrorResponse(authResult)) return authResult.error;

  const body = await request.json();
  const { name, activity } = body;

  if (!name || !activity) {
    return apiError("Name and activity are required");
  }

  const session = await prisma.sessionCatalogue.create({
    data: {
      name,
      activity,
      ...(body.workoutType !== undefined && { workoutType: body.workoutType }),
      ...(body.distanceKm !== undefined && { distanceKm: body.distanceKm }),
      ...(body.targetPace !== undefined && { targetPace: body.targetPace }),
      ...(body.durationMin !== undefined && { durationMin: body.durationMin }),
      ...(body.intensity !== undefined && { intensity: body.intensity }),
      details: body.details ?? "",
      ...(body.coachNotes !== undefined && { coachNotes: body.coachNotes }),
      ...(body.nutrition !== undefined && { nutrition: body.nutrition }),
      isPbRunning: body.isPbRunning ?? false,
    },
  });

  return apiSuccess(session, 201);
}
