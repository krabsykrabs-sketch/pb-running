import { prisma } from "@/lib/prisma";
import {
  requireCoach,
  requireCoachOrSelf,
  isErrorResponse,
  apiSuccess,
} from "@/lib/api-utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await requireCoachOrSelf(id);
  if (isErrorResponse(authResult)) return authResult.error;

  const plan = await prisma.nutritionPlan.findUnique({
    where: { runnerId: id },
  });

  return apiSuccess(plan);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await requireCoach();
  if (isErrorResponse(authResult)) return authResult.error;

  const body = await request.json();

  const plan = await prisma.nutritionPlan.upsert({
    where: { runnerId: id },
    create: {
      runnerId: id,
      generalStrategy: body.generalStrategy || null,
      raceDay: body.raceDay || null,
      supplements: body.supplements || null,
    },
    update: {
      ...(body.generalStrategy !== undefined && {
        generalStrategy: body.generalStrategy || null,
      }),
      ...(body.raceDay !== undefined && { raceDay: body.raceDay || null }),
      ...(body.supplements !== undefined && {
        supplements: body.supplements || null,
      }),
    },
  });

  return apiSuccess(plan);
}
