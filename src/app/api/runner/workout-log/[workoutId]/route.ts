import { prisma } from "@/lib/prisma";
import { requireRunner, isErrorResponse, apiSuccess, apiError } from "@/lib/api-utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workoutId: string }> }
) {
  const result = await requireRunner();
  if (isErrorResponse(result)) return result.error;

  const { workoutId } = await params;

  // Verify the workout belongs to this runner
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

  const log = await prisma.workoutLog.findUnique({
    where: {
      workoutId_runnerId: {
        workoutId,
        runnerId: result.user.id,
      },
    },
    include: {
      comments: {
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, name: true, role: true } },
        },
      },
    },
  });

  return apiSuccess(log);
}
