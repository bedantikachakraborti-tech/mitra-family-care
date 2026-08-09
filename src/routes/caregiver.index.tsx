import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  Circle,
  Pill as PillIcon,
  Utensils,
  Footprints,
  PhoneCall,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Pill, SoftCard, SectionTitle, StatTile } from "@/components/ui-kit";
import { careRecipient, todaysTasks, type Task } from "@/lib/demo-data";

export const Route = createFileRoute("/caregiver/")({
  head: () => ({
    meta: [
      { title: "Today's Care — Mitra" },
      {
        name: "description",
        content: "Your day with Kamala: the plan, the timings and the little things that matter.",
      },
      { property: "og:title", content: "Today's Care — Mitra" },
      { property: "og:description", content: "A caregiver's calm view of the day ahead." },
    ],
  }),
  component: CaregiverDashboard,
});

const icons = {
  medication: PillIcon,
  meal: Utensils,
  activity: Footprints,
  "check-in": PhoneCall,
} as const;

function CaregiverDashboard() {
  const done = todaysTasks.filter((t) => t.done).length;

  return (
    <AppShell
      role="caregiver"
      title="Good morning, Priya"
      subtitle={`Today with ${careRecipient.name} · Indiranagar`}
      action={
        <Button asChild size="lg" className="h-12 rounded-full px-6">
          <Link to="/assistant">Write today's update</Link>
        </Button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Tasks today" value={`${done} of ${todaysTasks.length}`} hint="On track" />
        <StatTile label="Next up" value="10:00" hint="Walk in the park" />
        <StatTile label="Shift" value="8:00 – 18:00" hint="Weekdays" />
      </div>

      <SoftCard>
        <SectionTitle hint="Tap to mark done">Today's plan</SectionTitle>
        <ul className="space-y-2">
          {todaysTasks.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </ul>
      </SoftCard>

      <SoftCard tone="sage">
        <h2 className="text-lg font-semibold">Things she loves</h2>
        <p className="mt-2 text-sm opacity-90">{careRecipient.notes}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {careRecipient.needs.map((n) => (
            <span key={n} className="rounded-full bg-card/70 px-3 py-1 text-xs font-medium">
              {n}
            </span>
          ))}
        </div>
      </SoftCard>
    </AppShell>
  );
}

function TaskRow({ task }: { task: Task }) {
  const Icon = icons[task.category];
  return (
    <li>
      <button
        type="button"
        className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3.5 text-left transition-colors hover:bg-secondary"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground">
          <Icon className="h-4.5 w-4.5" aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground tabular-nums">
              {task.time}
            </span>
            <span
              className={`truncate font-medium ${task.done ? "text-muted-foreground line-through" : ""}`}
            >
              {task.title}
            </span>
          </span>
          <span className="mt-0.5 block truncate text-sm text-muted-foreground">{task.detail}</span>
        </span>
        {task.done ? (
          <CheckCircle2 className="h-6 w-6 shrink-0 text-primary" aria-label="Done" />
        ) : (
          <Circle className="h-6 w-6 shrink-0 text-muted-foreground" aria-label="Not done" />
        )}
      </button>
    </li>
  );
}
