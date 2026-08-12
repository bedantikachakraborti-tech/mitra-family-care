import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, Loader2, MapPin, Mic, MicOff, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pill, SectionTitle, SoftCard } from "@/components/ui-kit";
import { structureCaregiverProfile } from "@/lib/ai.functions";
import {
  emptyCaregiverProfile,
  initialsOf,
  myCaregiverQuery,
  saveMyCaregiverProfile,
  type CaregiverProfileInput,
} from "@/lib/caregiver-profile";
import { languageName, speechLocale, useLanguage } from "@/lib/i18n";
import { useSpeechInput } from "@/lib/use-speech-input";

export const Route = createFileRoute("/_authenticated/caregiver/profile")({
  head: () => ({
    meta: [
      { title: "My caregiver profile — Mitra" },
      {
        name: "description",
        content:
          "Create and edit your Mitra caregiver profile: experience, skills, languages, specialties, certifications, availability and location.",
      },
      { property: "og:title", content: "My caregiver profile — Mitra" },
      { property: "og:description", content: "How families get to know you on Mitra." },
    ],
  }),
  component: CaregiverProfilePage,
});

const LANGUAGE_CHOICES = [
  { code: "en-IN", label: "English" },
  { code: "hi-IN", label: "हिन्दी" },
  { code: "kn-IN", label: "ಕನ್ನಡ" },
  { code: "ml-IN", label: "മലയാളം" },
  { code: "ta-IN", label: "தமிழ்" },
  { code: "mr-IN", label: "मराठी" },
];

function listToText(values: string[]) {
  return values.join(", ");
}
function textToList(value: string) {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function CaregiverProfilePage() {
  const queryClient = useQueryClient();
  const existing = useQuery(myCaregiverQuery);
  const [form, setForm] = useState<CaregiverProfileInput>(emptyCaregiverProfile);
  const [loaded, setLoaded] = useState(false);
  const [story, setStory] = useState("");
  const { lang: uiLang } = useLanguage();
  const [lang, setLang] = useState(speechLocale(uiLang));
  const [draft, setDraft] = useState<CaregiverProfileInput | null>(null);
  const speech = useSpeechInput(lang);

  useEffect(() => {
    if (loaded || !existing.data) return;
    const c = existing.data;
    setForm({
      name: c.name,
      initials: c.initials,
      headline: c.headline,
      about: c.about,
      years_experience: c.years_experience,
      languages: c.languages ?? [],
      skills: c.skills ?? [],
      specialties: c.specialties ?? [],
      certifications: c.certifications ?? [],
      area: c.area,
      availability: c.availability,
      hourly_rate: c.hourly_rate,
    });
    setLoaded(true);
  }, [existing.data, loaded]);

  useEffect(() => {
    if (speech.transcript) setStory((prev) => (prev ? `${prev} ${speech.transcript}` : speech.transcript));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speech.transcript]);

  const extract = useMutation({
    mutationFn: (description: string) =>
      structureCaregiverProfile({ data: { description, outputLanguage: languageName(uiLang) } }),
    onSuccess: (result) => {
      setDraft({
        ...form,
        name: result.name || form.name,
        headline: result.headline || form.headline,
        about: result.about || form.about,
        years_experience: result.yearsExperience || form.years_experience,
        languages: result.languages.length ? result.languages : form.languages,
        skills: result.skills.length ? result.skills : form.skills,
        specialties: result.specialties.length ? result.specialties : form.specialties,
        certifications: result.certifications.length ? result.certifications : form.certifications,
        area: result.area || form.area,
        availability: result.availability || form.availability,
        hourly_rate: result.hourlyRate || form.hourly_rate,
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const save = useMutation({
    mutationFn: () => saveMyCaregiverProfile({ ...form, initials: initialsOf(form.name) }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["caregiver"] });
      void queryClient.invalidateQueries({ queryKey: ["caregivers"] });
      toast.success("Profile saved. Families will see this version.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const set = <K extends keyof CaregiverProfileInput>(key: K, value: CaregiverProfileInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const heading = useMemo(
    () => (existing.data ? "My profile" : "Create your profile"),
    [existing.data],
  );

  return (
    <AppShell
      role="caregiver"
      title={heading}
      subtitle="This is what families see before they reach out. Everything here stays yours to edit."
      action={
        <Button
          size="lg"
          className="h-12 rounded-full px-6"
          disabled={save.isPending || !form.name.trim()}
          onClick={() => save.mutate()}
        >
          {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
          Save profile
        </Button>
      }
    >
      <SoftCard tone="sage">
        <SectionTitle hint="Optional">Tell us in your own words</SectionTitle>
        <p className="text-sm opacity-90">
          Speak or type about your experience in the language you're most comfortable with. Mitra
          drafts the profile fields for you — nothing is saved until you review and confirm.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <select
            aria-label="Speaking language"
            value={lang}
            onChange={(event) => setLang(event.target.value)}
            className="h-11 rounded-2xl border border-border bg-card px-3 text-sm"
          >
            {LANGUAGE_CHOICES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
          {speech.supported && (
            <Button
              type="button"
              size="lg"
              variant={speech.listening ? "default" : "outline"}
              className="h-11 rounded-full"
              onClick={speech.listening ? speech.stop : speech.start}
            >
              {speech.listening ? (
                <MicOff className="mr-2 h-4 w-4" aria-hidden />
              ) : (
                <Mic className="mr-2 h-4 w-4" aria-hidden />
              )}
              {speech.listening ? "Stop recording" : "Speak about your experience"}
            </Button>
          )}
        </div>

        <Textarea
          rows={5}
          value={story}
          onChange={(event) => setStory(event.target.value)}
          placeholder="I've cared for elders for six years in Bengaluru. I speak Malayalam, Kannada and English, I'm good with mobility support and medication reminders, and I'm free on weekday mornings."
          className="mt-3 rounded-2xl bg-card"
        />
        <div className="mt-3">
          <Button
            type="button"
            size="lg"
            className="h-12 rounded-full px-6"
            disabled={extract.isPending || story.trim().length < 10}
            onClick={() => extract.mutate(story)}
          >
            {extract.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" aria-hidden />
            )}
            Draft my profile
          </Button>
        </div>
      </SoftCard>

      {draft && (
        <SoftCard tone="honey">
          <SectionTitle hint="Review before it fills the form">Suggested from what you said</SectionTitle>
          <ul className="space-y-1 text-sm opacity-90">
            {draft.headline && <li>Headline: {draft.headline}</li>}
            {draft.about && <li>About: {draft.about}</li>}
            {draft.years_experience > 0 && <li>Experience: {draft.years_experience} years</li>}
            {draft.languages.length > 0 && <li>Languages: {listToText(draft.languages)}</li>}
            {draft.skills.length > 0 && <li>Skills: {listToText(draft.skills)}</li>}
            {draft.specialties.length > 0 && <li>Specialties: {listToText(draft.specialties)}</li>}
            {draft.certifications.length > 0 && (
              <li>Certifications: {listToText(draft.certifications)}</li>
            )}
            {draft.area && <li>Location: {draft.area}</li>}
            {draft.availability && <li>Availability: {draft.availability}</li>}
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
        <SectionTitle hint="Every field stays editable">Your details</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Full name" value={form.name} onChange={(v) => set("name", v)} />
          <TextField
            label="Headline"
            value={form.headline}
            onChange={(v) => set("headline", v)}
            placeholder="Elder companion and mobility support"
          />
          <TextField
            label="Years of experience"
            type="number"
            value={String(form.years_experience)}
            onChange={(v) => set("years_experience", Number(v) || 0)}
          />
          <TextField
            label="Hourly rate (₹)"
            type="number"
            value={String(form.hourly_rate)}
            onChange={(v) => set("hourly_rate", Number(v) || 0)}
          />
          <TextField
            label="Location"
            value={form.area}
            onChange={(v) => set("area", v)}
            placeholder="Indiranagar, Bengaluru"
          />
          <TextField
            label="Availability"
            value={form.availability}
            onChange={(v) => set("availability", v)}
            placeholder="Weekday mornings, 7am–1pm"
          />
        </div>

        <div className="mt-4">
          <Label htmlFor="about">About you</Label>
          <Textarea
            id="about"
            rows={4}
            value={form.about}
            onChange={(event) => set("about", event.target.value)}
            className="mt-2 rounded-2xl"
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <TextField
            label="Languages (comma separated)"
            value={listToText(form.languages)}
            onChange={(v) => set("languages", textToList(v))}
          />
          <TextField
            label="Skills (comma separated)"
            value={listToText(form.skills)}
            onChange={(v) => set("skills", textToList(v))}
          />
          <TextField
            label="Care specialties (comma separated)"
            value={listToText(form.specialties)}
            onChange={(v) => set("specialties", textToList(v))}
          />
          <TextField
            label="Certifications (comma separated)"
            value={listToText(form.certifications)}
            onChange={(v) => set("certifications", textToList(v))}
          />
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            size="lg"
            className="h-12 rounded-full px-6"
            disabled={save.isPending || !form.name.trim()}
            onClick={() => save.mutate()}
          >
            {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
            Save profile
          </Button>
        </div>
      </SoftCard>

      {existing.data && (
        <SoftCard>
          <SectionTitle hint="Live for families">How families see you</SectionTitle>
          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-4">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-primary font-display text-xl font-semibold text-primary-foreground">
              {existing.data.initials || initialsOf(existing.data.name)}
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-xl font-semibold">{existing.data.name}</h2>
              <p className="text-sm text-muted-foreground">{existing.data.headline}</p>
              <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" aria-hidden /> {existing.data.area || "Location not set"}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">{existing.data.about}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {(existing.data.skills ?? []).map((s) => (
              <Pill key={s} tone="sage">
                {s}
              </Pill>
            ))}
            {(existing.data.languages ?? []).map((l) => (
              <Pill key={l}>{l}</Pill>
            ))}
          </div>
          {(existing.data.certifications ?? []).length > 0 && (
            <ul className="mt-4 space-y-2 text-sm">
              {existing.data.certifications.map((c) => (
                <li key={c} className="flex items-start gap-2">
                  <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          )}
        </SoftCard>
      )}
    </AppShell>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  const id = label.toLowerCase().replace(/[^a-z]+/g, "-");
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-12 rounded-2xl"
      />
    </div>
  );
}
