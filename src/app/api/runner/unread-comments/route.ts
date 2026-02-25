import { prisma } from "@/lib/prisma";
import { requireRunner, isErrorResponse, apiSuccess } from "@/lib/api-utils";

export async function GET() {
  const result = await requireRunner();
  if (isErrorResponse(result)) return result.error;

  const count = await prisma.comment.count({
    where: {
      workoutLog: { runnerId: result.user.id },
      read: false,
      authorId: { not: result.user.id },
    },
  });

  return apiSuccess({ count });
}
