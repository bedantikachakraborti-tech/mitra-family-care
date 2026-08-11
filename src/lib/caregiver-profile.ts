import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Caregiver } from "./care-types";

export type CaregiverProfileInput = {
  name: string;
  initials: string;
  headline: string;
  about: string;
  years_experience: number;
  languages: string[];
  skills: string[];
  specialties: string[];
  certifications: string[];
  area: string;
  availability: string;
  hourly_rate: number;
};

export const emptyCaregiverProfile: CaregiverProfileInput = {
  name: "",
  initials: "",
  headline: "",
  about: "",
  years_experience: 0,
  languages: [],
  skills: [],
  specialties: [],
  certifications: [],
  area: "",
  availability: "",
  hourly_rate: 0,
};

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** The caregiver record belonging to the signed-in user, if they have one. */
export const myCaregiverQuery = queryOptions({
  queryKey: ["caregiver", "me"],
  queryFn: async (): Promise<Caregiver | null> => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return null;
    const { data, error } = await supabase
      .from("caregivers")
      .select("*")
      .eq("user_id", auth.user.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as Caregiver | null) ?? null;
  },
});

/** Creates the caregiver record on first save, and updates the same one afterwards. */
export async function saveMyCaregiverProfile(input: CaregiverProfileInput): Promise<Caregiver> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("You need to be signed in.");

  const payload = {
    ...input,
    initials: input.initials || initialsOf(input.name),
    user_id: auth.user.id,
  };

  const { data: existing, error: readError } = await supabase
    .from("caregivers")
    .select("id")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (readError) throw new Error(readError.message);

  const result = existing
    ? await supabase.from("caregivers").update(payload).eq("id", existing.id).select("*").single()
    : await supabase.from("caregivers").insert(payload).select("*").single();

  if (result.error) throw new Error(result.error.message);
  return result.data as Caregiver;
}
