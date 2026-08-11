import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionTitle, SoftCard } from "@/components/ui-kit";
import { saveProfile, useMyProfile } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/family/profile")({
  head: () => ({
    meta: [
      { title: "My family profile — Mitra" },
      {
        name: "description",
        content: "Keep your name, neighbourhood and contact details up to date on Mitra.",
      },
      { property: "og:title", content: "My family profile — Mitra" },
      { property: "og:description", content: "Your details, kept simple and in your control." },
    ],
  }),
  component: FamilyProfilePage,
});

function FamilyProfilePage() {
  const profile = useMyProfile();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ full_name: "", location: "", phone: "", relationship: "" });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded || !profile.data) return;
    setForm({
      full_name: profile.data.full_name ?? "",
      location: profile.data.location ?? "",
      phone: profile.data.phone ?? "",
      relationship: profile.data.relationship ?? "",
    });
    setLoaded(true);
  }, [profile.data, loaded]);

  const save = useMutation({
    mutationFn: () => saveProfile({ ...form, role: "family" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile saved.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <AppShell
      role="family"
      title="My profile"
      subtitle="Only what Mitra needs to keep your care circle connected."
    >
      <SoftCard>
        <SectionTitle hint="You can change this any time">Your details</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" value={form.full_name} onChange={(v) => set("full_name", v)} />
          <Field
            label="Relationship to the person you care for"
            value={form.relationship}
            onChange={(v) => set("relationship", v)}
            placeholder="Daughter"
          />
          <Field
            label="Neighbourhood"
            value={form.location}
            onChange={(v) => set("location", v)}
            placeholder="Indiranagar, Bengaluru"
          />
          <Field
            label="Phone"
            value={form.phone}
            onChange={(v) => set("phone", v)}
            placeholder="+91 98xxx xxxxx"
          />
        </div>
        <div className="mt-6 flex justify-end">
          <Button
            size="lg"
            className="h-12 rounded-full px-6"
            disabled={save.isPending}
            onClick={() => save.mutate()}
          >
            {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
            Save profile
          </Button>
        </div>
      </SoftCard>
    </AppShell>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const id = label.toLowerCase().replace(/[^a-z]+/g, "-");
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-12 rounded-2xl"
      />
    </div>
  );
}
