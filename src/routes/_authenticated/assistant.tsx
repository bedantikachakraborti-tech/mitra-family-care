import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SoftCard, SectionTitle } from "@/components/ui-kit";
import { buildTaskEvidence, hasEnoughHistory, MIN_DAYS_FOR_PATTERN } from "@/lib/adaptive";
import { askAssistant, generateDaySummary, suggestPlanAdjustments } from "@/lib/ai.functions";

import { recentLogsQuery, saveDaySummary, updateTask } from "@/lib/care-data";
import { buildAssistantContext, logFor, tasksForDay, useCareContext } from "@/lib/use-care";

export const Route = createFileRoute("/_authenticated/assistant")({
  head: () => ({
    meta: [
      { title: "Assistant — Mitra" },
      {
        name: "description",
        content:
          "A gentle helper for summarising the day, suggesting schedule changes and answering care plan questions.",
      },
      { property: "og:title", content: "Assistant — Mitra" },
      { property: "og:description", content: "Help with the writing, not another form to fill." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Assistant,
});

type ChatMessage = { role: "user" | "assistant"; content: string };

const suggestions = [
  "What's left today?",
  "Summarise how today went",
  "What should I keep in mind this evening?",
];

function Assistant() {
  const queryClient = useQueryClient();
  const { request, caregiver, tasks, logs, planId, date } = useCareContext();
  const recent = useQuery(recentLogsQuery(planId ?? undefined));

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [summary, setSummary] = useState<string | null>(null);
  const [proposals, setProposals] = useState<
    { taskId: string; suggestion: string; reason: string }[] | null
  >(null);

  const ask = useServerFn(askAssistant);
  const writeSummary = useServerFn(generateDaySummary);
  const suggestChanges = useServerFn(suggestPlanAdjustments);

  const today = tasksForDay(tasks);
  const context = buildAssistantContext({
    personName: request?.person_name ?? "",
    caregiverName: caregiver?.name ?? "",
    summary: request?.structured?.summary ?? "",
    tasks: today,
    logs,
  });

  const send = useMutation({
    mutationFn: async (text: string) => {
      const history: ChatMessage[] = [...messages, { role: "user", content: text }];
      setMessages(history);
      const reply = await ask({
        data: { role: caregiver ? "caregiver" : "family", context, messages: history },
      });
      return reply;
    },
    onSuccess: (reply) => setMessages((m) => [...m, { role: "assistant", content: reply }]),
    onError: (error: Error) => toast.error(error.message),
  });

  const dailySummary = useMutation({
    mutationFn: async () => {
      if (!planId) throw new Error("There's no care plan yet.");
      const entries = today.map((task) => {
        const log = logFor(logs, task.id);
        return {
          title: task.title,
          time: task.scheduled_time || task.time_of_day,
          status: log?.status ?? "pending",
          note: log?.note ?? "",
        };
      });
      if (entries.length === 0) throw new Error("There are no tasks recorded for today yet.");
      return writeSummary({
        data: {
          personName: request?.person_name ?? "",
          caregiverName: caregiver?.name ?? "",
          date,
          entries,
        },
      });
    },
    onSuccess: (text) => setSummary(text),
    onError: (error: Error) => toast.error(error.message),
  });

  const saveSummary = useMutation({
    mutationFn: async () => {
      if (!planId || !summary) throw new Error("Nothing to save yet.");
      await saveDaySummary(planId, date, summary);
    },
    onSuccess: async () => {
      setSummary(null);
      await queryClient.invalidateQueries({ queryKey: ["day-summary"] });
      toast.success("Summary shared with the care circle");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const evidence = buildTaskEvidence(tasks, recent.data ?? []);

  const askAdjustments = useMutation({
    mutationFn: async () => {
      if (evidence.length === 0) throw new Error("There's no care plan to look at yet.");
      if (!hasEnoughHistory(evidence)) {
        throw new Error(
          `Mitra needs at least ${MIN_DAYS_FOR_PATTERN} days of task records before it can spot a pattern.`,
        );
      }
      const patterned = evidence.filter((e) => e.hasPattern);
      if (patterned.length === 0) return [];
      return suggestChanges({
        data: {
          entries: patterned.map((e) => ({
            taskId: e.taskId,
            title: e.title,
            time: e.time,
            recent: e.recent,
            notes: e.notes,
            observations: e.observations,
          })),
        },
      });
    },
    onSuccess: (result) => {
      setProposals(result);
      if (result.length === 0) toast.message("Nothing stands out in the recent records.");
    },
    onError: (error: Error) => toast.error(error.message),
  });


  const applyChange = useMutation({
    mutationFn: async ({ taskId, time }: { taskId: string; time: string }) =>
      updateTask(taskId, { scheduled_time: time }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["care-tasks"] });
      toast.success("Schedule updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <AppShell
      role={caregiver ? "caregiver" : "family"}
      title="Assistant"
      subtitle="Grounded in the current care plan and today's records."
    >
      <SoftCard tone="sky">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4" aria-hidden /> How Mitra helps
        </p>
        <p className="mt-2 text-sm opacity-90">
          Mitra answers from the saved care plan and today's task records only. It never gives
          medical advice and never changes anything without your confirmation.
        </p>
      </SoftCard>

      <SoftCard className="flex min-h-[22rem] flex-col">
        <div className="flex-1 space-y-4">
          {messages.length === 0 && (
            <Bubble from="assistant">
              {request?.person_name
                ? `Ask me anything about ${request.person_name}'s plan for today.`
                : "Once a care plan is saved, I can answer questions about the day."}
            </Bubble>
          )}
          {messages.map((message, index) => (
            <Bubble key={index} from={message.role}>
              {message.content}
            </Bubble>
          ))}
          {send.isPending && (
            <Bubble from="assistant">
              <Loader2 className="h-4 w-4 animate-spin" aria-label="Thinking" />
            </Bubble>
          )}
        </div>

        <div className="mt-6">
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                disabled={send.isPending}
                onClick={() => send.mutate(s)}
                className="min-h-11 rounded-full border border-border px-4 text-sm font-medium text-muted-foreground disabled:opacity-70"
              >
                {s}
              </button>
            ))}
          </div>
          <form
            className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const text = input.trim();
              if (!text) return;
              setInput("");
              send.mutate(text);
            }}
          >
            <Input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask Mitra something…"
              className="h-13 rounded-full"
            />
            <Button
              type="submit"
              size="lg"
              disabled={send.isPending || input.trim().length === 0}
              className="h-13 w-13 shrink-0 rounded-full p-0"
              aria-label="Send message"
            >
              <Send className="h-5 w-5" aria-hidden />
            </Button>
          </form>
        </div>
      </SoftCard>

      <SoftCard>
        <SectionTitle hint="From today's task records">End-of-day summary</SectionTitle>
        {summary ? (
          <>
            <p className="rounded-2xl bg-secondary p-4 text-sm">{summary}</p>
            <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                variant="ghost"
                size="lg"
                className="h-12 rounded-full"
                onClick={() => setSummary(null)}
              >
                Discard
              </Button>
              <Button
                size="lg"
                className="h-12 rounded-full px-6"
                disabled={saveSummary.isPending}
                onClick={() => saveSummary.mutate()}
              >
                Share with the care circle
              </Button>
            </div>
          </>
        ) : (
          <Button
            size="lg"
            className="h-12 rounded-full px-6"
            disabled={dailySummary.isPending}
            onClick={() => dailySummary.mutate()}
          >
            {dailySummary.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Draft today's update
          </Button>
        )}
      </SoftCard>

      <SoftCard>
        <SectionTitle hint="Nothing changes until you confirm">Schedule suggestions</SectionTitle>
        {proposals && proposals.length > 0 ? (
          <ul className="space-y-3">
            {proposals.map((proposal) => {
              const task = tasks.find((t) => t.id === proposal.taskId);
              const time = /\b([01]?\d|2[0-3]):([0-5]\d)\b/.exec(proposal.suggestion)?.[0] ?? null;
              const normalised = time
                ? time.length === 4
                  ? `0${time}`
                  : time
                : null;
              return (
                <li key={proposal.taskId} className="rounded-2xl border border-border p-4">
                  <p className="truncate text-sm font-semibold">{task?.title ?? "Task"}</p>
                  <p className="mt-2 text-sm">{proposal.suggestion}</p>
                  {proposal.reason && (
                    <p className="mt-1 text-sm text-muted-foreground">{proposal.reason}</p>
                  )}
                  <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Button
                      variant="ghost"
                      size="lg"
                      className="h-11 rounded-full"
                      onClick={() =>
                        setProposals((current) =>
                          (current ?? []).filter((p) => p.taskId !== proposal.taskId),
                        )
                      }
                    >
                      Not now
                    </Button>
                    {normalised && task ? (
                      <Button
                        size="lg"
                        className="h-11 rounded-full px-5"
                        disabled={applyChange.isPending}
                        onClick={() => {
                          applyChange.mutate({ taskId: task.id, time: normalised });
                          setProposals((current) =>
                            (current ?? []).filter((p) => p.taskId !== proposal.taskId),
                          );
                        }}
                      >
                        Move to {normalised}
                      </Button>
                    ) : (
                      <span className="self-center text-xs text-muted-foreground">
                        Edit this task in the care plan if you'd like to change it.
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Mitra can look at how recent days have gone and suggest gentle timing changes. You
              decide whether to apply them.
            </p>
            <Button
              size="lg"
              variant="outline"
              className="mt-4 h-12 rounded-full px-6"
              disabled={askAdjustments.isPending}
              onClick={() => askAdjustments.mutate()}
            >
              {askAdjustments.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Look for suggestions
            </Button>
          </>
        )}
      </SoftCard>
    </AppShell>
  );
}

function Bubble({ from, children }: { from: "user" | "assistant"; children: React.ReactNode }) {
  const isUser = from === "user";
  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <p
        className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm whitespace-pre-wrap ${
          isUser ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
        }`}
      >
        {children}
      </p>
    </div>
  );
}
