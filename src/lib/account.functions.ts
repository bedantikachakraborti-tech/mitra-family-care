import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Permanently deletes the signed-in user's account.
 *
 * Family accounts: their own care requests, plans, tasks, logs, summaries and
 * match suggestions are removed with them.
 * Caregiver accounts: the caregiver profile is stripped of personal details and
 * detached from the account, so the families they worked with keep their own
 * plan and history without the caregiver retaining any access.
 */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ ok: true; notes: string[] }> => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const notes: string[] = [];

    const fail = (label: string, error: { message: string } | null) => {
      if (error) throw new Error(`${label}: ${error.message}`);
    };

    /** In-app notification; the unique dedupe key makes retries harmless. */
    const notify = async (input: {
      userId: string | null | undefined;
      requestId: string;
      title: string;
      body: string;
      link: string;
      dedupeKey: string;
    }) => {
      if (!input.userId) return;
      const { error } = await supabaseAdmin.from("notifications").insert({
        user_id: input.userId,
        request_id: input.requestId,
        kind: "unmatched",
        title: input.title,
        body: input.body,
        link: input.link,
        dedupe_key: input.dedupeKey,
      });
      if (error && !error.message.includes("duplicate")) {
        throw new Error(`Notifying your care circle: ${error.message}`);
      }
    };

    /** Ends an active match and tells the other side, before anything is removed. */
    const endMatch = async (
      request: { id: string },
      counterpartUserId: string | null | undefined,
      side: "family" | "caregiver",
    ) => {
      fail(
        "Ending the care connection",
        (
          await supabaseAdmin
            .from("care_requests")
            .update({
              match_status: "unmatched",
              unmatched_at: new Date().toISOString(),
              unmatched_by: userId,
            })
            .eq("id", request.id)
        ).error,
      );
      await notify({
        userId: counterpartUserId,
        requestId: request.id,
        title: "Your care connection has ended",
        body:
          side === "family"
            ? "Your care connection has ended. You can choose a new caregiver from your matches."
            : "Your care connection has ended.",
        link: side === "family" ? "/family/matches" : "/caregiver",
        dedupeKey: `unmatched:${request.id}`,
      });
    };


    // 1. Caregiver profile — anonymise, never delete shared history.
    const { data: caregivers, error: caregiverError } = await supabaseAdmin
      .from("caregivers")
      .select("id")
      .eq("user_id", userId);
    fail("Reading caregiver profile", caregiverError);

    for (const caregiver of caregivers ?? []) {
      // End any active connection and tell the family before unlinking.
      const { data: activeRequests, error: activeError } = await supabaseAdmin
        .from("care_requests")
        .select("id, family_user_id")
        .eq("selected_caregiver_id", caregiver.id)
        .eq("match_status", "active");
      fail("Reading active care connections", activeError);
      for (const request of activeRequests ?? []) {
        await endMatch(request, request.family_user_id, "family");
      }

      const { error } = await supabaseAdmin
        .from("caregivers")
        .update({
          user_id: null,
          name: "Former caregiver",
          initials: "—",
          headline: "",
          about: "",
          area: "",
          availability: "",
          preferred_hours: "",
          languages: [],
          skills: [],
          specialties: [],
          certifications: [],
        })
        .eq("id", caregiver.id);
      fail("Removing caregiver details", error);
      notes.push(
        "Care plans you were matched to stay with the family; your profile details were removed and unlinked.",
      );
    }

    // 2. Family-owned data — delete children before parents.
    const { data: requests, error: requestError } = await supabaseAdmin
      .from("care_requests")
      .select("id")
      .eq("family_user_id", userId);
    fail("Reading care requests", requestError);

    const requestIds = (requests ?? []).map((r) => r.id);
    if (requestIds.length > 0) {
      const { data: plans, error: planError } = await supabaseAdmin
        .from("care_plans")
        .select("id")
        .in("request_id", requestIds);
      fail("Reading care plans", planError);

      const planIds = (plans ?? []).map((p) => p.id);
      if (planIds.length > 0) {
        const { data: tasks, error: taskError } = await supabaseAdmin
          .from("care_tasks")
          .select("id")
          .in("plan_id", planIds);
        fail("Reading care tasks", taskError);

        const taskIds = (tasks ?? []).map((t) => t.id);
        if (taskIds.length > 0) {
          fail(
            "Deleting task records",
            (await supabaseAdmin.from("task_logs").delete().in("task_id", taskIds)).error,
          );
          fail(
            "Deleting tasks",
            (await supabaseAdmin.from("care_tasks").delete().in("id", taskIds)).error,
          );
        }
        fail(
          "Deleting day summaries",
          (await supabaseAdmin.from("day_summaries").delete().in("plan_id", planIds)).error,
        );
        fail(
          "Deleting care plans",
          (await supabaseAdmin.from("care_plans").delete().in("id", planIds)).error,
        );
      }

      fail(
        "Deleting match suggestions",
        (await supabaseAdmin.from("caregiver_matches").delete().in("request_id", requestIds)).error,
      );
      fail(
        "Deleting care requests",
        (await supabaseAdmin.from("care_requests").delete().in("id", requestIds)).error,
      );
    }

    // 3. Profile row, then the auth account itself.
    fail("Deleting profile", (await supabaseAdmin.from("profiles").delete().eq("id", userId)).error);

    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) throw new Error(`Deleting the account: ${authError.message}`);

    return { ok: true, notes };
  });
