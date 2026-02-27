import { prisma } from "@/lib/prisma";
import {
  requireCoach,
  isErrorResponse,
  apiSuccess,
  apiError,
} from "@/lib/api-utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await requireCoach();
  if (isErrorResponse(authResult)) return authResult.error;

  const reviews = await prisma.runnerReview.findMany({
    where: { runnerId: id },
    orderBy: { reviewedAt: "desc" },
  });

  return apiSuccess(reviews);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await requireCoach();
  if (isErrorResponse(authResult)) return authResult.error;

  const body = await request.json();
  const { notes } = body;

  if (!notes || !notes.trim()) {
    return apiError("Review notes are required");
  }

  const runner = await prisma.user.findUnique({
    where: { id, role: "RUNNER" },
    select: { id: true },
  });
  if (!runner) return apiError("Runner not found", 404);

  const review = await prisma.runnerReview.create({
    data: {
      runnerId: id,
      notes: notes.trim(),
    },
  });

  return apiSuccess(review, 201);
}
