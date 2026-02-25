import { prisma } from "@/lib/prisma";
import {
  requireCoach,
  isErrorResponse,
  apiSuccess,
  apiError,
} from "@/lib/api-utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ blockId: string }> }
) {
  const { blockId } = await params;
  const authResult = await requireCoach();
  if (isErrorResponse(authResult)) return authResult.error;

  const weeks = await prisma.week.findMany({
    where: { blockId },
    orderBy: { weekNumber: "asc" },
    include: {
      workouts: { orderBy: { date: "asc" } },
    },
  });

  return apiSuccess(weeks);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ blockId: string }> }
) {
  const { blockId } = await params;
  const authResult = await requireCoach();
  if (isErrorResponse(authResult)) return authResult.error;

  const block = await prisma.block.findUnique({ where: { id: blockId } });
  if (!block) return apiError("Block not found", 404);

  const body = await request.json();
  const { weekNumber, startDate } = body;

  if (weekNumber === undefined || !startDate) {
    return apiError("Week number and start date are required");
  }

  const week = await prisma.week.create({
    data: {
      blockId,
      weekNumber: parseInt(weekNumber),
      startDate: new Date(startDate),
      description: body.description || null,
      targetKm: body.targetKm ?? null,
      weekIntensity: body.weekIntensity || null,
      pacesFocus: body.pacesFocus || null,
      coachWeekNote: body.coachWeekNote || null,
    },
  });

  return apiSuccess(week, 201);
}
