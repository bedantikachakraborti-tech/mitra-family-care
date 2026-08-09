import { useQuery } from "@tanstack/react-query";

import {
  activeRequestQuery,
  caregiversQuery,
  logsQuery,
  planQuery,
  tasksQuery,
} from "./care-data";
import { dayKeyOf, todayKey, type CareTask, type TaskLog } from "./care-types";

/** Everything the demo needs about the current household, in one hook. */
export function useCareContext(date = todayKey()) {
  const request = useQuery(activeRequestQuery);
  const caregivers = useQuery(caregiversQuery);
  const plan = useQuery(planQuery(request.data?.id));
  const tasks = useQuery(tasksQuery(plan.data?.id));
  const logs = useQuery(logsQuery(plan.data?.id, date));

  const caregiver =
    caregivers.data?.find((c) => c.id === request.data?.selected_caregiver_id) ?? null;

  return {
    date,
    request: request.data ?? null,
    caregivers: caregivers.data ?? [],
    caregiver,
    planId: plan.data?.id ?? null,
    tasks: tasks.data ?? [],
    logs: logs.data ?? [],
    isLoading: request.isLoading || plan.isLoading || tasks.isLoading,
  };
}

export function tasksForDay(tasks: CareTask[], date = new Date()): CareTask[] {
  const key = dayKeyOf(date);
  return tasks
    .filter((t) => t.is_active && t.days.includes(key))
    .sort((a, b) => (a.scheduled_time || "99:99").localeCompare(b.scheduled_time || "99:99"));
}

export function logFor(logs: TaskLog[], taskId: string): TaskLog | undefined {
  return logs.find((l) => l.task_id === taskId);
}

export function buildAssistantContext(input: {
  personName?: string;
  caregiverName?: string;
  summary?: string;
  tasks: CareTask[];
  logs: TaskLog[];
}): string {
  const lines: string[] = [];
  if (input.personName) lines.push(`Person receiving care: ${input.personName}`);
  if (input.caregiverName) lines.push(`Caregiver: ${input.caregiverName}`);
  if (input.summary) lines.push(`Situation: ${input.summary}`);
  if (input.tasks.length) {
    lines.push("Today's tasks:");
    for (const task of input.tasks) {
      const log = logFor(input.logs, task.id);
      const status =
        log?.status === "done"
          ? "marked complete"
          : log?.status === "postponed"
            ? "postponed"
            : "not marked complete yet";
      lines.push(
        `- ${task.scheduled_time || task.time_of_day}: ${task.title} (${status})${
          log?.note ? ` — caregiver note: ${log.note}` : ""
        }`,
      );
    }
  }
  return lines.join("\n");
}
