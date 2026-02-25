import { prisma } from "@/lib/prisma";
import {
  requireCoach,
  isErrorResponse,
  apiSuccess,
  apiError,
} from "@/lib/api-utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ planId: string }> }
) {
  const { planId } = await params;
  const authResult = await requireCoach();
  if (isErrorResponse(authResult)) return authResult.error;

  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    include: {
      runner: { select: { id: true, name: true } },
      blocks: {
        orderBy: { orderIndex: "asc" },
        include: {
          weeks: {
            orderBy: { weekNumber: "asc" },
            include: {
              workouts: {
                orderBy: { date: "asc" },
                include: { catalogueSession: true },
              },
            },
          },
        },
      },
    },
  });

  if (!plan) return apiError("Plan not found", 404);

  return apiSuccess(plan);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ planId: string }> }
) {
  const { planId } = await params;
  const authResult = await requireCoach();
  if (isErrorResponse(authResult)) return authResult.error;

  const existing = await prisma.plan.findUnique({ where: { id: planId } });
  if (!existing) return apiError("Plan not found", 404);

  const body = await request.json();

  const plan = await prisma.plan.update({
    where: { id: planId },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.goal !== undefined && { goal: body.goal }),
      ...(body.raceDate !== undefined && {
        raceDate: body.raceDate ? new Date(body.raceDate) : null,
      }),
      ...(body.startDate !== undefined && {
        startDate: new Date(body.startDate),
      }),
      ...(body.endDate !== undefined && { endDate: new Date(body.endDate) }),
      ...(body.status !== undefined && { status: body.status }),
    },
  });

  return apiSuccess(plan);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ planId: string }> }
) {
  const { planId } = await params;
  const authResult = await requireCoach();
  if (isErrorResponse(authResult)) return authResult.error;

  const existing = await prisma.plan.findUnique({ where: { id: planId } });
  if (!existing) return apiError("Plan not found", 404);

  await prisma.plan.delete({ where: { id: planId } });
  return apiSuccess({ deleted: true });
}
