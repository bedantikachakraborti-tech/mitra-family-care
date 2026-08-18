import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { SoftCard, SectionTitle } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { structureCareRequest } from "@/lib/ai.functions";
import { saveCareRequest } from "@/lib/care-data";
import { emptyRequirements, type CareRequirements } from "@/lib/care-types";
import { useCareContext } from "@/lib/use-care";

export const Route = createFileRoute("/_authenticated/family/request")({
  head: () => ({
    meta: [
      { title: "Describe the care you need — Mitra" },
      {
        name: "description",
        content:
          "Tell Mitra about the person and the help they need in your own words. Mitra turns it into a clear care request you can edit.",
      },
      { property: "og:title", content: "Describe the care you need — Mitra" },
      {
        property: "og:description",
        content: "Write it in your own words; Mitra organises the details for you.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CareRequestPage,
});

const example = `My mother Kamala is 78 and lives alone in Indiranagar, Bengaluru. She's steady on her feet indoors but needs an arm on the stairs. She takes her tablets after breakfast and after dinner — she has them in a weekly box. She'd love someone to walk with her in the park in the mornings and cook simple South Indian food. Kannada or English is fine. Weekday mornings, roughly 7am to 12pm.`;

function CareRequestPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { request } = useCareContext();

  const [description, setDescription] = useState("");
  const [draft, setDraft] = useState<CareRequirements | null>(null);

  const structure = useServerFn(structureCareRequest);

  const analyse = useMutation({
    mutationFn: () => structure({ data: { description: description.trim() } }),
    onSuccess: (result) => setDraft({ ...emptyRequirements, ...result }),
    onError: (error: Error) => toast.error(error.message),
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!draft) throw new Error("Nothing to save yet.");
      return saveCareRequest({ rawDescription: description.trim(), structured: draft });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["care-request"] });
      toast.success("Care request saved");
      navigate({ to: "/family/matches" });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <AppShell
      role="family"
      title="Tell us what's needed"
      subtitle="Write it the way you'd explain it to a friend. You can fix anything Mitra gets wrong."
    >
      <SoftCard>
        <SectionTitle hint={request ? "You already have a request saved" : undefined}>
          In your own words
        </SectionTitle>
        <Label htmlFor="description" className="text-sm font-semibold">
          Who needs care, and what would help?
        </Label>
        <Textarea
          id="description"
          rows={8}
          value={description}
          maxLength={4000}
          onChange={(event) => setDescription(event.target.value)}
          placeholder={example}
          className="mt-2 rounded-2xl text-base"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setDescription(example)}
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Use an example
          </button>
          <span className="text-xs text-muted-foreground">{description.length}/4000</span>
        </div>
        <Button
          size="lg"
          className="mt-5 h-13 w-full rounded-full text-base sm:w-auto"
          disabled={description.trim().length < 10 || analyse.isPending}
          onClick={() => analyse.mutate()}
        >
          {analyse.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          {analyse.isPending ? "Reading your note…" : "Organise this for me"}
        </Button>
      </SoftCard>

      {draft && (
        <>
          <SoftCard tone="sage">
            <p className="text-sm">
              Here's what Mitra understood. Please read it over and correct anything — nothing is
              saved until you say so.
            </p>
          </SoftCard>

          <SoftCard>
            <SectionTitle>Review the details</SectionTitle>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Person receiving care"
                value={draft.personName}
                onChange={(personName) => setDraft({ ...draft, personName })}
              />
              <Field
                label="Neighbourhood"
                value={draft.area}
                onChange={(area) => setDraft({ ...draft, area })}
              />
            </div>
            <div className="mt-5">
              <Label className="text-sm font-semibold">Summary</Label>
              <Textarea
                rows={3}
                value={draft.summary}
                onChange={(event) => setDraft({ ...draft, summary: event.target.value })}
                className="mt-2 rounded-2xl"
              />
            </div>
            <ListField
              label="Support needed"
              items={draft.supportNeeds}
              onChange={(supportNeeds) => setDraft({ ...draft, supportNeeds })}
            />
            <ListField
              label="When help is needed"
              items={draft.schedule}
              onChange={(schedule) => setDraft({ ...draft, schedule })}
            />
            <ListField
              label="Languages"
              items={draft.languages}
              onChange={(languages) => setDraft({ ...draft, languages })}
            />
            <ListField
              label="Preferences and routines"
              items={draft.preferences}
              onChange={(preferences) => setDraft({ ...draft, preferences })}
            />
            <ListField
              label="Worth discussing with a caregiver"
              items={draft.thingsToDiscuss}
              onChange={(thingsToDiscuss) => setDraft({ ...draft, thingsToDiscuss })}
            />
          </SoftCard>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="ghost"
              size="lg"
              className="h-13 rounded-full"
              onClick={() => setDraft(null)}
            >
              Discard
            </Button>
            <Button
              size="lg"
              className="h-13 rounded-full px-8 text-base"
              disabled={save.isPending}
              onClick={() => save.mutate()}
            >
              {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save and see caregivers
            </Button>
          </div>
        </>
      )}
    </AppShell>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label className="text-sm font-semibold">{label}</Label>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-12 rounded-2xl"
      />
    </div>
  );
}

function ListField({
  label,
  items,
  onChange,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  return (
    <div className="mt-5">
      <Label className="text-sm font-semibold">{label}</Label>
      <p className="mt-1 text-xs text-muted-foreground">One per line</p>
      <Textarea
        rows={Math.max(3, items.length + 1)}
        value={items.join("\n")}
        onChange={(event) =>
          onChange(
            event.target.value
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean),
          )
        }
        className="mt-2 rounded-2xl"
      />
    </div>
  );
}
