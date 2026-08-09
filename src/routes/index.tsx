import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarHeart, HeartHandshake, MessageCircleHeart, ShieldCheck, Sparkles, Users } from "lucide-react";
import heroImage from "@/assets/mitra-hero.jpg";
import { MitraMark } from "@/components/mitra-mark";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui-kit";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mitra — Care is better together." },
      {
        name: "description",
        content:
          "Mitra brings families and caregivers into one calm place: a shared care plan, daily updates and gentle reminders for the people you love.",
      },
      { property: "og:title", content: "Mitra — Care is better together." },
      {
        property: "og:description",
        content: "One calm, shared home for everyday caregiving.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: CalendarHeart,
    title: "A care plan everyone can read",
    text: "Mornings, medication, walks and the little things that matter — written plainly, in one place.",
  },
  {
    icon: MessageCircleHeart,
    title: "Daily updates, not check-ups",
    text: "Caregivers share how the day went. Families stay close without hovering.",
  },
  {
    icon: Users,
    title: "The whole care circle",
    text: "Siblings, caregivers and doctors see the same page, so nothing falls through.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-warm-gradient">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <MitraMark className="h-10 w-10" />
          <span className="font-display text-xl font-semibold">Mitra</span>
        </div>
        <Button asChild size="lg" className="rounded-full">
          <Link to="/role">Get started</Link>
        </Button>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <section className="grid items-center gap-10 pt-6 pb-14 lg:grid-cols-2 lg:gap-14 lg:pt-14">
          <div>
            <Pill tone="sage">Care is better together.</Pill>
            <h1 className="mt-5 text-4xl leading-[1.08] font-semibold sm:text-5xl lg:text-6xl">
              Looking after someone you love, without carrying it alone.
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
              Mitra connects families with trusted caregivers and keeps everyone on the same, gentle page — the
              plan for the day, how it actually went, and what comes next.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-13 rounded-full px-8 text-base">
                <Link to="/role">Find care for my family</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-13 rounded-full px-8 text-base">
                <Link to="/onboarding/caregiver">I'm a caregiver</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" aria-hidden /> Verified caregivers
              </span>
              <span className="flex items-center gap-2">
                <HeartHandshake className="h-4 w-4" aria-hidden /> Built with families
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-[2.5rem] border border-border bg-card shadow-lift">
              <img
                src={heroImage}
                alt="A caregiver and an older woman sitting together on a sofa, sharing tea"
                width={1280}
                height={1024}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 left-4 hidden rounded-3xl border border-border bg-card p-4 shadow-soft sm:block">
              <p className="text-xs text-muted-foreground">Today with Kamala</p>
              <p className="mt-1 text-sm font-semibold">Morning walk done · 20 min</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {features.map((f) => (
            <article key={f.title} className="rounded-3xl border border-border bg-card p-6 shadow-soft">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-sage text-sage-foreground">
                <f.icon className="h-5 w-5" aria-hidden />
              </span>
              <h2 className="mt-4 text-lg font-semibold">{f.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 rounded-[2rem] bg-honey p-8 text-honey-foreground sm:p-12">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-2 text-sm font-medium">
                <Sparkles className="h-4 w-4" aria-hidden /> Coming soon
              </span>
              <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">
                An assistant that helps you write the update, not another form to fill.
              </h2>
            </div>
            <Button asChild size="lg" variant="secondary" className="h-13 rounded-full px-8 text-base">
              <Link to="/role">Choose your role</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:px-6">
          <p>© {new Date().getFullYear()} Mitra</p>
          <p>Care is better together.</p>
        </div>
      </footer>
    </div>
  );
}
