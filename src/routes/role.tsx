import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, HeartHandshake, Users } from "lucide-react";
import { MitraMark } from "@/components/mitra-mark";

export const Route = createFileRoute("/role")({
  head: () => ({
    meta: [
      { title: "Choose your role — Mitra" },
      {
        name: "description",
        content: "Join Mitra as a family arranging care, or as a caregiver offering it.",
      },
      { property: "og:title", content: "Choose your role — Mitra" },
      { property: "og:description", content: "Family or caregiver — start where you are." },
    ],
  }),
  component: RolePage,
});

const roles = [
  {
    to: "/onboarding/family",
    icon: Users,
    title: "I'm a family member",
    text: "Arrange care for a parent or relative, share the plan with siblings, and stay close to their day.",
    tone: "bg-sage text-sage-foreground",
  },
  {
    to: "/onboarding/caregiver",
    icon: HeartHandshake,
    title: "I'm a caregiver",
    text: "Build a profile, find families nearby, and keep your day organised with a plan that travels with you.",
    tone: "bg-honey text-honey-foreground",
  },
] as const;

function RolePage() {
  return (
    <div className="min-h-screen bg-warm-gradient px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link to="/" className="flex items-center gap-2">
          <MitraMark className="h-10 w-10" />
          <span className="font-display text-xl font-semibold">Mitra</span>
        </Link>

        <h1 className="mt-10 text-3xl font-semibold sm:text-4xl">Welcome. Who are you here for?</h1>
        <p className="mt-3 text-muted-foreground">
          This just helps us set things up. You can always change it later.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {roles.map((role) => (
            <Link
              key={role.to}
              to={role.to}
              className="group flex min-h-56 flex-col rounded-3xl border border-border bg-card p-6 text-left shadow-soft transition-shadow hover:shadow-lift"
            >
              <span className={`grid h-12 w-12 place-items-center rounded-2xl ${role.tone}`}>
                <role.icon className="h-6 w-6" aria-hidden />
              </span>
              <h2 className="mt-5 text-xl font-semibold">{role.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{role.text}</p>
              <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-primary">
                Continue{" "}
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  aria-hidden
                />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
