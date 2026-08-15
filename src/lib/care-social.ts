import { useEffect } from "react";
import { queryOptions, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { AppNotification, Message, Review } from "./care-types";

function unwrap<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data as T;
}

async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("You need to be signed in.");
  return data.user.id;
}

/* -------------------------------- messages -------------------------------- */

export function messagesQuery(requestId: string | undefined) {
  return queryOptions({
    queryKey: ["messages", requestId ?? "none"],
    enabled: Boolean(requestId),
    queryFn: async (): Promise<Message[]> =>
      (unwrap(
        await supabase
          .from("messages")
          .select("*")
          .eq("request_id", requestId!)
          .order("created_at", { ascending: true })
          .limit(500),
      ) as Message[]) ?? [],
  });
}

export async function sendMessage(requestId: string, body: string) {
  const text = body.trim();
  if (!text) return;
  const userId = await currentUserId();
  unwrap(
    await supabase
      .from("messages")
      .insert({ request_id: requestId, sender_user_id: userId, body: text })
      .select("id")
      .single(),
  );
}

/** Marks every message from the other person as read. */
export async function markMessagesRead(requestId: string) {
  const userId = await currentUserId();
  const { error } = await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("request_id", requestId)
    .neq("sender_user_id", userId)
    .is("read_at", null);
  if (error) throw new Error(error.message);
}

export function unreadMessageCount(messages: Message[], myUserId: string | null): number {
  if (!myUserId) return 0;
  return messages.filter((m) => m.sender_user_id !== myUserId && !m.read_at).length;
}

/* ------------------------------ notifications ------------------------------ */

export const notificationsQuery = queryOptions({
  queryKey: ["notifications"],
  queryFn: async (): Promise<AppNotification[]> =>
    (unwrap(
      await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
    ) as AppNotification[]) ?? [],
});

/**
 * Creates a notification for the other side of a match. Silently ignores
 * duplicates so the same event never notifies twice.
 */
export async function notifyCounterpart(input: {
  requestId: string;
  counterpartUserId: string | null | undefined;
  kind: string;
  title: string;
  body?: string;
  link?: string;
  dedupeKey: string;
}) {
  if (!input.counterpartUserId) return;
  const { error } = await supabase.from("notifications").insert({
    user_id: input.counterpartUserId,
    request_id: input.requestId,
    kind: input.kind,
    title: input.title,
    body: input.body ?? "",
    link: input.link ?? "",
    dedupe_key: input.dedupeKey,
  });
  // 23505 = duplicate dedupe key: the event was already announced.
  if (error && !error.message.includes("duplicate")) throw new Error(error.message);
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function markAllNotificationsRead() {
  const userId = await currentUserId();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
  if (error) throw new Error(error.message);
}

/* --------------------------------- reviews -------------------------------- */

export function reviewsAboutQuery(userId: string | null | undefined) {
  return queryOptions({
    queryKey: ["reviews", "about", userId ?? "none"],
    enabled: Boolean(userId),
    queryFn: async (): Promise<Review[]> =>
      (unwrap(
        await supabase
          .from("reviews")
          .select("*")
          .eq("reviewee_user_id", userId!)
          .order("created_at", { ascending: false }),
      ) as Review[]) ?? [],
  });
}

export function reviewsForRequestQuery(requestId: string | undefined) {
  return queryOptions({
    queryKey: ["reviews", "request", requestId ?? "none"],
    enabled: Boolean(requestId),
    queryFn: async (): Promise<Review[]> =>
      (unwrap(
        await supabase.from("reviews").select("*").eq("request_id", requestId!),
      ) as Review[]) ?? [],
  });
}

export async function saveReview(input: {
  requestId: string;
  revieweeUserId: string;
  rating: number;
  comment: string;
  categories: string[];
  existingId?: string | undefined;
}) {
  const userId = await currentUserId();
  if (input.existingId) {
    unwrap(
      await supabase
        .from("reviews")
        .update({
          rating: input.rating,
          comment: input.comment,
          categories: input.categories,
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.existingId)
        .select("id")
        .single(),
    );
    return;
  }
  unwrap(
    await supabase
      .from("reviews")
      .insert({
        request_id: input.requestId,
        reviewer_user_id: userId,
        reviewee_user_id: input.revieweeUserId,
        rating: input.rating,
        comment: input.comment,
        categories: input.categories,
      })
      .select("id")
      .single(),
  );
}

/* -------------------------------- realtime -------------------------------- */

/** Keeps messages and notifications fresh while a screen is open. */
export function useCareRealtime(requestId: string | null | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase.channel(`mitra-live-${requestId ?? "me"}`);

    if (requestId) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `request_id=eq.${requestId}` },
        () => void queryClient.invalidateQueries({ queryKey: ["messages"] }),
      );
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table: "task_logs" },
        () => void queryClient.invalidateQueries({ queryKey: ["task-logs"] }),
      );
    }

    channel.on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () =>
      void queryClient.invalidateQueries({ queryKey: ["notifications"] }),
    );

    channel.subscribe();
    return () => void supabase.removeChannel(channel);
  }, [requestId, queryClient]);
}
