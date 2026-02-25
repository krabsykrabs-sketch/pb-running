import { prisma } from "@/lib/prisma";
import {
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

  const logs = await prisma.healthLog.findMany({
    where: { runnerId: id },
    include: { author: { select: { name: true } } },
    orderBy: { date: "desc" },
  });

  return apiSuccess(logs);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await requireCoachOrSelf(id);
  if (isErrorResponse(authResult)) return authResult.error;

  const body = await request.json();
  const { description, bodyPart, severity, date, status } = body;

  if (!description || !bodyPart || !severity) {
    return apiError("Description, body part, and severity are required");
  }

  const log = await prisma.healthLog.create({
    data: {
      runnerId: id,
      authorId: authResult.user.id,
      date: date ? new Date(date) : new Date(),
      description,
      bodyPart,
      severity,
      status: status || "ACTIVE",
    },
    include: { author: { select: { name: true } } },
  });

  return apiSuccess(log, 201);
}
