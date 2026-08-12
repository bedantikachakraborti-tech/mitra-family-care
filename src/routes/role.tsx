import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, HeartHandshake, Users } from "lucide-react";

import { LanguageSelect } from "@/components/language-select";
import { MitraMark } from "@/components/mitra-mark";
import { useT } from "@/lib/i18n";

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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RolePage,
});

const roles = [
  {
    role: "family" as const,
    icon: Users,
    titleKey: "role.family",
    textKey: "role.familyText",
    tone: "bg-sage text-sage-foreground",
  },
  {
    role: "caregiver" as const,
    icon: HeartHandshake,
    titleKey: "role.caregiver",
    textKey: "role.caregiverText",
    tone: "bg-honey text-honey-foreground",
  },
];

function RolePage() {
  const t = useT();

  return (
    <div className="min-h-screen bg-warm-gradient px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2">
            <MitraMark className="h-10 w-10" />
            <span className="font-display text-xl font-semibold">Mitra</span>
          </Link>
          <LanguageSelect />
        </div>

        <h1 className="mt-10 text-3xl font-semibold sm:text-4xl">{t("role.title")}</h1>
        <p className="mt-3 text-muted-foreground">{t("role.sub")}</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {roles.map((option) => (
            <Link
              key={option.role}
              to="/auth"
              search={{ role: option.role, mode: "signup" }}
              className="group flex min-h-56 flex-col rounded-3xl border border-border bg-card p-6 text-left shadow-soft transition-shadow hover:shadow-lift"
            >
              <span className={`grid h-12 w-12 place-items-center rounded-2xl ${option.tone}`}>
                <option.icon className="h-6 w-6" aria-hidden />
              </span>
              <h2 className="mt-5 text-xl font-semibold">{t(option.titleKey)}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{t(option.textKey)}</p>
              <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-primary">
                {t("action.continue")}{" "}
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  aria-hidden
                />
              </span>
            </Link>
          ))}
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          {t("auth.haveAccount")}{" "}
          <Link to="/auth" search={{ mode: "signin" }} className="font-semibold text-primary underline">
            {t("action.signIn")}
          </Link>
        </p>
      </div>
    </div>
  );
}
