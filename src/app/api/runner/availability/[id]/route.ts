import { prisma } from "@/lib/prisma";
import { requireRunner, isErrorResponse, apiSuccess, apiError } from "@/lib/api-utils";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireRunner();
  if (isErrorResponse(result)) return result.error;
  const { id } = await params;

  const entry = await prisma.runnerAvailability.findUnique({
    where: { id },
  });

  if (!entry || entry.runnerId !== result.user.id) {
    return apiError("Not found", 404);
  }

  await prisma.runnerAvailability.delete({ where: { id } });

  return apiSuccess({ deleted: true });
}
