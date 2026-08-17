import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

import { useMyProfile } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/care-plan")({
  head: () => ({
    meta: [
      { title: "Care plan — Mitra" },
      {
        name: "description",
        content:
          "Opens the right care plan for you: the family editor, or the caregiver's daily checklist.",
      },
      { property: "og:title", content: "Care plan — Mitra" },
      {
        property: "og:description",
        content: "One entry point to the shared care plan for families and caregivers.",
      },
    ],
  }),
  component: CarePlanRedirect,
});

function CarePlanRedirect() {
  const profile = useMyProfile();

  if (profile.isLoading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Opening your care plan…
        </p>
      </div>
    );
  }

  return profile.data?.role === "caregiver" ? (
    <Navigate to="/care-caregiver" replace />
  ) : (
    <Navigate to="/care-family" replace />
  );
}
