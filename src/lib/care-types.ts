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
  bufferMinutes?: number;
};


export type TaskStatus = "pending" | "done" | "postponed" | "cancelled";

/** How long after the scheduled time a task can still be marked complete. */
export const BUFFER_MIN = 10;
export const BUFFER_MAX = 60;
export const BUFFER_DEFAULT = 30;

export function clampBuffer(value: number): number {
  if (!Number.isFinite(value)) return BUFFER_DEFAULT;
  return Math.min(BUFFER_MAX, Math.max(BUFFER_MIN, Math.round(value)));
}

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
  buffer_minutes: number;
  created_at: string;
};

export type TaskLog = {
  id: string;
  task_id: string;
  log_date: string;
  status: TaskStatus;
  note: string;
  completed_at: string | null;
  postponed_to: string;
  scheduled_at: string | null;
  outside_buffer: boolean;
  updated_at: string;
};

export type MatchStatus = "pending" | "active" | "unmatched";

export type Message = {
  id: string;
  request_id: string;
  sender_user_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

export type AppNotification = {
  id: string;
  user_id: string;
  request_id: string | null;
  kind: string;
  title: string;
  body: string;
  link: string;
  dedupe_key: string;
  read_at: string | null;
  created_at: string;
};

export type Review = {
  id: string;
  request_id: string;
  reviewer_user_id: string;
  reviewee_user_id: string;
  rating: number;
  comment: string;
  categories: string[];
  created_at: string;
  updated_at: string;
};

/** The moment a task occurrence is due on a given day, honouring any postponement. */
export function occurrenceDue(
  task: Pick<CareTask, "scheduled_time">,
  log: Pick<TaskLog, "postponed_to"> | undefined,
  date: string,
): Date | null {
  const time = (log?.postponed_to || task.scheduled_time || "").trim();
  const match = /^(\d{1,2}):(\d{2})/.exec(time);
  if (!match) return null;
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, Number(match[1]), Number(match[2]), 0, 0);
}

/** The last moment a task occurrence can still be marked complete. */
export function bufferEnd(
  task: Pick<CareTask, "scheduled_time" | "buffer_minutes">,
  log: Pick<TaskLog, "postponed_to"> | undefined,
  date: string,
): Date | null {
  const due = occurrenceDue(task, log, date);
  if (!due) return null;
  return new Date(due.getTime() + clampBuffer(task.buffer_minutes) * 60_000);
}


/** Formats "14:05" or an ISO timestamp as a friendly clock time. */
export function clockTime(value: string | null | undefined): string {
  if (!value) return "";
  const match = /^(\d{1,2}):(\d{2})/.exec(value);
  const date = match
    ? new Date(2000, 0, 1, Number(match[1]), Number(match[2]))
    : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/** One neutral sentence describing where a task stands right now. */
export function statusLabel(
  log: TaskLog | undefined,
  t?: (key: string, vars?: Record<string, string>) => string,
): string {
  const translate =
    t ??
    ((key: string, vars?: Record<string, string>) => {
      const fallback: Record<string, string> = {
        "status.doneAt": `Completed at ${vars?.["time"] ?? ""}`,
        "status.doneLate": `Completed at ${vars?.["time"] ?? ""}, after the agreed window`,
        "status.done": "Marked complete",
        "status.postponedAt": `Postponed — new time ${vars?.["time"] ?? ""}`,
        "status.postponed": "Postponed for now",
        "status.cancelled": "This task wasn't marked complete within the agreed window.",
        "status.pending": "This task hasn't been marked complete yet.",
      };
      return fallback[key] ?? key;
    });

  if (log?.status === "done") {
    const at = clockTime(log.completed_at);
    if (!at) return translate("status.done");
    return translate(log.outside_buffer ? "status.doneLate" : "status.doneAt", { time: at });
  }
  if (log?.status === "postponed") {
    const at = clockTime(log.postponed_to);
    return at ? translate("status.postponedAt", { time: at }) : translate("status.postponed");
  }
  if (log?.status === "cancelled") return translate("status.cancelled");
  return translate("status.pending");
}




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
  certifications: string[];
  specialties: string[];
  preferred_hours?: string;
  availability_negotiable?: boolean;
  hours_negotiable?: boolean;
  location_negotiable?: boolean;
  rate_negotiable?: boolean;
  user_id?: string | null;
};


export type CareRequest = {
  id: string;
  person_name: string;
  area: string;
  raw_description: string;
  structured: CareRequirements;
  selected_caregiver_id: string | null;
  match_status: MatchStatus;
  unmatched_at?: string | null;
  unmatched_by?: string | null;
  family_user_id?: string | null;
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
