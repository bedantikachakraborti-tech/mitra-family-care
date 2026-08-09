import { createFileRoute } from "@tanstack/react-router";
import { Send, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SoftCard } from "@/components/ui-kit";
import { assistantSuggestions } from "@/lib/demo-data";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "Assistant — Mitra" },
      {
        name: "description",
        content:
          "A gentle helper for summarising the day, drafting updates and answering care plan questions.",
      },
      { property: "og:title", content: "Assistant — Mitra" },
      { property: "og:description", content: "Help with the writing, not another form to fill." },
    ],
  }),
  component: Assistant,
});

function Assistant() {
  return (
    <AppShell
      role="caregiver"
      title="Assistant"
      subtitle="Here to help with the day's writing and reminders."
    >
      <SoftCard tone="sky">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4" aria-hidden /> Preview
        </p>
        <p className="mt-2 text-sm opacity-90">
          The assistant isn't switched on yet. This is how it will look and where it will live.
        </p>
      </SoftCard>

      <SoftCard className="flex min-h-[22rem] flex-col">
        <div className="flex-1 space-y-4">
          <Bubble from="assistant">
            Good morning, Priya. Kamala's next task is the 10:00 walk. Want me to draft today's
            update when you're done?
          </Bubble>
          <Bubble from="user">Yes, and remind me about the evening tablet.</Bubble>
          <Bubble from="assistant">
            Noted — I'll nudge you at 19:45 for Metformin 500mg with dinner.
          </Bubble>
        </div>

        <div className="mt-6">
          <div className="flex flex-wrap gap-2">
            {assistantSuggestions.map((s) => (
              <button
                key={s}
                type="button"
                disabled
                className="min-h-11 rounded-full border border-border px-4 text-sm font-medium text-muted-foreground disabled:opacity-70"
              >
                {s}
              </button>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
            <Input disabled placeholder="Ask Mitra something…" className="h-13 rounded-full" />
            <Button
              size="lg"
              disabled
              className="h-13 w-13 shrink-0 rounded-full p-0"
              aria-label="Send message"
            >
              <Send className="h-5 w-5" aria-hidden />
            </Button>
          </div>
        </div>
      </SoftCard>
    </AppShell>
  );
}

function Bubble({ from, children }: { from: "user" | "assistant"; children: React.ReactNode }) {
  const isUser = from === "user";
  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <p
        className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm ${
          isUser ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
        }`}
      >
        {children}
      </p>
    </div>
  );
}
