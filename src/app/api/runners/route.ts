import { prisma } from "@/lib/prisma";
import {
  requireCoach,
  isErrorResponse,
  apiSuccess,
  apiError,
} from "@/lib/api-utils";
import bcrypt from "bcryptjs";

export async function GET() {
  const authResult = await requireCoach();
  if (isErrorResponse(authResult)) return authResult.error;

  const runners = await prisma.user.findMany({
    where: { role: "RUNNER" },
    include: {
      profile: true,
      goals: { where: { status: "ACTIVE" } },
      healthLogsAsRunner: { where: { status: "ACTIVE" } },
      reviews: { orderBy: { reviewedAt: "desc" }, take: 1 },
    },
    orderBy: { name: "asc" },
  });

  return apiSuccess(runners);
}

export async function POST(request: Request) {
  const authResult = await requireCoach();
  if (isErrorResponse(authResult)) return authResult.error;

  const body = await request.json();

  const { name, email, password, phone, age, gender } = body;
  if (!name || !email || !password) {
    return apiError("Name, email, and password are required");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return apiError("Email already in use");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const runner = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: "RUNNER",
      },
    });

    await tx.runnerProfile.create({
      data: {
        userId: user.id,
        phone: phone || null,
        age: age ? parseInt(age) : null,
        gender: gender || null,
        yearsRunning: body.yearsRunning ? parseInt(body.yearsRunning) : null,
        currentWeeklyKm: body.currentWeeklyKm || null,
        recentRaces: body.recentRaces || null,
        previousCoaching: body.previousCoaching || null,
        goalRace: body.goalRace || null,
        goalRaceDate: body.goalRaceDate ? new Date(body.goalRaceDate) : null,
        goalTime: body.goalTime || null,
        goalPriority: body.goalPriority || null,
        trainingDaysPerWeek: body.trainingDaysPerWeek
          ? parseInt(body.trainingDaysPerWeek)
          : null,
        preferredDays: body.preferredDays || null,
        preferredTimeOfDay: body.preferredTimeOfDay || null,
        maxSessionLengthMin: body.maxSessionLengthMin
          ? parseInt(body.maxSessionLengthMin)
          : null,
        chronicConditions: body.chronicConditions || null,
        medications: body.medications || null,
        dietType: body.dietType || null,
        dietaryRestrictions: body.dietaryRestrictions || null,
        hydrationHabits: body.hydrationHabits || null,
        hasHrMonitor: body.hasHrMonitor || false,
        hasGymAccess: body.hasGymAccess || false,
        hasTrackAccess: body.hasTrackAccess || false,
        otherNotes: body.otherNotes || null,
      },
    });

    if (
      body.nutritionGeneralStrategy ||
      body.nutritionRaceDay ||
      body.nutritionSupplements
    ) {
      await tx.nutritionPlan.create({
        data: {
          runnerId: user.id,
          generalStrategy: body.nutritionGeneralStrategy || null,
          raceDay: body.nutritionRaceDay || null,
          supplements: body.nutritionSupplements || null,
        },
      });
    }

    if (body.healthEntries && Array.isArray(body.healthEntries)) {
      for (const entry of body.healthEntries) {
        if (entry.description && entry.bodyPart && entry.severity) {
          await tx.healthLog.create({
            data: {
              runnerId: user.id,
              authorId: authResult.user.id,
              date: entry.date ? new Date(entry.date) : new Date(),
              description: entry.description,
              bodyPart: entry.bodyPart,
              severity: entry.severity,
              status: entry.status || "ACTIVE",
            },
          });
        }
      }
    }

    return tx.user.findUnique({
      where: { id: user.id },
      include: { profile: true, nutritionPlan: true },
    });
  });

  return apiSuccess(runner, 201);
}
