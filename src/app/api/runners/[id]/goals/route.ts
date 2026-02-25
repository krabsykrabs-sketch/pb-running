import { prisma } from "@/lib/prisma";
import {
  requireCoach,
  requireCoachOrSelf,
  isErrorResponse,
  apiSuccess,
  apiError,
} from "@/lib/api-utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await requireCoachOrSelf(id);
  if (isErrorResponse(authResult)) return authResult.error;

  const goals = await prisma.goal.findMany({
    where: { runnerId: id },
    orderBy: { targetDate: "asc" },
  });

  return apiSuccess(goals);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await requireCoach();
  if (isErrorResponse(authResult)) return authResult.error;

  const body = await request.json();
  const { description, targetDate } = body;

  if (!description || !targetDate) {
    return apiError("Description and target date are required");
  }

  const goal = await prisma.goal.create({
    data: {
      runnerId: id,
      description,
      targetDate: new Date(targetDate),
      status: body.status || "ACTIVE",
    },
  });

  return apiSuccess(goal, 201);
}
