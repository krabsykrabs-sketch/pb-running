import { prisma } from "@/lib/prisma";
import { requireCoach, isErrorResponse, apiSuccess } from "@/lib/api-utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workoutId: string }> }
) {
  const result = await requireCoach();
  if (isErrorResponse(result)) return result.error;

  const { workoutId } = await params;

  const log = await prisma.workoutLog.findUnique({
    where: { workoutId },
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
