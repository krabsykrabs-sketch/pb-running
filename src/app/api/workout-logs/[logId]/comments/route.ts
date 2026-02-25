import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse, apiSuccess, apiError } from "@/lib/api-utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ logId: string }> }
) {
  const result = await requireAuth();
  if (isErrorResponse(result)) return result.error;

  const { logId } = await params;

  const comments = await prisma.comment.findMany({
    where: { workoutLogId: logId },
    orderBy: { createdAt: "asc" },
    include: {
      author: { select: { id: true, name: true, role: true } },
    },
  });

  return apiSuccess(comments);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ logId: string }> }
) {
  const result = await requireAuth();
  if (isErrorResponse(result)) return result.error;

  const { logId } = await params;
  const body = await request.json();
  const { content } = body;

  if (!content || typeof content !== "string" || !content.trim()) {
    return apiError("Comment content is required");
  }

  // Verify the log exists
  const log = await prisma.workoutLog.findUnique({
    where: { id: logId },
  });

  if (!log) {
    return apiError("Workout log not found", 404);
  }

  const comment = await prisma.comment.create({
    data: {
      workoutLogId: logId,
      authorId: result.user.id,
      content: content.trim(),
      read: false,
    },
    include: {
      author: { select: { id: true, name: true, role: true } },
    },
  });

  return apiSuccess(comment, 201);
}
