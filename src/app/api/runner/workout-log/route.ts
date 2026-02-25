import { prisma } from "@/lib/prisma";
import { requireRunner, isErrorResponse, apiSuccess, apiError } from "@/lib/api-utils";

export async function POST(request: Request) {
  const result = await requireRunner();
  if (isErrorResponse(result)) return result.error;

  const body = await request.json();
  const { workoutId, completed, runnerNotes, actualDistanceKm, actualPace, actualDurationMin, avgHeartRate, rpe } = body;

  if (!workoutId || typeof completed !== "boolean") {
    return apiError("workoutId and completed are required");
  }

  // Validate optional fields
  if (rpe !== undefined && rpe !== null && (rpe < 1 || rpe > 10)) {
    return apiError("RPE must be between 1 and 10");
  }
  if (avgHeartRate !== undefined && avgHeartRate !== null && avgHeartRate <= 0) {
    return apiError("Heart rate must be greater than 0");
  }

  // Verify the workout belongs to this runner via workout → week → block → plan
  const workout = await prisma.workout.findUnique({
    where: { id: workoutId },
    include: {
      week: {
        include: {
          block: {
            include: {
              plan: { select: { runnerId: true } },
            },
          },
        },
      },
    },
  });

  if (!workout || workout.week.block.plan.runnerId !== result.user.id) {
    return apiError("Workout not found", 404);
  }

  // Build update/create data with conditional spread so simpler POSTs don't wipe detailed fields
  const data: Record<string, unknown> = { completed };
  if (runnerNotes !== undefined) data.runnerNotes = runnerNotes || null;
  if (actualDistanceKm !== undefined) data.actualDistanceKm = actualDistanceKm !== null ? actualDistanceKm : null;
  if (actualPace !== undefined) data.actualPace = actualPace || null;
  if (actualDurationMin !== undefined) data.actualDurationMin = actualDurationMin !== null ? actualDurationMin : null;
  if (avgHeartRate !== undefined) data.avgHeartRate = avgHeartRate !== null ? avgHeartRate : null;
  if (rpe !== undefined) data.rpe = rpe !== null ? rpe : null;

  const log = await prisma.workoutLog.upsert({
    where: {
      workoutId_runnerId: {
        workoutId,
        runnerId: result.user.id,
      },
    },
    update: data,
    create: {
      workoutId,
      runnerId: result.user.id,
      completed,
      runnerNotes: (runnerNotes as string) ?? null,
      ...(actualDistanceKm !== undefined && { actualDistanceKm }),
      ...(actualPace !== undefined && { actualPace: actualPace || null }),
      ...(actualDurationMin !== undefined && { actualDurationMin }),
      ...(avgHeartRate !== undefined && { avgHeartRate }),
      ...(rpe !== undefined && { rpe }),
    },
  });

  return apiSuccess(log);
}
