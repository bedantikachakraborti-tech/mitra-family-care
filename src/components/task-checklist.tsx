import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Circle, Clock, NotebookPen, Timer } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Pill } from "@/components/ui-kit";
import { counterpartQuery, setTaskLog } from "@/lib/care-data";
import { notifyCounterpart } from "@/lib/care-social";
import {
  clampBuffer,
  statusLabel,
  type CareRequest,
  type CareTask,
  type TaskLog,
  type TaskStatus,
} from "@/lib/care-types";
import { logFor } from "@/lib/use-care";

/**
 * Caregiver-side task logging. Only ever writes to task_logs — never to the
 * family's plan definition (schedule, buffer, recurrence, details).
 */
export function useTaskSave(input: {
  request: CareRequest | null;
  logs: TaskLog[];
  date: string;
}) {
  const queryClient = useQueryClient();
  const counterpart = useQuery(counterpartQuery(input.request?.id));

  return useMutation({
    mutationFn: async (vars: {
      task: CareTask;
      status: TaskStatus;
      note: string;
      postponedTo?: string | undefined;
    }) => {
      const existing = logFor(input.logs, vars.task.id);
      await setTaskLog({
        taskId: vars.task.id,
        status: vars.status,
        note: vars.note,
        postponedTo: vars.postponedTo,
        date: input.date,
        task: vars.task,
        existingPostponedTo: existing?.postponed_to ?? "",
      });
      if (input.request && (vars.status === "done" || vars.status === "postponed")) {
        await notifyCounterpart({
          requestId: input.request.id,
          counterpartUserId: counterpart.data,
          kind: `task-${vars.status}`,
          title:
            vars.status === "done"
              ? `${vars.task.title} marked complete`
              : `${vars.task.title} postponed`,
          body: vars.note,
          link: "/shared",
          dedupeKey: `task-${vars.task.id}-${input.date}-${vars.status}-${vars.postponedTo ?? ""}`,
        });
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["task-logs"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function TaskRow({
  task,
  log,
  saving,
  onSave,
}: {
  task: CareTask;
  log: TaskLog | undefined;
  saving: boolean;
  onSave: (status: TaskStatus, note: string, postponedTo?: string) => void;
}) {
  const [openNote, setOpenNote] = useState(false);
  const [openPostpone, setOpenPostpone] = useState(false);
  const [newTime, setNewTime] = useState(log?.postponed_to || task.scheduled_time || "");
  const [note, setNote] = useState(log?.note ?? "");
  const status = log?.status ?? "pending";

  return (
    <li className="rounded-2xl border border-border p-4">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground">
          {status === "done" ? (
            <CheckCircle2 className="h-4.5 w-4.5" aria-hidden />
          ) : status === "postponed" ? (
            <Timer className="h-4.5 w-4.5" aria-hidden />
          ) : (
            <Circle className="h-4.5 w-4.5" aria-hidden />
          )}
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground tabular-nums">
              <Clock className="mr-1 inline h-3.5 w-3.5" aria-hidden />
              {task.scheduled_time || task.time_of_day}
            </span>
            <span
              className={`truncate font-medium ${status === "done" ? "text-muted-foreground line-through" : ""}`}
            >
              {task.title}
            </span>
          </p>
          {task.details && <p className="mt-0.5 text-sm text-muted-foreground">{task.details}</p>}
          <p className="mt-2 text-xs text-muted-foreground">{statusLabel(log)}</p>
          {log?.note && !openNote && (
            <p className="mt-2 rounded-2xl bg-secondary px-3 py-2 text-sm">{log.note}</p>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          size="lg"
          variant={status === "done" ? "default" : "outline"}
          className="h-11 rounded-full"
          disabled={saving}
          onClick={() => onSave("done", note)}
        >
          Complete
        </Button>
        <Button
          size="lg"
          variant={status === "postponed" ? "default" : "outline"}
          className="h-11 rounded-full"
          disabled={saving}
          onClick={() => setOpenPostpone((v) => !v)}
        >
          Postpone
        </Button>
        <Button
          size="lg"
          variant="ghost"
          className="h-11 rounded-full"
          onClick={() => setOpenNote((v) => !v)}
        >
          <NotebookPen className="mr-2 h-4 w-4" aria-hidden />
          {log?.note ? "Edit note" : "Add note"}
        </Button>
        {task.category && <Pill tone="sky">{task.category}</Pill>}
        <Pill tone="sage">{clampBuffer(task.buffer_minutes)} min window</Pill>
      </div>

      {openPostpone && (
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <div>
            <label htmlFor={`time-${task.id}`} className="text-xs font-semibold">
              New time
            </label>
            <input
              id={`time-${task.id}`}
              type="time"
              value={newTime}
              onChange={(event) => setNewTime(event.target.value)}
              className="mt-1 block h-11 rounded-2xl border border-border bg-card px-3 text-sm"
            />
          </div>
          <Button
            size="lg"
            className="h-11 rounded-full px-5"
            disabled={saving}
            onClick={() => {
              onSave("postponed", note, newTime);
              setOpenPostpone(false);
            }}
          >
            Save new time
          </Button>
        </div>
      )}

      {openNote && (
        <div className="mt-3">
          <Textarea
            rows={2}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="How did it go? Anything the family should know?"
            className="rounded-2xl"
          />
          <div className="mt-2 flex justify-end">
            <Button
              size="lg"
              className="h-11 rounded-full px-5"
              disabled={saving}
              onClick={() => {
                onSave(status, note);
                setOpenNote(false);
              }}
            >
              Save note
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}
