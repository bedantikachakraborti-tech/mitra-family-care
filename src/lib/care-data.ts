import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import {
  emptyRequirements,
  type CareRequest,
  type CareRequirements,
  type CareTask,
  type Caregiver,
  type CaregiverMatch,
  type DraftTask,
  type TaskLog,
  type TaskStatus,
} from "./care-types";

function unwrap<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data as T;
}

/* ---------------------------------- reads --------------------------------- */

export const caregiversQuery = queryOptions({
  queryKey: ["caregivers"],
  queryFn: async (): Promise<Caregiver[]> =>
    unwrap(await supabase.from("caregivers").select("*").order("name")) ?? [],
});

export const activeRequestQuery = queryOptions({
  queryKey: ["care-request", "active"],
  queryFn: async (): Promise<CareRequest | null> => {
    const rows = unwrap(
      await supabase
        .from("care_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1),
    );
    const row = rows?.[0];
    if (!row) return null;
    return {
      ...row,
      structured: { ...emptyRequirements, ...((row.structured ?? {}) as CareRequirements) },
    } as CareRequest;
  },
});

export function matchesQuery(requestId: string | undefined) {
  return queryOptions({
    queryKey: ["matches", requestId ?? "none"],
    enabled: Boolean(requestId),
    queryFn: async (): Promise<CaregiverMatch[]> =>
      unwrap(
        await supabase
          .from("caregiver_matches")
          .select("*")
          .eq("request_id", requestId!)
          .order("score", { ascending: false }),
      ) ?? [],
  });
}

export function planQuery(requestId: string | undefined) {
  return queryOptions({
    queryKey: ["care-plan", requestId ?? "none"],
    enabled: Boolean(requestId),
    queryFn: async (): Promise<{ id: string } | null> => {
      const rows = unwrap(
        await supabase.from("care_plans").select("id").eq("request_id", requestId!).limit(1),
      );
      return rows?.[0] ?? null;
    },
  });
}

export function tasksQuery(planId: string | undefined) {
  return queryOptions({
    queryKey: ["care-tasks", planId ?? "none"],
    enabled: Boolean(planId),
    queryFn: async (): Promise<CareTask[]> =>
      unwrap(
        await supabase
          .from("care_tasks")
          .select("*")
          .eq("plan_id", planId!)
          .order("scheduled_time")
          .order("created_at"),
      ) ?? [],
  });
}

export function logsQuery(planId: string | undefined, date: string) {
  return queryOptions({
    queryKey: ["task-logs", planId ?? "none", date],
    enabled: Boolean(planId),
    queryFn: async (): Promise<TaskLog[]> => {
      const tasks = unwrap(await supabase.from("care_tasks").select("id").eq("plan_id", planId!));
      const ids = (tasks ?? []).map((t) => t.id);
      if (ids.length === 0) return [];
      return (
        (unwrap(
          await supabase.from("task_logs").select("*").eq("log_date", date).in("task_id", ids),
        ) as TaskLog[]) ?? []
      );
    },
  });
}

export function recentLogsQuery(planId: string | undefined) {
  return queryOptions({
    queryKey: ["task-logs", "recent", planId ?? "none"],
    enabled: Boolean(planId),
    queryFn: async (): Promise<TaskLog[]> => {
      const tasks = unwrap(await supabase.from("care_tasks").select("id").eq("plan_id", planId!));
      const ids = (tasks ?? []).map((t) => t.id);
      if (ids.length === 0) return [];
      return (
        (unwrap(
          await supabase
            .from("task_logs")
            .select("*")
            .in("task_id", ids)
            .order("log_date", { ascending: false })
            .limit(200),
        ) as TaskLog[]) ?? []
      );
    },
  });
}

export function summaryQuery(planId: string | undefined, date: string) {
  return queryOptions({
    queryKey: ["day-summary", planId ?? "none", date],
    enabled: Boolean(planId),
    queryFn: async (): Promise<{ content: string } | null> => {
      const rows = unwrap(
        await supabase
          .from("day_summaries")
          .select("content")
          .eq("plan_id", planId!)
          .eq("summary_date", date)
          .limit(1),
      );
      return rows?.[0] ?? null;
    },
  });
}

/* --------------------------------- writes --------------------------------- */

export async function saveCareRequest(input: {
  rawDescription: string;
  structured: CareRequirements;
}): Promise<CareRequest> {
  const row = unwrap(
    await supabase
      .from("care_requests")
      .insert({
        person_name: input.structured.personName,
        area: input.structured.area,
        raw_description: input.rawDescription,
        structured: input.structured as unknown as never,
      })
      .select("*")
      .single(),
  );
  return row as unknown as CareRequest;
}

export async function saveMatches(
  requestId: string,
  matches: { caregiverId: string; score: number; rationale: string; considerations: string }[],
) {
  await supabase.from("caregiver_matches").delete().eq("request_id", requestId);
  if (matches.length === 0) return;
  unwrap(
    await supabase
      .from("caregiver_matches")
      .insert(
        matches.map((m) => ({
          request_id: requestId,
          caregiver_id: m.caregiverId,
          score: m.score,
          rationale: m.rationale,
          considerations: m.considerations,
        })),
      )
      .select("id"),
  );
}

export async function selectCaregiver(requestId: string, caregiverId: string) {
  unwrap(
    await supabase
      .from("care_requests")
      .update({ selected_caregiver_id: caregiverId })
      .eq("id", requestId)
      .select("id")
      .single(),
  );
}

export async function ensurePlan(requestId: string): Promise<string> {
  const existing = unwrap(
    await supabase.from("care_plans").select("id").eq("request_id", requestId).limit(1),
  );
  if (existing?.[0]) return existing[0].id;
  const created = unwrap(
    await supabase.from("care_plans").insert({ request_id: requestId }).select("id").single(),
  ) as { id: string } | null;
  if (!created) throw new Error("Could not create the care plan.");
  return created.id;
}

export async function addTasks(planId: string, tasks: DraftTask[], source: "ai" | "manual") {
  if (tasks.length === 0) return;
  unwrap(
    await supabase
      .from("care_tasks")
      .insert(
        tasks.map((t) => ({
          plan_id: planId,
          title: t.title,
          details: t.details,
          category: t.category,
          time_of_day: t.timeOfDay,
          scheduled_time: t.scheduledTime,
          days: t.days,
          source,
        })),
      )
      .select("id"),
  );
}

export async function updateTask(taskId: string, patch: Partial<CareTask>) {
  unwrap(await supabase.from("care_tasks").update(patch).eq("id", taskId).select("id").single());
}

export async function deleteTask(taskId: string) {
  const { error } = await supabase.from("care_tasks").delete().eq("id", taskId);
  if (error) throw new Error(error.message);
}

export async function setTaskLog(input: {
  taskId: string;
  date: string;
  status: TaskStatus;
  note: string;
}) {
  unwrap(
    await supabase
      .from("task_logs")
      .upsert(
        {
          task_id: input.taskId,
          log_date: input.date,
          status: input.status,
          note: input.note,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "task_id,log_date" },
      )
      .select("id")
      .single(),
  );
}

export async function saveDaySummary(planId: string, date: string, content: string) {
  unwrap(
    await supabase
      .from("day_summaries")
      .upsert({ plan_id: planId, summary_date: date, content }, { onConflict: "plan_id,summary_date" })
      .select("id")
      .single(),
  );
}
