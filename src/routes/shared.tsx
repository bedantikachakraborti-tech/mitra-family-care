import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Pill, SoftCard, SectionTitle, StatTile } from "@/components/ui-kit";
import { careTeam, updates } from "@/lib/demo-data";

export const Route = createFileRoute("/shared")({
  head: () => ({
    meta: [
      { title: "Care circle — Mitra" },
      {
        name: "description",
        content:
          "One shared page for the caregiver, the family and the doctor: updates, notes and who's involved.",
      },
      { property: "og:title", content: "Care circle — Mitra" },
      { property: "og:description", content: "Everyone caring for Kamala, on the same page." },
    ],
  }),
  component: SharedDashboard,
});

function SharedDashboard() {
  return (
    <AppShell
      role="family"
      title="Care circle"
      subtitle="Kamala Ramesh · shared between family and caregivers"
      action={
        <Button size="lg" variant="outline" className="h-12 rounded-full px-6">
          Invite someone
        </Button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="People" value={`${careTeam.length}`} hint="Family, caregiver, doctor" />
        <StatTile label="Updates this week" value="9" hint="Last one 2 hours ago" />
        <StatTile label="Next visit" value="Tomorrow" hint="Priya, 8:00" />
      </div>

      <SoftCard>
        <SectionTitle>Who's involved</SectionTitle>
        <ul className="grid gap-3 sm:grid-cols-2">
          {careTeam.map((p) => (
            <li
              key={p.name}
              className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-2xl border border-border p-4"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-secondary text-sm font-semibold">
                {p.initials}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-medium">{p.name}</span>
                <span className="block truncate text-sm text-muted-foreground">{p.role}</span>
              </span>
            </li>
          ))}
        </ul>
      </SoftCard>

      <SoftCard>
        <SectionTitle hint="Visible to everyone">Shared notes</SectionTitle>
        <Textarea rows={3} className="rounded-2xl" placeholder="Add a note for the care circle…" />
        <div className="mt-3 flex justify-end">
          <Button size="lg" className="h-12 rounded-full px-6">
            Post note
          </Button>
        </div>

        <ul className="mt-6 space-y-3">
          {updates.map((u) => (
            <li key={u.id} className="rounded-2xl border border-border p-4">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <p className="min-w-0 truncate text-sm font-semibold">{u.author}</p>
                <Pill tone="sage">{u.mood}</Pill>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{u.text}</p>
              <p className="mt-2 text-xs text-muted-foreground">{u.time}</p>
            </li>
          ))}
        </ul>
      </SoftCard>
    </AppShell>
  );
}
