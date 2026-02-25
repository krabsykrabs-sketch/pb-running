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

  const blocks = await prisma.block.findMany({
    where: { planId },
    orderBy: { orderIndex: "asc" },
    include: {
      weeks: {
        orderBy: { weekNumber: "asc" },
        include: {
          workouts: { orderBy: { date: "asc" } },
        },
      },
    },
  });

  return apiSuccess(blocks);
}

// Get the Monday of the week containing the given date
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday = 1, Sunday = 0 → go back 6
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ planId: string }> }
) {
  const { planId } = await params;
  const authResult = await requireCoach();
  if (isErrorResponse(authResult)) return authResult.error;

  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    include: {
      blocks: {
        include: { weeks: { select: { id: true } } },
      },
    },
  });
  if (!plan) return apiError("Plan not found", 404);

  const body = await request.json();
  const { name, description, weeks: weekCount } = body;

  if (!name) {
    return apiError("Block name is required");
  }
  if (!weekCount || weekCount < 1) {
    return apiError("Number of weeks is required (minimum 1)");
  }

  // Auto-assign orderIndex
  const maxOrder = await prisma.block.aggregate({
    where: { planId },
    _max: { orderIndex: true },
  });
  const orderIndex = body.orderIndex ?? (maxOrder._max.orderIndex ?? -1) + 1;

  // Count total existing weeks to calculate start dates
  const totalExistingWeeks = plan.blocks.reduce(
    (sum, b) => sum + b.weeks.length,
    0
  );
  const planStartMonday = getMonday(plan.startDate);

  // Create block with weeks and rest workouts in a transaction
  const block = await prisma.$transaction(async (tx) => {
    const newBlock = await tx.block.create({
      data: {
        planId,
        name,
        description: description || "",
        orderIndex,
      },
    });

    for (let w = 0; w < weekCount; w++) {
      const weekOffset = totalExistingWeeks + w;
      const weekStart = new Date(planStartMonday);
      weekStart.setUTCDate(weekStart.getUTCDate() + weekOffset * 7);

      const week = await tx.week.create({
        data: {
          blockId: newBlock.id,
          weekNumber: weekOffset + 1,
          startDate: weekStart,
          isPopulated: true,
        },
      });

      // Create 7 Rest workouts (Mon-Sun)
      const workouts = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(weekStart);
        date.setUTCDate(date.getUTCDate() + d);
        workouts.push({
          weekId: week.id,
          date,
          title: "Rest",
          workoutType: "REST" as const,
          activity: "REST" as const,
          intensity: "LOW" as const,
          details: "Rest day",
          isPbRunning: false,
        });
      }
      await tx.workout.createMany({ data: workouts });
    }

    // Update plan endDate to the last Sunday of the last week
    const lastWeekStart = new Date(planStartMonday);
    lastWeekStart.setUTCDate(
      lastWeekStart.getUTCDate() + (totalExistingWeeks + weekCount - 1) * 7
    );
    const lastSunday = new Date(lastWeekStart);
    lastSunday.setUTCDate(lastSunday.getUTCDate() + 6);
    await tx.plan.update({
      where: { id: planId },
      data: { endDate: lastSunday },
    });

    return newBlock;
  });

  return apiSuccess(block, 201);
}
