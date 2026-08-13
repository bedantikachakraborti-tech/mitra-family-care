import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { LanguageSelect } from "@/components/language-select";
import { MitraMark } from "@/components/mitra-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SoftCard } from "@/components/ui-kit";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";

const searchSchema = z.object({
  role: z.enum(["family", "caregiver"]).optional(),
  mode: z.enum(["signin", "signup"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in or create an account — Mitra" },
      {
        name: "description",
        content:
          "Create your Mitra account as a family or a caregiver, and come back to your own care plan whenever you need it.",
      },
      { property: "og:title", content: "Sign in to Mitra" },
      { property: "og:description", content: "Your care circle, waiting where you left it." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">(search.mode ?? "signup");
  const [role, setRole] = useState<AppRole>(search.role ?? "family");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetSent, setResetSent] = useState(false);


  // The role comes from the landing page or role picker, so we don't ask twice.
  const rolePreselected = Boolean(search.role);

  useEffect(() => {
    if (search.role) setRole(search.role);
  }, [search.role]);

  async function afterSignIn() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();
    const nextRole = (profile?.role as AppRole | undefined) ?? role;
    navigate({ to: nextRole === "caregiver" ? "/caregiver/profile" : "/family" });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "forgot") {
        // Always show the same confirmation, so this can't be used to discover accounts.
        await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        setResetSent(true);
        return;
      }


      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw new Error(error.message);
        if (!data.session) {
          toast.success("Check your email to confirm your account, then sign in.");
          setMode("signin");
          return;
        }
        const { error: profileError } = await supabase.from("profiles").upsert(
          { id: data.user!.id, role, full_name: name.trim(), ui_language: lang },
          { onConflict: "id" },
        );
        if (profileError) throw new Error(profileError.message);
        toast.success("Welcome to Mitra.");
        navigate({ to: role === "caregiver" ? "/caregiver/profile" : "/onboarding/family" });
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw new Error(error.message);
      await afterSignIn();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const roleLabel = role === "caregiver" ? t("role.caregiver") : t("role.family");

  return (
    <div className="min-h-screen bg-warm-gradient px-4 py-10">
      <div className="mx-auto max-w-md">
        <div className="mb-8 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2">
            <MitraMark className="h-10 w-10" />
            <span className="font-display text-xl font-semibold">Mitra</span>
          </Link>
          <LanguageSelect />
        </div>

        <SoftCard>
          <h1 className="text-2xl font-semibold">
            {mode === "signup" ? t("auth.createTitle") : t("auth.signInTitle")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signup" ? t("auth.createSub") : t("auth.signInSub")}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {mode === "signup" && (
              <>
                {rolePreselected ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-secondary px-4 py-3">
                    <p className="text-sm font-medium">{roleLabel}</p>
                    <Link
                      to="/role"
                      className="text-sm font-semibold text-primary underline"
                    >
                      {t("auth.changeRole")}
                    </Link>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-semibold">{t("auth.joiningAs")}</p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {(["family", "caregiver"] as const).map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setRole(option)}
                          aria-pressed={role === option}
                          className={`min-h-12 rounded-2xl border px-3 text-sm font-medium transition-colors ${
                            role === option
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-card hover:bg-secondary"
                          }`}
                        >
                          {option === "family" ? t("role.family") : t("role.caregiver")}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="name">{t("auth.name")}</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Anita Ramesh"
                    className="mt-2 h-12 rounded-2xl"
                    required
                  />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 h-12 rounded-2xl"
                required
              />
            </div>

            <div>
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                className="mt-2 h-12 rounded-2xl"
                required
              />
            </div>

            <Button type="submit" size="lg" disabled={busy} className="h-13 w-full rounded-full">
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
              {mode === "signup" ? t("auth.createAccount") : t("action.signIn")}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "signup" ? t("auth.haveAccount") : t("auth.noAccount")}{" "}
            <button
              type="button"
              className="font-semibold text-primary underline"
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            >
              {mode === "signup" ? t("action.signIn") : t("auth.createOne")}
            </button>
          </p>
        </SoftCard>
      </div>
    </div>
  );
}
