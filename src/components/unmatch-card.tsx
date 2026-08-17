import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { HeartOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { SectionTitle, SoftCard } from "@/components/ui-kit";
import { unmatchRequest } from "@/lib/care-data";
import { notifyCounterpart } from "@/lib/care-social";

/**
 * Ends an active care connection from either side, after an explicit
 * confirmation. Nothing historical is deleted — only the relationship ends.
 */
export function UnmatchCard({
  requestId,
  otherName,
  role,
}: {
  requestId: string;
  otherName: string;
  role: "family" | "caregiver";
}) {
  const [confirming, setConfirming] = useState(false);
  const queryClient = useQueryClient();

  const end = useMutation({
    mutationFn: async () => {
      const counterpartUserId = await unmatchRequest(requestId);
      await notifyCounterpart({
        requestId,
        counterpartUserId,
        kind: "unmatched",
        title: "Your care connection has ended",
        // The recipient is the other side of the match.
        body:
          role === "family"
            ? "Your care connection has ended."
            : "Your care connection has ended. You can choose a new caregiver from your matches.",
        link: role === "family" ? "/caregiver" : "/family/matches",
        // One notification per unmatch event, so a refresh never duplicates it.
        dedupeKey: `unmatched:${requestId}`,
      });
    },
    onSuccess: async () => {
      setConfirming(false);
      await queryClient.invalidateQueries();
      toast.success("Your care connection has ended.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <SoftCard>
      <SectionTitle hint="Records are kept">End this care connection</SectionTitle>
      <p className="text-sm text-muted-foreground">
        Unmatching ends the active care connection with {otherName}. Past tasks, notes, messages and
        reviews stay saved as historical records — no new care tasks flow through this connection
        afterwards.
      </p>

      {!confirming ? (
        <Button
          variant="outline"
          size="lg"
          className="mt-5 h-12 rounded-full border-destructive text-destructive hover:bg-destructive/10"
          onClick={() => setConfirming(true)}
        >
          <HeartOff className="mr-2 h-4 w-4" aria-hidden /> Unmatch…
        </Button>
      ) : (
        <div className="mt-5 rounded-2xl border border-destructive/40 bg-destructive/5 p-4">
          <p className="text-sm font-semibold">Are you sure you want to unmatch?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            This will end your active care connection with this person.
          </p>
          <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row">
            <Button
              variant="ghost"
              size="lg"
              className="h-12 rounded-full"
              onClick={() => setConfirming(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="lg"
              className="h-12 rounded-full px-6"
              disabled={end.isPending}
              onClick={() => end.mutate()}
            >
              {end.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
              Unmatch
            </Button>
          </div>
        </div>
      )}
    </SoftCard>
  );
}
