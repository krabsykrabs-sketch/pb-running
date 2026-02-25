import { prisma } from "@/lib/prisma";
import {
  requireCoach,
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

  const profile = await prisma.runnerProfile.findUnique({
    where: { userId: id },
  });

  if (!profile) return apiError("Profile not found", 404);
  return apiSuccess(profile);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await requireCoach();
  if (isErrorResponse(authResult)) return authResult.error;

  const body = await request.json();

  const profile = await prisma.runnerProfile.update({
    where: { userId: id },
    data: {
      ...(body.phone !== undefined && { phone: body.phone || null }),
      ...(body.age !== undefined && { age: body.age ? parseInt(body.age) : null }),
      ...(body.gender !== undefined && { gender: body.gender || null }),
      ...(body.yearsRunning !== undefined && {
        yearsRunning: body.yearsRunning ? parseInt(body.yearsRunning) : null,
      }),
      ...(body.currentWeeklyKm !== undefined && {
        currentWeeklyKm: body.currentWeeklyKm || null,
      }),
      ...(body.recentRaces !== undefined && {
        recentRaces: body.recentRaces || null,
      }),
      ...(body.previousCoaching !== undefined && {
        previousCoaching: body.previousCoaching || null,
      }),
      ...(body.goalRace !== undefined && { goalRace: body.goalRace || null }),
      ...(body.goalRaceDate !== undefined && {
        goalRaceDate: body.goalRaceDate ? new Date(body.goalRaceDate) : null,
      }),
      ...(body.goalTime !== undefined && { goalTime: body.goalTime || null }),
      ...(body.goalPriority !== undefined && {
        goalPriority: body.goalPriority || null,
      }),
      ...(body.trainingDaysPerWeek !== undefined && {
        trainingDaysPerWeek: body.trainingDaysPerWeek
          ? parseInt(body.trainingDaysPerWeek)
          : null,
      }),
      ...(body.preferredDays !== undefined && {
        preferredDays: body.preferredDays || null,
      }),
      ...(body.preferredTimeOfDay !== undefined && {
        preferredTimeOfDay: body.preferredTimeOfDay || null,
      }),
      ...(body.maxSessionLengthMin !== undefined && {
        maxSessionLengthMin: body.maxSessionLengthMin
          ? parseInt(body.maxSessionLengthMin)
          : null,
      }),
      ...(body.chronicConditions !== undefined && {
        chronicConditions: body.chronicConditions || null,
      }),
      ...(body.medications !== undefined && {
        medications: body.medications || null,
      }),
      ...(body.dietType !== undefined && { dietType: body.dietType || null }),
      ...(body.dietaryRestrictions !== undefined && {
        dietaryRestrictions: body.dietaryRestrictions || null,
      }),
      ...(body.hydrationHabits !== undefined && {
        hydrationHabits: body.hydrationHabits || null,
      }),
      ...(body.hasHrMonitor !== undefined && { hasHrMonitor: body.hasHrMonitor }),
      ...(body.hasGymAccess !== undefined && { hasGymAccess: body.hasGymAccess }),
      ...(body.hasTrackAccess !== undefined && {
        hasTrackAccess: body.hasTrackAccess,
      }),
      ...(body.otherNotes !== undefined && {
        otherNotes: body.otherNotes || null,
      }),
      ...(body.reviewIntervalDays !== undefined && {
        reviewIntervalDays: parseInt(body.reviewIntervalDays),
      }),
    },
  });

  return apiSuccess(profile);
}
