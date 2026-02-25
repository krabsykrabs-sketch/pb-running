import { prisma } from "@/lib/prisma";
import { requireRunner, isErrorResponse, apiSuccess } from "@/lib/api-utils";

export async function PUT(
  _request: Request,
  { params }: { params: Promise<{ logId: string }> }
) {
  const result = await requireRunner();
  if (isErrorResponse(result)) return result.error;

  const { logId } = await params;

  // Mark all coach comments on this log as read (only those not authored by the runner)
  await prisma.comment.updateMany({
    where: {
      workoutLogId: logId,
      read: false,
      authorId: { not: result.user.id },
    },
    data: { read: true },
  });

  return apiSuccess({ ok: true });
}
