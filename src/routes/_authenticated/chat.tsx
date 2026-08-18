import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SoftCard } from "@/components/ui-kit";
import { useRole, useSession } from "@/lib/auth";
import { counterpartQuery } from "@/lib/care-data";
import {
  markMessagesRead,
  messagesQuery,
  notifyCounterpart,
  sendMessage,
  useCareRealtime,
} from "@/lib/care-social";
import { useCareContext } from "@/lib/use-care";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({
    meta: [
      { title: "Messages — Mitra" },
      {
        name: "description",
        content: "A private conversation between the family and their matched caregiver.",
      },
      { property: "og:title", content: "Messages — Mitra" },
      { property: "og:description", content: "Private messages inside your care circle." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  const role = useRole();
  const queryClient = useQueryClient();
  const { user } = useSession();
  const { request, matchedCaregiver: caregiver } = useCareContext();
  const requestId = request?.id;
  const active = request?.match_status === "active";

  const { data: messages = [], isLoading } = useQuery(messagesQuery(requestId));
  const counterpart = useQuery(counterpartQuery(requestId));
  useCareRealtime(requestId);

  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  const unreadFromOther = useMemo(
    () => messages.some((m) => m.sender_user_id !== user?.id && !m.read_at),
    [messages, user?.id],
  );

  useEffect(() => {
    if (requestId && unreadFromOther) {
      void markMessagesRead(requestId).then(() =>
        queryClient.invalidateQueries({ queryKey: ["messages"] }),
      );
    }
  }, [requestId, unreadFromOther, queryClient]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const send = useMutation({
    mutationFn: async (body: string) => {
      if (!requestId) throw new Error("No care circle yet.");
      await sendMessage(requestId, body);
      await notifyCounterpart({
        requestId,
        counterpartUserId: counterpart.data,
        kind: "message",
        title: "New message",
        body: body.slice(0, 120),
        link: "/chat",
        dedupeKey: `message-${requestId}-${Date.now()}`,
      });
    },
    onSuccess: () => {
      setDraft("");
      void queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const title = role === "caregiver" ? "Messages with the family" : "Messages";
  const subtitle = caregiver ? `With ${caregiver.name}` : request?.person_name || "";

  if (!request || !request.selected_caregiver_id) {
    return (
      <AppShell role={role} title={title}>
        <SoftCard>
          <p className="text-sm text-muted-foreground">
            Messaging opens once a family and a caregiver are matched.
          </p>
          {role === "family" && (
            <Button asChild size="lg" className="mt-5 h-12 rounded-full px-6">
              <Link to="/family/matches">See suggested caregivers</Link>
            </Button>
          )}
        </SoftCard>
      </AppShell>
    );
  }

  return (
    <AppShell role={role} title={title} subtitle={subtitle}>
      <SoftCard className="flex min-h-[50vh] flex-col">
        {isLoading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Loading the conversation…
          </p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No messages yet. Say hello — this conversation stays between the two of you.
          </p>
        ) : (
          <ul className="flex-1 space-y-3 overflow-y-auto">
            {messages.map((m) => {
              const mine = m.sender_user_id === user?.id;
              return (
                <li key={m.id} className={mine ? "flex justify-end" : "flex justify-start"}>
                  <div
                    className={`max-w-[85%] rounded-3xl px-4 py-2.5 text-sm ${
                      mine
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                    <p className="mt-1 text-[11px] opacity-70">
                      {new Date(m.created_at).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                      {mine && (m.read_at ? " · Read" : " · Sent")}
                    </p>
                  </div>
                </li>
              );
            })}
            <div ref={endRef} />
          </ul>
        )}
      </SoftCard>

      {active ? (
        <SoftCard>
          <label htmlFor="chat-message" className="sr-only">
            Write a message
          </label>
          <Textarea
            id="chat-message"
            rows={3}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Write a message…"
            className="rounded-2xl"
          />
          <div className="mt-3 flex justify-end">
            <Button
              size="lg"
              className="h-12 rounded-full px-6"
              disabled={send.isPending || draft.trim().length === 0}
              onClick={() => send.mutate(draft.trim())}
            >
              {send.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Send className="mr-2 h-4 w-4" aria-hidden />
              )}
              Send
            </Button>
          </div>
        </SoftCard>
      ) : (
        <SoftCard tone="muted">
          <p className="text-sm text-muted-foreground">
            This match has ended. The conversation stays here to read, and new messages are turned
            off.
          </p>
        </SoftCard>
      )}
    </AppShell>
  );
}
