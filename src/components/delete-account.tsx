import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionTitle, SoftCard } from "@/components/ui-kit";
import { supabase } from "@/integrations/supabase/client";
import { deleteMyAccount } from "@/lib/account.functions";

const CONFIRM_WORD = "DELETE";

/** Intentional, two-step account deletion. Nothing happens on a single click. */
export function DeleteAccountCard() {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const remove = useServerFn(deleteMyAccount);

  const del = useMutation({
    mutationFn: () => remove({ data: undefined }),
    onSuccess: async (result) => {
      for (const note of result.notes) toast.message(note);
      await supabase.auth.signOut();
      window.location.href = "/";
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <SoftCard>
      <SectionTitle hint="This cannot be undone">Delete my account</SectionTitle>
      <p className="text-sm text-muted-foreground">
        Deleting your account removes your sign-in, your profile and the personal details you added
        here. Care plans and history that belong to someone else in your care circle stay with them,
        and you will no longer have access to them.
      </p>

      {!open ? (
        <Button
          variant="outline"
          size="lg"
          className="mt-5 h-12 rounded-full border-destructive text-destructive hover:bg-destructive/10"
          onClick={() => setOpen(true)}
        >
          <AlertTriangle className="mr-2 h-4 w-4" aria-hidden /> Delete account…
        </Button>
      ) : (
        <div className="mt-5 rounded-2xl border border-destructive/40 bg-destructive/5 p-4">
          <p className="text-sm font-medium">
            Type {CONFIRM_WORD} to confirm you want your account and personal data deleted.
          </p>
          <Label htmlFor="confirm-delete" className="sr-only">
            Type {CONFIRM_WORD} to confirm
          </Label>
          <Input
            id="confirm-delete"
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            placeholder={CONFIRM_WORD}
            className="mt-3 h-12 rounded-2xl bg-card"
          />
          <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row">
            <Button
              variant="ghost"
              size="lg"
              className="h-12 rounded-full"
              onClick={() => {
                setOpen(false);
                setConfirmText("");
              }}
            >
              Keep my account
            </Button>
            <Button
              variant="destructive"
              size="lg"
              className="h-12 rounded-full px-6"
              disabled={confirmText.trim() !== CONFIRM_WORD || del.isPending}
              onClick={() => del.mutate()}
            >
              {del.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
              Permanently delete my account
            </Button>
          </div>
        </div>
      )}
    </SoftCard>
  );
}
