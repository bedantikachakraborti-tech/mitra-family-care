import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Clock, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { VoiceIntake } from "@/components/voice-intake";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pill, SoftCard, SectionTitle } from "@/components/ui-kit";
import { structureCarePlan } from "@/lib/ai.functions";
import { languageName, useLanguage } from "@/lib/i18n";
import { addTasks, deleteTask, ensurePlan, updateTask } from "@/lib/care-data";
import { useRole } from "@/lib/auth";

import {
  BUFFER_MAX,
  BUFFER_MIN,
  DAYS,
  DAY_LABELS,
  TIME_OF_DAY,
  type CareTask,
  type DayKey,
  type DraftTask,
  type TimeOfDay,
} from "@/lib/care-types";
import { useCareContext } from "@/lib/use-care";

export const Route = createFileRoute("/_authenticated/care-plan")({
  head: () => ({
    meta: [
      { title: "Care plan — Mitra" },
      {
        name: "description",
        content:
          "Describe daily routines in your own words; Mitra drafts a care plan you review, edit and confirm before anything is saved.",
      },
      { property: "og:title", content: "Care plan — Mitra" },
      {
        property: "og:description",
        content: "The daily rhythm everyone in the care circle follows.",
      },
    ],
  }),
  component: CarePlanPage,
});

const bufferChoices = Array.from(
  { length: (BUFFER_MAX - BUFFER_MIN) / 10 + 1 },
  (_, i) => BUFFER_MIN + i * 10,
);

const emptyDraft: DraftTask = {
  title: "",
  details: "",
  category: "routine",
  timeOfDay: "morning",
  scheduledTime: "",
  days: [...DAYS],
};

function CarePlanPage() {
  const role = useRole();
  if (role === "caregiver") return <CaregiverPlanView />;
  return <FamilyPlanEditor />;
}

/** Caregivers see the plan as a read-only rhythm; today's actions live in Today's care. */
function CaregiverPlanView() {
  const { request, tasks, caregiver } = useCareContext();

  return (
    <AppShell
      role="caregiver"
      title="Care plan"
      subtitle={
        request?.person_name
          ? `${request.person_name}${caregiver ? " · shared with the family" : ""}`
          : ""
      }
      action={
        <Button asChild size="lg" className="h-12 rounded-full px-6">
          <Link to="/caregiver">Today's care</Link>
        </Button>
      }
    >
      <SoftCard tone="sage">
        <p className="text-sm">
          The family keeps this plan up to date. Mark tasks complete or postponed from Today's care —
          anything you need changed here, send a message and the family can update it.
        </p>
      </SoftCard>

      <SoftCard>
        <SectionTitle hint={`${tasks.length} tasks`}>The weekly rhythm</SectionTitle>
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            There's no plan yet. It will appear here once the family confirms one.
          </p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((task) => (
              <li key={task.id} className="rounded-2xl border border-border p-4">
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" aria-hidden />
                  <span className="tabular-nums">{task.scheduled_time || task.time_of_day}</span>
                </p>
                <p className="mt-1 font-medium">{task.title}</p>
                {task.details && (
                  <p className="mt-1 text-sm text-muted-foreground">{task.details}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Pill tone="sage">{task.category}</Pill>
                  <Pill tone="sky">{task.buffer_minutes} min window</Pill>
                  {task.days.map((d) => (
                    <Pill key={d}>{DAY_LABELS[d as DayKey] ?? d}</Pill>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </SoftCard>
    </AppShell>
  );
}

function FamilyPlanEditor() {
  const queryClient = useQueryClient();
  const { request, planId, tasks, caregiver } = useCareContext();
  const [description, setDescription] = useState("");
  const [drafts, setDrafts] = useState<DraftTask[] | null>(null);
  const { lang: uiLang } = useLanguage();

  const parsePlan = useServerFn(structureCarePlan);

  const build = useMutation({
    mutationFn: async () => {
      const result = await parsePlan({
        data: {
          description,
          personName: request?.person_name ?? "",
          outputLanguage: languageName(uiLang),
        },
      });
      return result;
    },

    onSuccess: (result) => {
      setDrafts(result);
      if (result.length === 0) toast.message("Mitra couldn't find any routines in that text yet.");
      else toast.success("Draft ready — review it before saving");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const confirm = useMutation({
    mutationFn: async () => {
      if (!request) throw new Error("Create a care request first.");
      const cleaned = (drafts ?? []).filter((d) => d.title.trim().length > 0);
      if (cleaned.length === 0) throw new Error("Add at least one task before saving.");
      const id = planId ?? (await ensurePlan(request.id));
      await addTasks(id, cleaned, "ai");
    },
    onSuccess: async () => {
      setDrafts(null);
      setDescription("");
      await queryClient.invalidateQueries();
      toast.success("Care plan saved");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeSaved = useMutation({
    mutationFn: (taskId: string) => deleteTask(taskId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["care-tasks"] }),
    onError: (error: Error) => toast.error(error.message),
  });

  const editSaved = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<CareTask> }) => updateTask(id, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["care-tasks"] }),
    onError: (error: Error) => toast.error(error.message),
  });

  if (!request) {
    return (
      <AppShell role="family" title="Care plan">
        <SoftCard>
          <p className="text-sm text-muted-foreground">
            Start with a care request so Mitra knows who the plan is for.
          </p>
          <Button asChild size="lg" className="mt-5 h-13 rounded-full">
            <Link to="/family/request">Start a care request</Link>
          </Button>
        </SoftCard>
      </AppShell>
    );
  }

  const patchDraft = (index: number, patch: Partial<DraftTask>) =>
    setDrafts((current) =>
      (current ?? []).map((d, i) => (i === index ? { ...d, ...patch } : d)),
    );

  return (
    <AppShell
      role="family"
      title="Care plan"
      subtitle={`${request.person_name || "Your family member"}${
        caregiver ? ` · shared with ${caregiver.name}` : ""
      }`}
    >
      <SoftCard tone="honey">
        <h2 className="text-lg font-semibold">Describe the day in your own words</h2>
        <p className="mt-2 text-sm opacity-90">
          Speak or type it — in English, हिन्दी, বাংলা or தமிழ். Mitra turns it into a draft of
          recurring tasks written in {languageName(uiLang)}. Nothing is saved until you confirm, and
          only medicines and doses you give yourself are ever included.
        </p>
        <div className="mt-4">
          <VoiceIntake
            value={description}
            onChange={setDescription}
            rows={6}
            placeholder="She wakes around 7, likes tea before anything else. Short walk at 10 if it isn't too hot. Lunch at 12:30, soft food, low salt…"
          />
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            size="lg"
            className="h-13 rounded-full px-6"
            disabled={build.isPending || description.trim().length < 10}
            onClick={() => build.mutate()}
          >
            {build.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Draft the plan
          </Button>
        </div>
      </SoftCard>

      {drafts && (
        <SoftCard>
          <SectionTitle hint="Nothing is saved yet">Review the draft</SectionTitle>
          <ul className="space-y-4">
            {drafts.map((draft, index) => (
              <li key={index} className="rounded-2xl border border-border p-4">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <Input
                    value={draft.title}
                    onChange={(event) => patchDraft(index, { title: event.target.value })}
                    placeholder="Task title"
                    className="h-12 rounded-2xl"
                  />
                  <Button
                    variant="ghost"
                    size="lg"
                    className="h-12 w-12 rounded-full p-0"
                    aria-label="Remove task"
                    onClick={() =>
                      setDrafts((current) => (current ?? []).filter((_, i) => i !== index))
                    }
                  >
                    <Trash2 className="h-4.5 w-4.5" aria-hidden />
                  </Button>
                </div>

                <Textarea
                  rows={2}
                  value={draft.details}
                  onChange={(event) => patchDraft(index, { details: event.target.value })}
                  placeholder="Anything helpful to know"
                  className="mt-3 rounded-2xl"
                />

                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <label className="text-sm">
                    <span className="text-muted-foreground">Time</span>
                    <Input
                      type="time"
                      value={draft.scheduledTime}
                      onChange={(event) => patchDraft(index, { scheduledTime: event.target.value })}
                      className="mt-1 h-12 rounded-2xl"
                    />
                  </label>
                  <label className="text-sm">
                    <span className="text-muted-foreground">Part of day</span>
                    <select
                      value={draft.timeOfDay}
                      onChange={(event) =>
                        patchDraft(index, { timeOfDay: event.target.value as TimeOfDay })
                      }
                      className="mt-1 h-12 w-full rounded-2xl border border-border bg-background px-3 text-sm"
                    >
                      {TIME_OF_DAY.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm">
                    <span className="text-muted-foreground">Category</span>
                    <Input
                      value={draft.category}
                      onChange={(event) => patchDraft(index, { category: event.target.value })}
                      className="mt-1 h-12 rounded-2xl"
                    />
                  </label>
                </div>

                <DayPicker
                  value={draft.days}
                  onChange={(days) => patchDraft(index, { days })}
                  className="mt-3"
                />
              </li>
            ))}
          </ul>

          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <Button
              variant="outline"
              size="lg"
              className="h-12 rounded-full"
              onClick={() => setDrafts((current) => [...(current ?? []), { ...emptyDraft }])}
            >
              <Plus className="mr-2 h-4 w-4" aria-hidden /> Add a task
            </Button>
            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <Button
                variant="ghost"
                size="lg"
                className="h-12 rounded-full"
                onClick={() => setDrafts(null)}
              >
                Discard draft
              </Button>
              <Button
                size="lg"
                className="h-12 rounded-full px-6"
                disabled={confirm.isPending}
                onClick={() => confirm.mutate()}
              >
                {confirm.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm and save
              </Button>
            </div>
          </div>
        </SoftCard>
      )}

      <SoftCard>
        <SectionTitle hint={`${tasks.length} saved`}>The plan today</SectionTitle>
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No tasks saved yet. Describe the routines above and Mitra will draft them for you.
          </p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((task) => (
              <li key={task.id} className="rounded-2xl border border-border p-4">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" aria-hidden />
                      <span className="tabular-nums">{task.scheduled_time || task.time_of_day}</span>
                    </p>
                    <p className="mt-1 truncate font-medium">{task.title}</p>
                    {task.details && (
                      <p className="mt-1 text-sm text-muted-foreground">{task.details}</p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Pill tone="sage">{task.category}</Pill>
                      {task.days.map((d) => (
                        <Pill key={d}>{DAY_LABELS[d as DayKey] ?? d}</Pill>
                      ))}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Completion window
                      <select
                        value={task.buffer_minutes}
                        onChange={(event) =>
                          editSaved.mutate({
                            id: task.id,
                            patch: { buffer_minutes: Number(event.target.value) },
                          })
                        }
                        className="mt-1 h-11 w-32 rounded-2xl border border-border bg-background px-3 text-sm"
                        aria-label={`Completion window for ${task.title}`}
                      >
                        {bufferChoices.map((m) => (
                          <option key={m} value={m}>
                            {m} min
                          </option>
                        ))}
                      </select>
                    </label>
                    <Input
                      type="time"
                      value={task.scheduled_time}
                      onChange={(event) =>
                        editSaved.mutate({
                          id: task.id,
                          patch: { scheduled_time: event.target.value },
                        })
                      }
                      className="h-11 w-32 rounded-2xl"
                      aria-label={`Time for ${task.title}`}
                    />
                    <Button
                      variant="ghost"
                      size="lg"
                      className="h-11 rounded-full"
                      onClick={() => removeSaved.mutate(task.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" aria-hidden /> Remove
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SoftCard>
    </AppShell>
  );
}

function DayPicker({
  value,
  onChange,
  className,
}: {
  value: DayKey[];
  onChange: (days: DayKey[]) => void;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap gap-2 ${className ?? ""}`}>
      {DAYS.map((day) => {
        const active = value.includes(day);
        return (
          <button
            key={day}
            type="button"
            onClick={() =>
              onChange(active ? value.filter((d) => d !== day) : [...value, day])
            }
            className={`min-h-11 rounded-full px-4 text-sm font-medium transition-colors ${
              active
                ? "bg-primary text-primary-foreground"
                : "border border-border text-muted-foreground"
            }`}
            aria-pressed={active}
          >
            {DAY_LABELS[day]}
          </button>
        );
      })}
    </div>
  );
}
