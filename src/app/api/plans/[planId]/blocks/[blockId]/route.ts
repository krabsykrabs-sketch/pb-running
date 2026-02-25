import { prisma } from "@/lib/prisma";
import {
  requireCoach,
  isErrorResponse,
  apiSuccess,
  apiError,
} from "@/lib/api-utils";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ planId: string; blockId: string }> }
) {
  const { planId, blockId } = await params;
  const authResult = await requireCoach();
  if (isErrorResponse(authResult)) return authResult.error;

  const existing = await prisma.block.findFirst({
    where: { id: blockId, planId },
  });
  if (!existing) return apiError("Block not found", 404);

  const body = await request.json();

  const block = await prisma.block.update({
    where: { id: blockId },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.orderIndex !== undefined && { orderIndex: body.orderIndex }),
    },
  });

  return apiSuccess(block);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ planId: string; blockId: string }> }
) {
  const { planId, blockId } = await params;
  const authResult = await requireCoach();
  if (isErrorResponse(authResult)) return authResult.error;

  const existing = await prisma.block.findFirst({
    where: { id: blockId, planId },
  });
  if (!existing) return apiError("Block not found", 404);

  await prisma.block.delete({ where: { id: blockId } });
  return apiSuccess({ deleted: true });
}
