import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function d(dateStr: string): Date {
  return new Date(dateStr + "T00:00:00.000Z");
}

function addDays(dateStr: string, days: number): string {
  const dt = new Date(dateStr + "T00:00:00.000Z");
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().split("T")[0];
}

async function main() {
  const coach = await prisma.user.findFirst({ where: { role: "COACH" } });
  if (!coach) throw new Error("No coach found. Run npm run seed first.");

  // ── Create runner ──
  const passwordHash = await bcrypt.hash("runner123", 12);
  const runner = await prisma.user.upsert({
    where: { email: "sarah@example.com" },
    update: {},
    create: {
      email: "sarah@example.com",
      passwordHash,
      name: "Sarah Mitchell",
      role: "RUNNER",
      createdAt: d("2026-01-20"),
    },
  });
  console.log(`Runner: ${runner.name} (${runner.id})`);

  // ── Profile ──
  await prisma.runnerProfile.upsert({
    where: { userId: runner.id },
    update: {},
    create: {
      userId: runner.id,
      age: 32,
      gender: "Female",
      phone: "+31 6 1234 5678",
      yearsRunning: 4,
      currentWeeklyKm: 30,
      recentRaces:
        "Amsterdam Half 2025 - 1:52:14\nRotterdam 10K 2025 - 48:33",
      goalRace: "Rotterdam Half Marathon",
      goalRaceDate: d("2026-04-05"),
      goalTime: "1:45:00",
      goalPriority: "TIME_GOAL",
      trainingDaysPerWeek: 5,
      preferredDays: "Mon, Tue, Thu, Sat, Sun",
      preferredTimeOfDay: "Morning (6:30-8:00)",
      maxSessionLengthMin: 90,
      chronicConditions: "Mild runner's knee (managed with exercises)",
      medications: null,
      dietType: "Mostly plant-based",
      dietaryRestrictions: "Lactose intolerant",
      hydrationHabits:
        "Aims for 2.5L/day, electrolyte tabs on runs > 15km",
      previousCoaching: "Self-coached for 3 years, followed Garmin plans",
      hasHrMonitor: true,
      hasGymAccess: true,
      hasTrackAccess: false,
      otherNotes: "Works from home 3 days/week, prefers morning training",
      reviewIntervalDays: 10,
    },
  });

  // ── Nutrition Plan ──
  await prisma.nutritionPlan.upsert({
    where: { runnerId: runner.id },
    update: {},
    create: {
      runnerId: runner.id,
      generalStrategy:
        "Focus on whole foods, adequate protein (1.4-1.6g/kg). Pre-run: banana + peanut butter toast 90min before. Post-run: protein smoothie within 30min. Increase carb intake to 6g/kg on long run days.",
      raceDay:
        "Race morning: Overnight oats with banana (3h before). 30min before: energy gel + water. During race: gel at 8km and 16km with water at every station. Post-race: recovery shake, then proper meal within 2h.",
      supplements:
        "Vitamin D3 (2000 IU daily), Iron (every other day with vitamin C), Magnesium citrate before bed on hard training days.",
    },
  });

  // ── Personal Bests ──
  await prisma.personalBest.deleteMany({ where: { runnerId: runner.id } });
  const pbData = [
    { distance: "5K", time: "23:12", raceName: "Vondelpark 5K", date: d("2025-06-15") },
    { distance: "10K", time: "48:33", raceName: "Rotterdam 10K", date: d("2025-09-21") },
    { distance: "Half Marathon", time: "1:52:14", raceName: "Amsterdam Half Marathon", date: d("2025-10-19") },
    { distance: "Parkrun", time: "24:01", raceName: "Zuiderpark parkrun", date: d("2025-11-08") },
  ];
  for (const pb of pbData) {
    await prisma.personalBest.create({ data: { runnerId: runner.id, ...pb } });
  }

  // ── Goals ──
  await prisma.goal.deleteMany({ where: { runnerId: runner.id } });
  await prisma.goal.createMany({
    data: [
      { runnerId: runner.id, description: "Run Rotterdam Half Marathon in under 1:45:00", targetDate: d("2026-04-05"), status: "ACTIVE" },
      { runnerId: runner.id, description: "Break 22:30 in a 5K", targetDate: d("2026-06-01"), status: "ACTIVE" },
      { runnerId: runner.id, description: "Complete base building block consistently", targetDate: d("2026-02-22"), status: "ACHIEVED" },
    ],
  });

  // ── Health Logs ──
  await prisma.healthLog.deleteMany({ where: { runnerId: runner.id } });
  await prisma.healthLog.createMany({
    data: [
      {
        runnerId: runner.id, authorId: runner.id, date: d("2026-02-10"),
        description: "Tightness in left calf after long run. Started foam rolling.",
        bodyPart: "Left calf", severity: "MINOR", status: "RESOLVED",
      },
      {
        runnerId: runner.id, authorId: coach.id, date: d("2026-02-20"),
        description: "Right knee discomfort reported during tempo run. Reduce intensity this week, extra glute strengthening exercises prescribed.",
        bodyPart: "Right knee", severity: "MODERATE", status: "ACTIVE",
      },
    ],
  });

  // ── Review ──
  await prisma.runnerReview.deleteMany({ where: { runnerId: runner.id } });
  await prisma.runnerReview.create({
    data: {
      runnerId: runner.id,
      notes: "Good base phase compliance. Progressing well toward half marathon goal. Watch the knee — adjusted build phase to reduce tempo volume. Long runs are on track, need to practice race nutrition.",
      reviewedAt: d("2026-02-17"),
    },
  });

  // ── Availability (upcoming unavailable dates) ──
  await prisma.runnerAvailability.deleteMany({ where: { runnerId: runner.id } });
  await prisma.runnerAvailability.createMany({
    data: [
      { runnerId: runner.id, date: d("2026-03-07"), note: "Work conference in Berlin" },
      { runnerId: runner.id, date: d("2026-03-08"), note: "Work conference in Berlin" },
      { runnerId: runner.id, date: d("2026-03-21"), note: "Family birthday" },
    ],
  });

  // ── Training Plan ──
  await prisma.plan.deleteMany({ where: { runnerId: runner.id } });

  const plan = await prisma.plan.create({
    data: {
      runnerId: runner.id,
      name: "Rotterdam Half Marathon 2026",
      goal: "Sub-1:45 Half Marathon",
      raceDate: d("2026-04-05"),
      startDate: d("2026-01-26"),
      endDate: d("2026-04-05"),
      status: "ACTIVE",
    },
  });

  // 3 blocks
  const block1 = await prisma.block.create({
    data: { planId: plan.id, name: "Base Building", orderIndex: 0, description: "Build aerobic base with easy mileage, gradual volume increase. Focus on consistency and form." },
  });
  const block2 = await prisma.block.create({
    data: { planId: plan.id, name: "Build Phase", orderIndex: 1, description: "Introduce tempo and interval work. Increase long run distance toward race distance." },
  });
  const block3 = await prisma.block.create({
    data: { planId: plan.id, name: "Peak & Taper", orderIndex: 2, description: "Peak week followed by 2-week taper. Sharpen with race-pace work, then reduce volume for freshness." },
  });

  // Weeks
  const weekDefs = [
    { blockId: block1.id, weekNumber: 1, startDate: "2026-01-26", targetKm: 25, weekIntensity: "Low (25)", pacesFocus: "Easy pace: 5:40-6:00/km", description: "Introduction week", coachWeekNote: null },
    { blockId: block1.id, weekNumber: 2, startDate: "2026-02-02", targetKm: 28, weekIntensity: "Low (28)", pacesFocus: "Easy pace: 5:40-6:00/km", description: "Slight volume increase", coachWeekNote: null },
    { blockId: block1.id, weekNumber: 3, startDate: "2026-02-09", targetKm: 32, weekIntensity: "Low-Moderate (32)", pacesFocus: "Easy: 5:40-6:00, Long: 5:50-6:10", description: "Building endurance, first longer long run", coachWeekNote: "Good progress. Calf tightness on Monday — watch it." },
    { blockId: block1.id, weekNumber: 4, startDate: "2026-02-16", targetKm: 30, weekIntensity: "Low (30)", pacesFocus: "Easy: 5:35-5:55", description: "Recovery week", coachWeekNote: "Nice work completing the base block. Ready for build phase." },
    { blockId: block2.id, weekNumber: 5, startDate: "2026-02-23", targetKm: 35, weekIntensity: "Moderate (35)", pacesFocus: "Easy: 5:35-5:55, Tempo: 5:00-5:10", description: "First tempo session introduced", coachWeekNote: "Knee issue noted Tuesday. Swapped Thursday tempo for easy run." },
    { blockId: block2.id, weekNumber: 6, startDate: "2026-03-02", targetKm: 38, weekIntensity: "Moderate-High (38)", pacesFocus: "Easy: 5:30-5:50, Tempo: 4:58-5:08, Interval: 4:40-4:50", description: "Add intervals. Long run with tempo finish.", coachWeekNote: null },
    { blockId: block2.id, weekNumber: 7, startDate: "2026-03-09", targetKm: 42, weekIntensity: "High (42)", pacesFocus: "Easy: 5:30-5:50, Tempo: 4:55-5:05, Race pace: 4:58", description: "Peak build week. Race-pace in long run.", coachWeekNote: null },
    { blockId: block3.id, weekNumber: 8, startDate: "2026-03-16", targetKm: 45, weekIntensity: "High (45)", pacesFocus: "Easy: 5:30-5:50, Tempo: 4:55-5:05, Race pace: 4:58", description: "Peak volume week. Final hard long run.", coachWeekNote: null },
    { blockId: block3.id, weekNumber: 9, startDate: "2026-03-23", targetKm: 32, weekIntensity: "Moderate (32)", pacesFocus: "Easy: 5:30-5:50, Race pace: 4:58", description: "Taper begins. Reduce volume, maintain intensity.", coachWeekNote: null },
    { blockId: block3.id, weekNumber: 10, startDate: "2026-03-30", targetKm: 25, weekIntensity: "Low (25)", pacesFocus: "Easy: 5:40-6:00, Race pace: 4:58", description: "Race week!", coachWeekNote: null },
  ];

  const weeks: { id: string; weekNumber: number; startDate: string }[] = [];
  for (const wd of weekDefs) {
    const week = await prisma.week.create({
      data: {
        blockId: wd.blockId,
        weekNumber: wd.weekNumber,
        startDate: d(wd.startDate),
        targetKm: wd.targetKm,
        weekIntensity: wd.weekIntensity,
        pacesFocus: wd.pacesFocus,
        description: wd.description,
        coachWeekNote: wd.coachWeekNote,
        isPopulated: true,
      },
    });
    weeks.push({ id: week.id, weekNumber: wd.weekNumber, startDate: wd.startDate });
  }

  function wId(n: number) { return weeks.find((w) => w.weekNumber === n)!.id; }
  function wStart(n: number) { return weeks.find((w) => w.weekNumber === n)!.startDate; }

  // ── Workouts ──
  type WO = {
    weekId: string; date: string; title: string; workoutType: string;
    activity: string; distanceKm?: number; targetPace?: string;
    durationMin?: number; intensity: string; details: string;
    coachNotes?: string; nutrition?: string;
  };

  const workouts: WO[] = [
    // ── WEEK 1 (Jan 26-Feb 1) ──
    { weekId: wId(1), date: addDays(wStart(1), 0), title: "Easy Run", workoutType: "EASY", activity: "RUN", distanceKm: 5, targetPace: "5:50/km", intensity: "LOW", details: "Gentle start to the plan. Stay relaxed, conversational pace." },
    { weekId: wId(1), date: addDays(wStart(1), 1), title: "S&C Session", workoutType: "SC", activity: "SC", durationMin: 45, intensity: "MODERATE", details: "Glute bridges 3x12, single-leg squats 3x8, calf raises 3x15, planks 3x45s, band walks 3x12." },
    { weekId: wId(1), date: addDays(wStart(1), 3), title: "Easy Run", workoutType: "EASY", activity: "RUN", distanceKm: 6, targetPace: "5:45/km", intensity: "LOW", details: "Flat route preferred. Focus on cadence ~170 spm." },
    { weekId: wId(1), date: addDays(wStart(1), 5), title: "Long Run", workoutType: "LONG", activity: "RUN", distanceKm: 10, targetPace: "5:55/km", intensity: "LOW", details: "First long run. Build into it gradually. Last 2km can be slightly quicker if feeling good.", nutrition: "Banana before, water during" },
    { weekId: wId(1), date: addDays(wStart(1), 6), title: "Recovery Walk", workoutType: "REST", activity: "REST", durationMin: 30, intensity: "LOW", details: "Active recovery or full rest. 30-min walk if feeling okay." },

    // ── WEEK 2 (Feb 2-8) ──
    { weekId: wId(2), date: addDays(wStart(2), 0), title: "Easy Run", workoutType: "EASY", activity: "RUN", distanceKm: 6, targetPace: "5:45/km", intensity: "LOW", details: "Monday easy. Shake off any weekend fatigue." },
    { weekId: wId(2), date: addDays(wStart(2), 1), title: "S&C Session", workoutType: "SC", activity: "SC", durationMin: 45, intensity: "MODERATE", details: "Same circuit as last week. Add Nordic hamstring curls 3x6." },
    { weekId: wId(2), date: addDays(wStart(2), 3), title: "Easy Run + Strides", workoutType: "EASY", activity: "RUN", distanceKm: 7, targetPace: "5:45/km", intensity: "LOW", details: "6km easy + 4x100m strides. Strides are relaxed, fast but not sprinting." },
    { weekId: wId(2), date: addDays(wStart(2), 5), title: "Long Run", workoutType: "LONG", activity: "RUN", distanceKm: 12, targetPace: "5:50/km", intensity: "LOW", details: "Steady throughout. Practice drinking water at ~6km.", nutrition: "Toast + PB before. Water at halfway." },
    { weekId: wId(2), date: addDays(wStart(2), 6), title: "Cross-Training", workoutType: "CROSS_TRAINING", activity: "CYCLE", durationMin: 40, intensity: "LOW", details: "Easy spin on bike or indoor trainer. Keep heart rate below 140." },

    // ── WEEK 3 (Feb 9-15) — calf issue ──
    { weekId: wId(3), date: addDays(wStart(3), 0), title: "Easy Run", workoutType: "EASY", activity: "RUN", distanceKm: 6, targetPace: "5:45/km", intensity: "LOW", details: "Left calf reported tight — monitor closely. Extra warm-up." },
    { weekId: wId(3), date: addDays(wStart(3), 1), title: "S&C Session", workoutType: "SC", activity: "SC", durationMin: 50, intensity: "MODERATE", details: "Full circuit + extra calf work: eccentric calf drops 3x12 each side. Foam roll calves 5 min." },
    { weekId: wId(3), date: addDays(wStart(3), 3), title: "Easy Run + Strides", workoutType: "EASY", activity: "RUN", distanceKm: 7, targetPace: "5:40/km", intensity: "LOW", details: "6km easy + 5x100m strides. If calf feels off, skip strides." },
    { weekId: wId(3), date: addDays(wStart(3), 4), title: "Easy Shakeout", workoutType: "EASY", activity: "RUN", distanceKm: 5, targetPace: "5:50/km", intensity: "LOW", details: "Short easy shakeout." },
    { weekId: wId(3), date: addDays(wStart(3), 5), title: "Long Run", workoutType: "LONG", activity: "RUN", distanceKm: 14, targetPace: "5:50/km", intensity: "LOW", details: "Longest run so far. Stay patient in first half. Negative split the last 4km if you feel good.", nutrition: "Oats before. Gel at 10km." },

    // ── WEEK 4 (Feb 16-22) — recovery ──
    { weekId: wId(4), date: addDays(wStart(4), 0), title: "Easy Run", workoutType: "EASY", activity: "RUN", distanceKm: 5, targetPace: "5:50/km", intensity: "LOW", details: "Recovery week. Keep it very easy." },
    { weekId: wId(4), date: addDays(wStart(4), 1), title: "S&C + Mobility", workoutType: "SC", activity: "SC", durationMin: 40, intensity: "LOW", details: "Lighter session. Focus on mobility and activation. Yoga stretches welcome." },
    { weekId: wId(4), date: addDays(wStart(4), 3), title: "Easy Run", workoutType: "EASY", activity: "RUN", distanceKm: 6, targetPace: "5:45/km", intensity: "LOW", details: "Steady easy pace. Check in on how the body feels." },
    { weekId: wId(4), date: addDays(wStart(4), 5), title: "Long Run", workoutType: "LONG", activity: "RUN", distanceKm: 12, targetPace: "5:55/km", intensity: "LOW", details: "Reduced long run. Enjoy it — base phase done after this!" },
    { weekId: wId(4), date: addDays(wStart(4), 6), title: "Rest", workoutType: "REST", activity: "REST", durationMin: 0, intensity: "LOW", details: "Full rest day. Stretch and recover." },

    // ── WEEK 5 (Feb 23-Mar 1) — current week ──
    { weekId: wId(5), date: addDays(wStart(5), 0), title: "Easy Run", workoutType: "EASY", activity: "RUN", distanceKm: 6, targetPace: "5:40/km", intensity: "LOW", details: "Start of build phase. Easy opener." },
    { weekId: wId(5), date: addDays(wStart(5), 1), title: "Tempo Run", workoutType: "TEMPO", activity: "RUN", distanceKm: 8, targetPace: "5:05/km", intensity: "HIGH", details: "2km warm-up, 4km at tempo (5:00-5:10/km), 2km cool-down.", coachNotes: "Knee was sore — swapped to easy. See updated Thursday session." },
    { weekId: wId(5), date: addDays(wStart(5), 3), title: "Easy Run (Knee Adjustment)", workoutType: "EASY", activity: "RUN", distanceKm: 6, targetPace: "5:45/km", intensity: "LOW", details: "Replaced originally planned tempo. Take it easy due to knee. If pain-free, add 4x100m strides at end." },
    { weekId: wId(5), date: addDays(wStart(5), 5), title: "Long Run", workoutType: "LONG", activity: "RUN", distanceKm: 15, targetPace: "5:50/km", intensity: "MODERATE", details: "First 12km easy, last 3km at moderate effort (not tempo). Practice gel intake.", nutrition: "Oats 2.5h before. Gel at 8km and 12km." },
    { weekId: wId(5), date: addDays(wStart(5), 6), title: "S&C + Mobility", workoutType: "SC", activity: "SC", durationMin: 50, intensity: "MODERATE", details: "Glute and hip strengthening focus. Extra knee stability work." },

    // ── WEEK 6 (Mar 2-8) — future ──
    { weekId: wId(6), date: addDays(wStart(6), 0), title: "Easy Run", workoutType: "EASY", activity: "RUN", distanceKm: 7, targetPace: "5:35/km", intensity: "LOW", details: "Easy start to the week." },
    { weekId: wId(6), date: addDays(wStart(6), 1), title: "Intervals", workoutType: "INTERVAL", activity: "RUN", distanceKm: 9, targetPace: "4:45/km", intensity: "HIGH", details: "2km warm-up, 5x800m @ 4:40-4:50 with 90s recovery jog, 2km cool-down." },
    { weekId: wId(6), date: addDays(wStart(6), 3), title: "Easy Run", workoutType: "EASY", activity: "RUN", distanceKm: 6, targetPace: "5:40/km", intensity: "LOW", details: "Recovery from intervals." },
    { weekId: wId(6), date: addDays(wStart(6), 4), title: "S&C Session", workoutType: "SC", activity: "SC", durationMin: 45, intensity: "MODERATE", details: "Full lower body circuit with hip and glute focus." },
    { weekId: wId(6), date: addDays(wStart(6), 5), title: "Long Run + Tempo Finish", workoutType: "LONG", activity: "RUN", distanceKm: 16, targetPace: "5:45/km", intensity: "MODERATE", details: "13km easy, last 3km at tempo (5:00-5:10). Practice race nutrition.", nutrition: "Full race morning routine." },

    // ── WEEK 7 (Mar 9-15) ──
    { weekId: wId(7), date: addDays(wStart(7), 0), title: "Easy Run", workoutType: "EASY", activity: "RUN", distanceKm: 7, targetPace: "5:35/km", intensity: "LOW", details: "Monday easy." },
    { weekId: wId(7), date: addDays(wStart(7), 1), title: "Tempo Run", workoutType: "TEMPO", activity: "RUN", distanceKm: 10, targetPace: "5:00/km", intensity: "HIGH", details: "2km warm-up, 6km at tempo (4:55-5:05), 2km cool-down." },
    { weekId: wId(7), date: addDays(wStart(7), 3), title: "Easy Run + Strides", workoutType: "EASY", activity: "RUN", distanceKm: 7, targetPace: "5:40/km", intensity: "LOW", details: "6km easy + 6x100m strides." },
    { weekId: wId(7), date: addDays(wStart(7), 4), title: "S&C Session", workoutType: "SC", activity: "SC", durationMin: 45, intensity: "MODERATE", details: "Last hard S&C week before taper." },
    { weekId: wId(7), date: addDays(wStart(7), 5), title: "Long Run + Race Pace", workoutType: "LONG", activity: "RUN", distanceKm: 18, targetPace: "5:40/km", intensity: "MODERATE", details: "12km easy, 4km at race pace (4:58/km), 2km cool-down. Key session.", nutrition: "Full race nutrition rehearsal." },

    // ── WEEK 8 (Mar 16-22) — peak ──
    { weekId: wId(8), date: addDays(wStart(8), 0), title: "Easy Run", workoutType: "EASY", activity: "RUN", distanceKm: 7, targetPace: "5:35/km", intensity: "LOW", details: "Start of peak week." },
    { weekId: wId(8), date: addDays(wStart(8), 1), title: "Intervals", workoutType: "INTERVAL", activity: "RUN", distanceKm: 10, targetPace: "4:45/km", intensity: "HIGH", details: "2km warm-up, 4x1000m @ 4:40-4:50 with 2min recovery, 2km cool-down." },
    { weekId: wId(8), date: addDays(wStart(8), 2), title: "Easy Recovery Run", workoutType: "EASY", activity: "RUN", distanceKm: 6, targetPace: "5:45/km", intensity: "LOW", details: "Easy recovery." },
    { weekId: wId(8), date: addDays(wStart(8), 3), title: "Tempo Run", workoutType: "TEMPO", activity: "RUN", distanceKm: 8, targetPace: "5:00/km", intensity: "HIGH", details: "2km warm-up, 4km tempo, 2km cool-down." },
    { weekId: wId(8), date: addDays(wStart(8), 5), title: "Long Run (Final)", workoutType: "LONG", activity: "RUN", distanceKm: 20, targetPace: "5:45/km", intensity: "MODERATE", details: "Final long run! 15km easy, 3km race pace, 2km easy. Most important session.", nutrition: "Full race nutrition. Gels at 8km, 14km." },

    // ── WEEK 9 (Mar 23-29) — taper ──
    { weekId: wId(9), date: addDays(wStart(9), 0), title: "Easy Run", workoutType: "EASY", activity: "RUN", distanceKm: 6, targetPace: "5:40/km", intensity: "LOW", details: "Taper week 1. Fresh legs incoming." },
    { weekId: wId(9), date: addDays(wStart(9), 1), title: "Race Pace Sharpener", workoutType: "RACE_PACE", activity: "RUN", distanceKm: 8, targetPace: "4:58/km", intensity: "MODERATE", details: "2km warm-up, 3x1km at race pace with 90s jog recovery, 2km cool-down." },
    { weekId: wId(9), date: addDays(wStart(9), 3), title: "Easy Run", workoutType: "EASY", activity: "RUN", distanceKm: 5, targetPace: "5:45/km", intensity: "LOW", details: "Short and easy." },
    { weekId: wId(9), date: addDays(wStart(9), 5), title: "Long Run", workoutType: "LONG", activity: "RUN", distanceKm: 12, targetPace: "5:50/km", intensity: "LOW", details: "Final long-ish run. All easy. No heroics." },
    { weekId: wId(9), date: addDays(wStart(9), 6), title: "Rest", workoutType: "REST", activity: "REST", durationMin: 0, intensity: "LOW", details: "Full rest." },

    // ── WEEK 10 (Mar 30-Apr 5) — race week ──
    { weekId: wId(10), date: addDays(wStart(10), 0), title: "Easy Shake-out", workoutType: "EASY", activity: "RUN", distanceKm: 4, targetPace: "5:50/km", intensity: "LOW", details: "Monday easy. 4km to stay loose." },
    { weekId: wId(10), date: addDays(wStart(10), 2), title: "Shake-out + Strides", workoutType: "EASY", activity: "RUN", distanceKm: 3, targetPace: "5:45/km", intensity: "LOW", details: "2km easy + 3x100m strides. Last workout before race." },
    { weekId: wId(10), date: addDays(wStart(10), 4), title: "Rest", workoutType: "REST", activity: "REST", durationMin: 0, intensity: "LOW", details: "Full rest. Prepare race kit and nutrition." },
    { weekId: wId(10), date: addDays(wStart(10), 5), title: "Pre-Race Shake-out", workoutType: "EASY", activity: "RUN", distanceKm: 2, targetPace: "5:50/km", intensity: "LOW", details: "Optional 2km jog. Only if it helps you feel better." },
    { weekId: wId(10), date: addDays(wStart(10), 6), title: "RACE: Rotterdam Half Marathon", workoutType: "RACE", activity: "RUN", distanceKm: 21.1, targetPace: "4:58/km", intensity: "HIGH", details: "Race day! Goal: sub-1:45. Start conservative (5:02-5:05 first 5km), build to race pace, push last 5km. Trust the training!", nutrition: "Oats 3h before, gel 30min before, gels at 8km and 16km." },
  ];

  // Create all workouts
  const created: { id: string; date: string; wn: number; title: string }[] = [];
  for (const wo of workouts) {
    const wn = weeks.find((w) => w.id === wo.weekId)!.weekNumber;
    const rec = await prisma.workout.create({
      data: {
        weekId: wo.weekId,
        date: d(wo.date),
        title: wo.title,
        workoutType: wo.workoutType as never,
        activity: wo.activity as never,
        distanceKm: wo.distanceKm ?? null,
        targetPace: wo.targetPace ?? null,
        durationMin: wo.durationMin ?? null,
        intensity: wo.intensity as never,
        details: wo.details,
        coachNotes: wo.coachNotes ?? null,
        nutrition: wo.nutrition ?? null,
      },
    });
    created.push({ id: rec.id, date: wo.date, wn, title: wo.title });
  }

  // ── Workout Logs (past workouts up to today Feb 27) ──
  await prisma.workoutLog.deleteMany({ where: { runnerId: runner.id } });

  type LogInput = {
    completed: boolean; actualDistanceKm?: number; actualPace?: string;
    actualDurationMin?: number; avgHeartRate?: number; rpe?: number; runnerNotes?: string;
  };

  const logs: Record<string, LogInput> = {};
  function log(dateStr: string, data: LogInput) {
    const wo = created.find((w) => w.date === dateStr);
    if (wo) logs[wo.id] = data;
  }

  // Week 1 — all completed
  log("2026-01-26", { completed: true, actualDistanceKm: 5.1, actualPace: "5:52/km", actualDurationMin: 30, avgHeartRate: 142, rpe: 3, runnerNotes: "Felt great! Excited to start the plan." });
  log("2026-01-27", { completed: true, actualDurationMin: 42, rpe: 5, runnerNotes: "Good session. Glute bridges harder than expected." });
  log("2026-01-29", { completed: true, actualDistanceKm: 6.2, actualPace: "5:48/km", actualDurationMin: 36, avgHeartRate: 144, rpe: 3, runnerNotes: "Nice and easy along the canal." });
  log("2026-01-31", { completed: true, actualDistanceKm: 10.2, actualPace: "5:58/km", actualDurationMin: 61, avgHeartRate: 148, rpe: 4, runnerNotes: "First long run went well. Felt comfortable throughout." });
  log("2026-02-01", { completed: true, actualDurationMin: 25, rpe: 2, runnerNotes: "Easy walk in the park." });

  // Week 2 — all completed
  log("2026-02-02", { completed: true, actualDistanceKm: 6.0, actualPace: "5:44/km", actualDurationMin: 34, avgHeartRate: 143, rpe: 3, runnerNotes: "Legs felt fresh after rest day." });
  log("2026-02-03", { completed: true, actualDurationMin: 48, rpe: 5, runnerNotes: "Added Nordic curls. Wow those are tough!" });
  log("2026-02-05", { completed: true, actualDistanceKm: 7.1, actualPace: "5:43/km", actualDurationMin: 41, avgHeartRate: 146, rpe: 4, runnerNotes: "Strides felt amazing. Getting faster!" });
  log("2026-02-07", { completed: true, actualDistanceKm: 12.3, actualPace: "5:53/km", actualDurationMin: 72, avgHeartRate: 150, rpe: 5, runnerNotes: "Practiced drinking at 6km. Good long run." });
  log("2026-02-08", { completed: true, actualDurationMin: 35, avgHeartRate: 118, rpe: 2, runnerNotes: "Easy spin on the trainer. Good recovery." });

  // Week 3 — calf tightness, one run cut short
  log("2026-02-09", { completed: true, actualDistanceKm: 5.5, actualPace: "5:51/km", actualDurationMin: 32, avgHeartRate: 144, rpe: 4, runnerNotes: "Left calf felt tight from km 3. Cut it a bit short." });
  log("2026-02-10", { completed: true, actualDurationMin: 55, rpe: 5, runnerNotes: "Extra calf work as prescribed. Foam rolling helped." });
  log("2026-02-12", { completed: true, actualDistanceKm: 6.8, actualPace: "5:42/km", actualDurationMin: 39, avgHeartRate: 145, rpe: 3, runnerNotes: "Calf feeling better. Did the strides, no issues." });
  log("2026-02-13", { completed: true, actualDistanceKm: 5.0, actualPace: "5:53/km", actualDurationMin: 29, avgHeartRate: 140, rpe: 2, runnerNotes: "Easy shakeout. Body feeling good." });
  log("2026-02-14", { completed: true, actualDistanceKm: 14.1, actualPace: "5:48/km", actualDurationMin: 82, avgHeartRate: 152, rpe: 6, runnerNotes: "Longest run ever! Negative split the last 4km. Felt strong. Gel worked well." });

  // Week 4 — recovery, all done
  log("2026-02-16", { completed: true, actualDistanceKm: 5.0, actualPace: "5:55/km", actualDurationMin: 30, avgHeartRate: 138, rpe: 2, runnerNotes: "Very easy. Recovery week vibes." });
  log("2026-02-17", { completed: true, actualDurationMin: 35, rpe: 3, runnerNotes: "Light session with yoga. Felt great." });
  log("2026-02-19", { completed: true, actualDistanceKm: 6.1, actualPace: "5:46/km", actualDurationMin: 35, avgHeartRate: 142, rpe: 3, runnerNotes: "Body feels recovered. Ready for build phase!" });
  log("2026-02-21", { completed: true, actualDistanceKm: 12.0, actualPace: "5:52/km", actualDurationMin: 70, avgHeartRate: 149, rpe: 4, runnerNotes: "Comfortable long run. Base phase done!" });
  log("2026-02-22", { completed: true, rpe: 1, runnerNotes: "Full rest. Stretched and watched Netflix." });

  // Week 5 — partial (up to Feb 27), one missed
  log("2026-02-23", { completed: true, actualDistanceKm: 6.1, actualPace: "5:42/km", actualDurationMin: 35, avgHeartRate: 143, rpe: 3, runnerNotes: "Good start to build phase." });
  log("2026-02-24", { completed: false, runnerNotes: "Knee felt off during warm-up. Stopped after 2km. Coach said rest it." });
  log("2026-02-26", { completed: true, actualDistanceKm: 5.8, actualPace: "5:48/km", actualDurationMin: 34, avgHeartRate: 141, rpe: 3, runnerNotes: "Easy as prescribed. Knee feels okay at easy pace. Did strides, no pain." });

  // Create all logs
  const logEntries: { logId: string; date: string }[] = [];
  for (const [workoutId, data] of Object.entries(logs)) {
    const wo = created.find((w) => w.id === workoutId)!;
    const entry = await prisma.workoutLog.create({
      data: {
        workoutId,
        runnerId: runner.id,
        completed: data.completed,
        actualDistanceKm: data.actualDistanceKm ?? null,
        actualPace: data.actualPace ?? null,
        actualDurationMin: data.actualDurationMin ?? null,
        avgHeartRate: data.avgHeartRate ?? null,
        rpe: data.rpe ?? null,
        runnerNotes: data.runnerNotes ?? null,
      },
    });
    logEntries.push({ logId: entry.id, date: wo.date });
  }

  // ── Coach Comments ──
  await prisma.comment.deleteMany({
    where: { workoutLog: { runnerId: runner.id } },
  });

  const commentData: { date: string; content: string; read: boolean }[] = [
    { date: "2026-01-31", content: "Great first long run Sarah! Pace was spot on. Keep this effort level for your long runs.", read: true },
    { date: "2026-02-09", content: "Smart to cut it short. Keep up the foam rolling and calf exercises. If it persists beyond this week, we'll adjust the plan.", read: true },
    { date: "2026-02-14", content: "14km and a negative split — brilliant! You're building great aerobic fitness. The gel strategy is working well too.", read: true },
    { date: "2026-02-24", content: "Good call stopping. I've swapped Thursday to an easy run. Let's see how the knee responds this week before adding intensity back.", read: true },
    { date: "2026-02-26", content: "Glad the knee held up at easy pace. If Saturday's long run goes well pain-free, we'll get back to the tempo work next week.", read: false },
  ];

  for (const c of commentData) {
    const entry = logEntries.find((l) => l.date === c.date);
    if (entry) {
      await prisma.comment.create({
        data: {
          workoutLogId: entry.logId,
          authorId: coach.id,
          content: c.content,
          read: c.read,
        },
      });
    }
  }

  console.log(`\nCreated full data for ${runner.name}:`);
  console.log(`  Plan: ${plan.name} (10 weeks, 3 blocks)`);
  console.log(`  Workouts: ${created.length}`);
  console.log(`  Workout logs: ${Object.keys(logs).length} (1 missed)`);
  console.log(`  Personal bests: ${pbData.length}`);
  console.log(`  Goals: 3 (2 active, 1 achieved)`);
  console.log(`  Health logs: 2 (1 resolved, 1 active)`);
  console.log(`  Coach comments: ${commentData.length} (1 unread)`);
  console.log(`  Availability conflicts: 3`);
  console.log(`  Reviews: 1`);
  console.log(`  Nutrition plan: complete`);
  console.log(`\nLogin: sarah@example.com / runner123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
