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

    // 1. Caregiver profile — anonymise, never delete shared history.
    const { data: caregivers, error: caregiverError } = await supabaseAdmin
      .from("caregivers")
      .select("id")
      .eq("user_id", userId);
    fail("Reading caregiver profile", caregiverError);

    for (const caregiver of caregivers ?? []) {
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
