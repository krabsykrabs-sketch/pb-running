// Enum display labels and color mappings for use across coach and runner UI

export const workoutTypeConfig: Record<
  string,
  { label: string; color: string; bgClass: string; borderClass: string }
> = {
  EASY: { label: "Easy", color: "var(--color-easy)", bgClass: "bg-green-100 text-green-800", borderClass: "border-l-green-500" },
  LONG: { label: "Long", color: "var(--color-long)", bgClass: "bg-blue-100 text-blue-800", borderClass: "border-l-blue-500" },
  TEMPO: { label: "Tempo", color: "var(--color-tempo)", bgClass: "bg-amber-100 text-amber-800", borderClass: "border-l-amber-500" },
  INTERVAL: { label: "Interval", color: "var(--color-interval)", bgClass: "bg-red-100 text-red-800", borderClass: "border-l-red-500" },
  RACE_PACE: { label: "Race Pace", color: "var(--color-race-pace)", bgClass: "bg-purple-100 text-purple-800", borderClass: "border-l-purple-500" },
  HR_TRAINING: { label: "HR Training", color: "var(--color-hr-training)", bgClass: "bg-pink-100 text-pink-800", borderClass: "border-l-pink-500" },
  SC: { label: "S&C", color: "var(--color-sc)", bgClass: "bg-teal-100 text-teal-800", borderClass: "border-l-teal-500" },
  REST: { label: "Rest", color: "var(--color-rest)", bgClass: "bg-gray-100 text-gray-600", borderClass: "border-l-gray-400" },
  CROSS_TRAINING: { label: "Cross-training", color: "var(--color-cross-training)", bgClass: "bg-cyan-100 text-cyan-800", borderClass: "border-l-cyan-500" },
  RACE: { label: "Race", color: "var(--color-race)", bgClass: "bg-orange-100 text-orange-800", borderClass: "border-l-orange-500" },
};

export const activityLabels: Record<string, string> = {
  RUN: "Run",
  CYCLE: "Cycle",
  SWIM: "Swim",
  HIKE: "Hike",
  SC: "S&C",
  REST: "Rest",
  OTHER: "Other",
};

export const intensityConfig: Record<string, { label: string; bgClass: string }> = {
  LOW: { label: "Low", bgClass: "bg-green-100 text-green-700" },
  MODERATE: { label: "Moderate", bgClass: "bg-yellow-100 text-yellow-700" },
  HIGH: { label: "High", bgClass: "bg-red-100 text-red-700" },
};

export const planStatusConfig: Record<string, { label: string; bgClass: string }> = {
  DRAFT: { label: "Draft", bgClass: "bg-gray-100 text-gray-600" },
  ACTIVE: { label: "Active", bgClass: "bg-blue-100 text-blue-800" },
  COMPLETED: { label: "Completed", bgClass: "bg-green-100 text-green-800" },
};
