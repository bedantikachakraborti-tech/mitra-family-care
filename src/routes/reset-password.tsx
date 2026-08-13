import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { MitraMark } from "@/components/mitra-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SoftCard } from "@/components/ui-kit";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Choose a new password — Mitra" },
      {
        name: "description",
        content: "Set a new password for your Mitra account and get back to your care circle.",
      },
      { property: "og:title", content: "Choose a new password — Mitra" },
      { property: "og:description", content: "Set a new password for your Mitra account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [hasLink, setHasLink] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  // The reset link signs the user in briefly so they can set a new password.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setHasLink(true);
    });
    void supabase.auth.getSession().then(({ data }) => {
      setHasLink(Boolean(data.session));
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password !== confirm) {
      toast.error("The two passwords don't match yet.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw new Error(error.message);
      toast.success("Password updated. You can sign in with it now.");
      await supabase.auth.signOut();
      navigate({ to: "/auth", search: { mode: "signin" } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-warm-gradient px-4 py-10">
      <div className="mx-auto max-w-md">
        <Link to="/" className="mb-8 flex items-center gap-2">
          <MitraMark className="h-10 w-10" />
          <span className="font-display text-xl font-semibold">Mitra</span>
        </Link>

        <SoftCard>
          <h1 className="text-2xl font-semibold">Choose a new password</h1>

          {!ready ? (
            <p className="mt-3 text-sm text-muted-foreground">One moment…</p>
          ) : !hasLink ? (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                This page works from the link in your password reset email. Open that link again, or
                request a new one from the sign-in page.
              </p>
              <Button asChild size="lg" className="mt-5 h-12 w-full rounded-full">
                <Link to="/auth" search={{ mode: "signin" }}>
                  Back to sign in
                </Link>
              </Button>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  className="mt-2 h-12 rounded-2xl"
                  required
                />
              </div>
              <div>
                <Label htmlFor="confirm-password">Repeat new password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  minLength={6}
                  className="mt-2 h-12 rounded-2xl"
                  required
                />
              </div>
              <Button type="submit" size="lg" disabled={busy} className="h-12 w-full rounded-full">
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
                Save new password
              </Button>
            </form>
          )}
        </SoftCard>
      </div>
    </div>
  );
}
