"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface HealthEntry {
  description: string;
  bodyPart: string;
  severity: string;
  date: string;
  status: string;
}

export default function NewRunnerPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Basics
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");

  // Running Background
  const [yearsRunning, setYearsRunning] = useState("");
  const [currentWeeklyKm, setCurrentWeeklyKm] = useState("");
  const [recentRaces, setRecentRaces] = useState("");
  const [previousCoaching, setPreviousCoaching] = useState("");

  // Goal
  const [goalRace, setGoalRace] = useState("");
  const [goalRaceDate, setGoalRaceDate] = useState("");
  const [goalTime, setGoalTime] = useState("");
  const [goalPriority, setGoalPriority] = useState("");

  // Availability
  const [trainingDaysPerWeek, setTrainingDaysPerWeek] = useState("");
  const [preferredDays, setPreferredDays] = useState("");
  const [preferredTimeOfDay, setPreferredTimeOfDay] = useState("");
  const [maxSessionLengthMin, setMaxSessionLengthMin] = useState("");

  // Health
  const [chronicConditions, setChronicConditions] = useState("");
  const [medications, setMedications] = useState("");
  const [healthEntries, setHealthEntries] = useState<HealthEntry[]>([]);

  // Nutrition
  const [dietType, setDietType] = useState("");
  const [dietaryRestrictions, setDietaryRestrictions] = useState("");
  const [hydrationHabits, setHydrationHabits] = useState("");
  const [nutritionGeneralStrategy, setNutritionGeneralStrategy] = useState("");
  const [nutritionRaceDay, setNutritionRaceDay] = useState("");
  const [nutritionSupplements, setNutritionSupplements] = useState("");

  // Equipment
  const [hasHrMonitor, setHasHrMonitor] = useState(false);
  const [hasGymAccess, setHasGymAccess] = useState(false);
  const [hasTrackAccess, setHasTrackAccess] = useState(false);
  const [otherNotes, setOtherNotes] = useState("");

  function addHealthEntry() {
    setHealthEntries([
      ...healthEntries,
      {
        description: "",
        bodyPart: "",
        severity: "MINOR",
        date: new Date().toISOString().split("T")[0],
        status: "ACTIVE",
      },
    ]);
  }

  function updateHealthEntry(
    index: number,
    field: keyof HealthEntry,
    value: string
  ) {
    const updated = [...healthEntries];
    updated[index] = { ...updated[index], [field]: value };
    setHealthEntries(updated);
  }

  function removeHealthEntry(index: number) {
    setHealthEntries(healthEntries.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/runners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          phone,
          age,
          gender,
          yearsRunning,
          currentWeeklyKm,
          recentRaces,
          previousCoaching,
          goalRace,
          goalRaceDate,
          goalTime,
          goalPriority: goalPriority || undefined,
          trainingDaysPerWeek,
          preferredDays,
          preferredTimeOfDay,
          maxSessionLengthMin,
          chronicConditions,
          medications,
          healthEntries: healthEntries.filter(
            (e) => e.description && e.bodyPart
          ),
          dietType,
          dietaryRestrictions,
          hydrationHabits,
          nutritionGeneralStrategy,
          nutritionRaceDay,
          nutritionSupplements,
          hasHrMonitor,
          hasGymAccess,
          hasTrackAccess,
          otherNotes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      router.push(`/coach/runners/${data.id}`);
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Add New Runner</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-md p-3">
            {error}
          </div>
        )}

        {/* Basics */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Basics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className={labelClass}>
                Name *
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="email" className={labelClass}>
                Email *
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="password" className={labelClass}>
                Password *
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="At least 8 characters"
              />
            </div>
            <div>
              <label htmlFor="phone" className={labelClass}>
                Phone
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="age" className={labelClass}>
                Age
              </label>
              <input
                id="age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="gender" className={labelClass}>
                Gender
              </label>
              <select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className={inputClass}
              >
                <option value="">Select...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </section>

        {/* Running Background */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Running Background</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="yearsRunning" className={labelClass}>
                Years Running
              </label>
              <input
                id="yearsRunning"
                type="number"
                value={yearsRunning}
                onChange={(e) => setYearsRunning(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="currentWeeklyKm" className={labelClass}>
                Current Weekly Km
              </label>
              <input
                id="currentWeeklyKm"
                type="number"
                step="0.1"
                value={currentWeeklyKm}
                onChange={(e) => setCurrentWeeklyKm(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="col-span-2">
              <label htmlFor="recentRaces" className={labelClass}>
                Recent Races
              </label>
              <textarea
                id="recentRaces"
                value={recentRaces}
                onChange={(e) => setRecentRaces(e.target.value)}
                className={inputClass}
                rows={2}
              />
            </div>
            <div className="col-span-2">
              <label htmlFor="previousCoaching" className={labelClass}>
                Previous Coaching
              </label>
              <textarea
                id="previousCoaching"
                value={previousCoaching}
                onChange={(e) => setPreviousCoaching(e.target.value)}
                className={inputClass}
                rows={2}
              />
            </div>
          </div>
        </section>

        {/* Goal */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Goal</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="goalRace" className={labelClass}>
                Goal Race
              </label>
              <input
                id="goalRace"
                type="text"
                value={goalRace}
                onChange={(e) => setGoalRace(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="goalRaceDate" className={labelClass}>
                Goal Race Date
              </label>
              <input
                id="goalRaceDate"
                type="date"
                value={goalRaceDate}
                onChange={(e) => setGoalRaceDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="goalTime" className={labelClass}>
                Goal Time
              </label>
              <input
                id="goalTime"
                type="text"
                value={goalTime}
                onChange={(e) => setGoalTime(e.target.value)}
                className={inputClass}
                placeholder="e.g. 3:30:00"
              />
            </div>
            <div>
              <label htmlFor="goalPriority" className={labelClass}>
                Goal Priority
              </label>
              <select
                id="goalPriority"
                value={goalPriority}
                onChange={(e) => setGoalPriority(e.target.value)}
                className={inputClass}
              >
                <option value="">Select...</option>
                <option value="FINISH">Finish</option>
                <option value="TIME_GOAL">Time Goal</option>
                <option value="ENJOY">Enjoy</option>
              </select>
            </div>
          </div>
        </section>

        {/* Availability */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Availability</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="trainingDaysPerWeek" className={labelClass}>
                Training Days Per Week
              </label>
              <input
                id="trainingDaysPerWeek"
                type="number"
                min="1"
                max="7"
                value={trainingDaysPerWeek}
                onChange={(e) => setTrainingDaysPerWeek(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="maxSessionLengthMin" className={labelClass}>
                Max Session Length (min)
              </label>
              <input
                id="maxSessionLengthMin"
                type="number"
                value={maxSessionLengthMin}
                onChange={(e) => setMaxSessionLengthMin(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="preferredDays" className={labelClass}>
                Preferred Days
              </label>
              <input
                id="preferredDays"
                type="text"
                value={preferredDays}
                onChange={(e) => setPreferredDays(e.target.value)}
                className={inputClass}
                placeholder="e.g. Mon, Wed, Fri, Sat"
              />
            </div>
            <div>
              <label htmlFor="preferredTimeOfDay" className={labelClass}>
                Preferred Time of Day
              </label>
              <input
                id="preferredTimeOfDay"
                type="text"
                value={preferredTimeOfDay}
                onChange={(e) => setPreferredTimeOfDay(e.target.value)}
                className={inputClass}
                placeholder="e.g. Morning, Evening"
              />
            </div>
          </div>
        </section>

        {/* Health */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Health</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="col-span-2">
              <label htmlFor="chronicConditions" className={labelClass}>
                Chronic Conditions
              </label>
              <textarea
                id="chronicConditions"
                value={chronicConditions}
                onChange={(e) => setChronicConditions(e.target.value)}
                className={inputClass}
                rows={2}
              />
            </div>
            <div className="col-span-2">
              <label htmlFor="medications" className={labelClass}>
                Medications
              </label>
              <textarea
                id="medications"
                value={medications}
                onChange={(e) => setMedications(e.target.value)}
                className={inputClass}
                rows={2}
              />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">
                Current Health Issues
              </h3>
              <button
                type="button"
                onClick={addHealthEntry}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + Add Entry
              </button>
            </div>
            {healthEntries.map((entry, i) => (
              <div
                key={i}
                className="grid grid-cols-5 gap-2 mb-2 items-end"
              >
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={entry.description}
                    onChange={(e) =>
                      updateHealthEntry(i, "description", e.target.value)
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Body Part
                  </label>
                  <input
                    type="text"
                    value={entry.bodyPart}
                    onChange={(e) =>
                      updateHealthEntry(i, "bodyPart", e.target.value)
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Severity
                  </label>
                  <select
                    value={entry.severity}
                    onChange={(e) =>
                      updateHealthEntry(i, "severity", e.target.value)
                    }
                    className={inputClass}
                  >
                    <option value="MINOR">Minor</option>
                    <option value="MODERATE">Moderate</option>
                    <option value="SEVERE">Severe</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={entry.date}
                    onChange={(e) =>
                      updateHealthEntry(i, "date", e.target.value)
                    }
                    className={inputClass}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeHealthEntry(i)}
                  className="text-red-500 hover:text-red-700 text-sm py-2"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Nutrition */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Nutrition</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="dietType" className={labelClass}>
                Diet Type
              </label>
              <input
                id="dietType"
                type="text"
                value={dietType}
                onChange={(e) => setDietType(e.target.value)}
                className={inputClass}
                placeholder="e.g. Omnivore, Vegetarian"
              />
            </div>
            <div>
              <label htmlFor="dietaryRestrictions" className={labelClass}>
                Dietary Restrictions
              </label>
              <input
                id="dietaryRestrictions"
                type="text"
                value={dietaryRestrictions}
                onChange={(e) => setDietaryRestrictions(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="col-span-2">
              <label htmlFor="hydrationHabits" className={labelClass}>
                Hydration Habits
              </label>
              <textarea
                id="hydrationHabits"
                value={hydrationHabits}
                onChange={(e) => setHydrationHabits(e.target.value)}
                className={inputClass}
                rows={2}
              />
            </div>
            <div className="col-span-2">
              <label htmlFor="nutritionGeneralStrategy" className={labelClass}>
                General Strategy
              </label>
              <textarea
                id="nutritionGeneralStrategy"
                value={nutritionGeneralStrategy}
                onChange={(e) => setNutritionGeneralStrategy(e.target.value)}
                className={inputClass}
                rows={2}
              />
            </div>
            <div className="col-span-2">
              <label htmlFor="nutritionRaceDay" className={labelClass}>
                Race Day Nutrition
              </label>
              <textarea
                id="nutritionRaceDay"
                value={nutritionRaceDay}
                onChange={(e) => setNutritionRaceDay(e.target.value)}
                className={inputClass}
                rows={2}
              />
            </div>
            <div className="col-span-2">
              <label htmlFor="nutritionSupplements" className={labelClass}>
                Supplements
              </label>
              <textarea
                id="nutritionSupplements"
                value={nutritionSupplements}
                onChange={(e) => setNutritionSupplements(e.target.value)}
                className={inputClass}
                rows={2}
              />
            </div>
          </div>
        </section>

        {/* Equipment */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Equipment</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={hasHrMonitor}
                onChange={(e) => setHasHrMonitor(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">HR Monitor</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={hasGymAccess}
                onChange={(e) => setHasGymAccess(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Gym Access</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={hasTrackAccess}
                onChange={(e) => setHasTrackAccess(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Track Access</span>
            </label>
            <div className="mt-4">
              <label htmlFor="otherNotes" className={labelClass}>
                Other Notes
              </label>
              <textarea
                id="otherNotes"
                value={otherNotes}
                onChange={(e) => setOtherNotes(e.target.value)}
                className={inputClass}
                rows={3}
              />
            </div>
          </div>
        </section>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white rounded-md px-6 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Create Runner"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/coach")}
            className="border border-gray-300 text-gray-700 rounded-md px-6 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
