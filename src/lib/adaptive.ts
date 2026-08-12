import { clockTime, type CareTask, type TaskLog } from "./care-types";

export type TaskEvidence = {
  taskId: string;
  title: string;
  time: string;
  /** Plain-English observations drawn only from recorded logs. */
  observations: string[];
  recent: string[];
  notes: string[];
  daysRecorded: number;
  /** The most common time the caregiver actually re-scheduled this task to. */
  commonPostponedTo: string | null;
  hasPattern: boolean;
};

/** Minimum number of recorded days before Mitra will look for a pattern at all. */
export const MIN_DAYS_FOR_PATTERN = 3;

function mode(values: string[]): { value: string; count: number } | null {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  let best: { value: string; count: number } | null = null;
  for (const [value, count] of counts) {
    if (!best || count > best.count) best = { value, count };
  }
  return best;
}

/**
 * Turns raw task logs into observable, factual evidence.
 * Nothing here is inferred or judged — it only counts what was recorded.
 */
export function buildTaskEvidence(tasks: CareTask[], logs: TaskLog[]): TaskEvidence[] {
  return tasks
    .filter((task) => task.is_active)
    .map((task) => {
      const rows = logs
        .filter((log) => log.task_id === task.id)
        .sort((a, b) => b.log_date.localeCompare(a.log_date))
        .slice(0, 21);

      const daysRecorded = rows.length;
      const postponed = rows.filter((r) => r.status === "postponed");
      const completed = rows.filter((r) => r.status === "done");
      const pending = rows.filter((r) => r.status === "pending");
      const postponedTimes = postponed.map((r) => r.postponed_to).filter(Boolean);
      const common = mode(postponedTimes);

      const observations: string[] = [];
      if (postponed.length > 0) {
        observations.push(
          `Moved to a later time on ${postponed.length} of the last ${daysRecorded} recorded days.`,
        );
      }
      if (common && common.count >= 2) {
        observations.push(
          `When it was moved, the new time recorded was most often ${clockTime(common.value)} (${common.count} times).`,
        );
      }
      if (completed.length > 0) {
        observations.push(`Marked complete on ${completed.length} of ${daysRecorded} recorded days.`);
      }
      if (pending.length > 0) {
        observations.push(
          `Still not marked complete on ${pending.length} of ${daysRecorded} recorded days.`,
        );
      }

      // A pattern needs enough history AND a repeated signal, not a single off day.
      const repeated = postponed.length >= 2 || pending.length >= 2;
      const hasPattern = daysRecorded >= MIN_DAYS_FOR_PATTERN && repeated;

      return {
        taskId: task.id,
        title: task.title,
        time: task.scheduled_time || task.time_of_day,
        observations,
        recent: rows.map((r) => `${r.log_date}: ${r.status}`),
        notes: rows.filter((r) => r.note).map((r) => r.note),
        daysRecorded,
        commonPostponedTo: common && common.count >= 2 ? common.value : null,
        hasPattern,
      };
    });
}

/** True once there is enough recorded history anywhere in the plan to look for patterns. */
export function hasEnoughHistory(evidence: TaskEvidence[]): boolean {
  return evidence.some((e) => e.daysRecorded >= MIN_DAYS_FOR_PATTERN);
}
