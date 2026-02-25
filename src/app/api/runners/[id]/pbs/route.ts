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

  const pbs = await prisma.personalBest.findMany({
    where: { runnerId: id },
    orderBy: { date: "desc" },
  });

  return apiSuccess(pbs);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await requireCoach();
  if (isErrorResponse(authResult)) return authResult.error;

  const body = await request.json();
  const { distance, time, raceName, date } = body;

  if (!distance || !time || !date) {
    return apiError("Distance, time, and date are required");
  }

  const pb = await prisma.personalBest.create({
    data: {
      runnerId: id,
      distance,
      time,
      raceName: raceName || null,
      date: new Date(date),
    },
  });

  return apiSuccess(pb, 201);
}
