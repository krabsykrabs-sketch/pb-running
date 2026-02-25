import { prisma } from "@/lib/prisma";
import { requireRunner, isErrorResponse, apiSuccess, apiError } from "@/lib/api-utils";

export async function GET() {
  const result = await requireRunner();
  if (isErrorResponse(result)) return result.error;

  const entries = await prisma.runnerAvailability.findMany({
    where: { runnerId: result.user.id },
    orderBy: { date: "asc" },
  });

  return apiSuccess(entries);
}

export async function POST(request: Request) {
  const result = await requireRunner();
  if (isErrorResponse(result)) return result.error;

  const body = await request.json();
  const { date, note } = body;

  if (!date) {
    return apiError("Date is required");
  }

  const entry = await prisma.runnerAvailability.upsert({
    where: {
      runnerId_date: {
        runnerId: result.user.id,
        date: new Date(date),
      },
    },
    update: { note: note ?? "" },
    create: {
      runnerId: result.user.id,
      date: new Date(date),
      note: note ?? "",
    },
  });

  return apiSuccess(entry, 201);
}
