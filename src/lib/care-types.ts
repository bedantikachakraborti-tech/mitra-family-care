// Shared, client-safe types for Mitra's care data.

export type CareRequirements = {
  personName: string;
  area: string;
  summary: string;
  supportNeeds: string[];
  schedule: string[];
  languages: string[];
  preferences: string[];
  thingsToDiscuss: string[];
};

export const emptyRequirements: CareRequirements = {
  personName: "",
  area: "",
  summary: "",
  supportNeeds: [],
  schedule: [],
  languages: [],
  preferences: [],
  thingsToDiscuss: [],
};

export type MatchSuggestion = {
  caregiverId: string;
  score: number;
  rationale: string;
  considerations: string;
};

export const TIME_OF_DAY = ["morning", "midday", "afternoon", "evening", "night"] as const;
export type TimeOfDay = (typeof TIME_OF_DAY)[number];

export const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type DayKey = (typeof DAYS)[number];

export const DAY_LABELS: Record<DayKey, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

export type DraftTask = {
  title: string;
  details: string;
  category: string;
  timeOfDay: TimeOfDay;
  scheduledTime: string;
  days: DayKey[];
};

export type TaskStatus = "pending" | "done" | "postponed";

export type CareTask = {
  id: string;
  plan_id: string;
  title: string;
  details: string;
  category: string;
  time_of_day: string;
  scheduled_time: string;
  days: string[];
  is_active: boolean;
  source: string;
  created_at: string;
};

export type TaskLog = {
  id: string;
  task_id: string;
  log_date: string;
  status: TaskStatus;
  note: string;
  updated_at: string;
};

export type Caregiver = {
  id: string;
  name: string;
  initials: string;
  headline: string;
  about: string;
  years_experience: number;
  languages: string[];
  skills: string[];
  area: string;
  availability: string;
  hourly_rate: number;
};

export type CareRequest = {
  id: string;
  person_name: string;
  area: string;
  raw_description: string;
  structured: CareRequirements;
  selected_caregiver_id: string | null;
  created_at: string;
};

export type CaregiverMatch = {
  id: string;
  request_id: string;
  caregiver_id: string;
  score: number;
  rationale: string;
  considerations: string;
};

export function todayKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

export function dayKeyOf(date = new Date()): DayKey {
  return DAYS[(date.getDay() + 6) % 7]!;
}
