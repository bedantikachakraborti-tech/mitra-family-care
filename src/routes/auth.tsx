import { useState } from "react";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { MitraMark } from "@/components/mitra-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SoftCard } from "@/components/ui-kit";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/auth";

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
  const [mode, setMode] = useState<"signin" | "signup">(search.mode ?? "signup");
  const [role, setRole] = useState<AppRole>(search.role ?? "family");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

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
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({ id: data.user!.id, role, full_name: name.trim() }, { onConflict: "id" });
        if (profileError) throw new Error(profileError.message);
        toast.success("Welcome to Mitra.");
        navigate({ to: role === "caregiver" ? "/onboarding/caregiver" : "/onboarding/family" });
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

  return (
    <div className="min-h-screen bg-warm-gradient px-4 py-10">
      <div className="mx-auto max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <MitraMark className="h-10 w-10" />
          <span className="font-display text-xl font-semibold">Mitra</span>
        </Link>

        <SoftCard>
          <h1 className="text-2xl font-semibold">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signup"
              ? "Care is better together — let's set you up."
              : "Sign in to pick up where you left off."}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {mode === "signup" && (
              <>
                <div>
                  <p className="text-sm font-semibold">I'm joining as</p>
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
                        {option === "family" ? "Family / Care seeker" : "Caregiver"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="name">Your name</Label>
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
              <Label htmlFor="email">Email</Label>
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
              <Label htmlFor="password">Password</Label>
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
              {mode === "signup" ? "Create account" : "Sign in"}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "signup" ? "Already have an account?" : "New to Mitra?"}{" "}
            <button
              type="button"
              className="font-semibold text-primary underline"
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            >
              {mode === "signup" ? "Sign in" : "Create one"}
            </button>
          </p>
        </SoftCard>
      </div>
    </div>
  );
}
