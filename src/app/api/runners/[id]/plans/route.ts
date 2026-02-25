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

  const plans = await prisma.plan.findMany({
    where: { runnerId: id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { blocks: true } },
    },
  });

  return apiSuccess(plans);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await requireCoach();
  if (isErrorResponse(authResult)) return authResult.error;

  const body = await request.json();
  const { name, goal, startDate } = body;

  if (!name || !goal || !startDate) {
    return apiError("Name, goal, and start date are required");
  }

  const start = new Date(startDate);
  const raceDate = body.raceDate ? new Date(body.raceDate) : null;
  // endDate defaults to raceDate if provided, otherwise startDate (updated as blocks are added)
  const endDate = body.endDate
    ? new Date(body.endDate)
    : raceDate || start;

  const plan = await prisma.plan.create({
    data: {
      runnerId: id,
      name,
      goal,
      raceDate,
      startDate: start,
      endDate,
      status: body.status || "DRAFT",
    },
  });

  return apiSuccess(plan, 201);
}
