import { useEffect, useState } from "react";
import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

export type AppRole = "family" | "caregiver";

export type Profile = {
  id: string;
  role: AppRole;
  full_name: string;
  location: string;
  phone: string;
  relationship: string;
  ui_language?: string;
};

/** Live Supabase session, kept in sync with sign in / sign out. */
export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setReady(true);
    });
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, user: session?.user ?? null, ready };
}

export const myProfileQuery = queryOptions({
  queryKey: ["profile", "me"],
  queryFn: async (): Promise<Profile | null> => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return null;
    const { data, error } = await supabase
      .from("profiles")
      .select("id, role, full_name, location, phone, relationship, ui_language")
      .eq("id", auth.user.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as Profile | null) ?? null;
  },
});

export function useMyProfile() {
  return useQuery(myProfileQuery);
}

/** The role that drives navigation; defaults to family until a profile exists. */
export function useRole(): AppRole {
  const profile = useMyProfile();
  return profile.data?.role ?? "family";
}

export async function saveProfile(input: Partial<Profile>) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("You need to be signed in.");
  const { error } = await supabase
    .from("profiles")
    .upsert({ ...input, id: auth.user.id }, { onConflict: "id" })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
}

export function useSignOut() {
  const queryClient = useQueryClient();
  return async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };
}
