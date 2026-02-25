import { prisma } from "@/lib/prisma";
import { requireCoach, isErrorResponse, apiSuccess } from "@/lib/api-utils";

export async function GET() {
  const auth = await requireCoach();
  if (isErrorResponse(auth)) return auth.error;

  const runners = await prisma.user.findMany({
    where: {
      role: "RUNNER",
      plans: { some: { status: "ACTIVE" } },
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return apiSuccess(runners);
}
