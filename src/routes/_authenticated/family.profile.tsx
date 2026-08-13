import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { DeleteAccountCard } from "@/components/delete-account";
import { VoiceIntake } from "@/components/voice-intake";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionTitle, SoftCard } from "@/components/ui-kit";
import { structureFamilyProfile } from "@/lib/ai.functions";
import { saveProfile, useMyProfile } from "@/lib/auth";
import { languageName, useLanguage } from "@/lib/i18n";

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

type FamilyForm = { full_name: string; location: string; phone: string; relationship: string };

function FamilyProfilePage() {
  const profile = useMyProfile();
  const queryClient = useQueryClient();
  const { lang: uiLang } = useLanguage();
  const [form, setForm] = useState<FamilyForm>({
    full_name: "",
    location: "",
    phone: "",
    relationship: "",
  });
  const [loaded, setLoaded] = useState(false);
  const [story, setStory] = useState("");
  const [draft, setDraft] = useState<FamilyForm | null>(null);
  const extractProfile = useServerFn(structureFamilyProfile);

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

  const extract = useMutation({
    mutationFn: (description: string) =>
      extractProfile({ data: { description, outputLanguage: languageName(uiLang) } }),
    onSuccess: (result) => {
      setDraft({
        full_name: result.fullName || form.full_name,
        relationship: result.relationship || form.relationship,
        location: result.location || form.location,
        phone: result.phone || form.phone,
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const save = useMutation({
    mutationFn: () => saveProfile({ ...form, role: "family" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile saved.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const set = (key: keyof FamilyForm, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <AppShell
      role="family"
      title="My profile"
      subtitle="Only what Mitra needs to keep your care circle connected."
    >
      <SoftCard tone="sage">
        <SectionTitle hint="Optional">Say it instead of typing</SectionTitle>
        <p className="text-sm opacity-90">
          Speak in the language you're most comfortable with — English, हिन्दी, বাংলা or தமிழ்.
          Mitra fills the fields back in {languageName(uiLang)} and keeps names and neighbourhoods
          exactly as you said them. Nothing is saved until you review and confirm.
        </p>
        <div className="mt-4">
          <VoiceIntake
            value={story}
            onChange={setStory}
            placeholder="I'm Anita Ramesh, I look after my mother. We live in Indiranagar, Bengaluru, and my number is +91 98xxx xxxxx."
          />
        </div>
        <div className="mt-3">
          <Button
            type="button"
            size="lg"
            className="h-12 rounded-full px-6"
            disabled={extract.isPending || story.trim().length < 5}
            onClick={() => extract.mutate(story)}
          >
            {extract.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" aria-hidden />
            )}
            Fill in my details
          </Button>
        </div>
      </SoftCard>

      {draft && (
        <SoftCard tone="honey">
          <SectionTitle hint="Review before it fills the form">
            Suggested from what you said
          </SectionTitle>
          <ul className="space-y-1 text-sm opacity-90">
            {draft.full_name && <li>Name: {draft.full_name}</li>}
            {draft.relationship && <li>Relationship: {draft.relationship}</li>}
            {draft.location && <li>Neighbourhood: {draft.location}</li>}
            {draft.phone && <li>Phone: {draft.phone}</li>}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              size="lg"
              className="h-12 rounded-full px-6"
              onClick={() => {
                setForm(draft);
                setDraft(null);
                toast.success("Added to the form — edit anything before saving.");
              }}
            >
              Use these details
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="h-12 rounded-full"
              onClick={() => setDraft(null)}
            >
              Discard
            </Button>
          </div>
        </SoftCard>
      )}

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

      <DeleteAccountCard />
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
