import { prisma } from "@/lib/prisma";
import {
  requireCoach,
  isErrorResponse,
  apiSuccess,
  apiError,
} from "@/lib/api-utils";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ planId: string }> }
) {
  const { planId } = await params;
  const authResult = await requireCoach();
  if (isErrorResponse(authResult)) return authResult.error;

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) return apiError("Plan not found", 404);

  const body = await request.json();
  const { blockIds } = body;

  if (!Array.isArray(blockIds) || blockIds.length === 0) {
    return apiError("blockIds array is required");
  }

  await prisma.$transaction(
    blockIds.map((id: string, index: number) =>
      prisma.block.update({
        where: { id },
        data: { orderIndex: index },
      })
    )
  );

  return apiSuccess({ reordered: true });
}
