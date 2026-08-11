import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Circle, Clock, Loader2, NotebookPen, Timer } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Pill, SoftCard, SectionTitle, StatTile } from "@/components/ui-kit";
import { setTaskLog } from "@/lib/care-data";
import { statusLabel, type CareTask, type TaskLog, type TaskStatus } from "@/lib/care-types";
import { logFor, tasksForDay, useCareContext } from "@/lib/use-care";

export const Route = createFileRoute("/_authenticated/caregiver/")({
  head: () => ({
    meta: [
      { title: "Today's Care — Mitra" },
      {
        name: "description",
        content: "Today's care tasks, timings and notes — mark things complete as the day goes.",
      },
      { property: "og:title", content: "Today's Care — Mitra" },
      { property: "og:description", content: "A caregiver's calm view of the day ahead." },
    ],
  }),
  component: CaregiverDashboard,
});

function CaregiverDashboard() {
  const queryClient = useQueryClient();
  const { request, caregiver, tasks, logs, date, isLoading } = useCareContext();

  const today = tasksForDay(tasks);
  const done = today.filter((t) => logFor(logs, t.id)?.status === "done").length;
  const next = today.find((t) => (logFor(logs, t.id)?.status ?? "pending") === "pending");

  const save = useMutation({
    mutationFn: (input: {
      taskId: string;
      status: TaskStatus;
      note: string;
      postponedTo?: string | undefined;
    }) => setTaskLog({ ...input, date }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["task-logs"] }),
    onError: (error: Error) => toast.error(error.message),
  });

  if (!isLoading && today.length === 0) {
    return (
      <AppShell
        role="caregiver"
        title="Today's care"
        subtitle={request?.person_name ? `With ${request.person_name}` : ""}
      >
        <SoftCard>
          <p className="text-sm text-muted-foreground">
            There's no care plan for today yet. Once the family confirms a plan, today's tasks will
            appear here.
          </p>
          <Button asChild size="lg" variant="outline" className="mt-5 h-12 rounded-full">
            <Link to="/care-plan">See the care plan</Link>
          </Button>
        </SoftCard>
      </AppShell>
    );
  }

  return (
    <AppShell
      role="caregiver"
      title={caregiver ? `Good day, ${caregiver.name.split(" ")[0]}` : "Today's care"}
      subtitle={
        request?.person_name
          ? `Today with ${request.person_name}${request.area ? ` · ${request.area}` : ""}`
          : ""
      }
      action={
        <Button asChild size="lg" className="h-12 rounded-full px-6">
          <Link to="/assistant">Write today's update</Link>
        </Button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile
          label="Tasks today"
          value={`${done} of ${today.length}`}
          hint={done === today.length ? "All marked complete" : "Marked complete so far"}
        />
        <StatTile
          label="Next up"
          value={next?.scheduled_time || next?.time_of_day || "—"}
          hint={next?.title ?? "Nothing pending"}
        />
        <StatTile label="Care circle" value={request?.person_name || "—"} hint="Shared with family" />
      </div>

      {isLoading ? (
        <SoftCard>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Loading today's plan…
          </p>
        </SoftCard>
      ) : (
        <SoftCard>
          <SectionTitle hint="You can always change these">Today's plan</SectionTitle>
          <ul className="space-y-2">
            {today.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                log={logFor(logs, task.id)}
                saving={save.isPending}
                onSave={(status, note, postponedTo) =>
                  save.mutate({ taskId: task.id, status, note, postponedTo })
                }
              />
            ))}
          </ul>
        </SoftCard>
      )}

      {request?.structured?.preferences?.length ? (
        <SoftCard tone="sage">
          <h2 className="text-lg font-semibold">Things that matter to her</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {request.structured.preferences.map((p) => (
              <span key={p} className="rounded-full bg-card/70 px-3 py-1 text-xs font-medium">
                {p}
              </span>
            ))}
          </div>
        </SoftCard>
      ) : null}
    </AppShell>
  );
}

function TaskRow({
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
          {task.details && (
            <p className="mt-0.5 text-sm text-muted-foreground">{task.details}</p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            {statusLabel(log)}
          </p>
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
