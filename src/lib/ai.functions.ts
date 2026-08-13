import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { AiError, callAiJson, callAiText } from "./ai.server";
import type { CareRequirements, DraftTask, MatchSuggestion } from "./care-types";
import { normalizeList } from "./list-input";

const stringArray = z.preprocess((value) => normalizeList(value), z.array(z.string())).default([]);


function toMessage(error: unknown): never {
  if (error instanceof AiError) throw new Error(error.message);
  console.error(error);
  throw new Error("Something went wrong. Please try again.");
}

/** Turn a family's free-text description into structured care requirements. */
export const structureCareRequest = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ description: z.string().trim().min(10).max(4000) }).parse(input),
  )
  .handler(async ({ data }): Promise<CareRequirements> => {
    try {
      const result = await callAiJson<Record<string, unknown>>({
        system: `Convert a family's description of their care situation into structured requirements.
Return JSON with exactly these keys:
{
  "personName": string,        // the person receiving care, "" if not stated
  "area": string,              // neighbourhood / city if stated, else ""
  "summary": string,           // 1-2 warm, plain sentences describing the situation
  "supportNeeds": string[],    // practical help needed, e.g. "Help with morning bathing"
  "schedule": string[],        // when help is needed, e.g. "Weekday mornings, 7am-11am"
  "languages": string[],       // languages the family mentioned
  "preferences": string[],     // personal preferences and routines they mentioned
  "thingsToDiscuss": string[]  // open questions the family may want to clarify with a caregiver
}
Only include facts the family actually wrote. Do not invent medical details or diagnoses.`,
        user: data.description,
      });

      return z
        .object({
          personName: z.string().default(""),
          area: z.string().default(""),
          summary: z.string().default(""),
          supportNeeds: stringArray,
          schedule: stringArray,
          languages: stringArray,
          preferences: stringArray,
          thingsToDiscuss: stringArray,
        })
        .parse(result);
    } catch (error) {
      return toMessage(error);
    }
  });

/** Rank caregiver profiles against structured requirements. */
export const rankCaregivers = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        requirements: z.record(z.string(), z.unknown()),
        caregivers: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            headline: z.string(),
            about: z.string(),
            years_experience: z.number(),
            languages: z.array(z.string()),
            skills: z.array(z.string()),
            specialties: z.array(z.string()).default([]),
            area: z.string(),
            availability: z.string(),
            preferred_hours: z.string().default(""),
            hourly_rate: z.number(),
            negotiable: z
              .object({
                availability: z.boolean().default(false),
                hours: z.boolean().default(false),
                location: z.boolean().default(false),
                rate: z.boolean().default(false),
              })
              .default({ availability: false, hours: false, location: false, rate: false }),
          }),
        ),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<MatchSuggestion[]> => {
    try {
      const result = await callAiJson<{ matches?: unknown }>({
        system: `Compare caregiver profiles against a family's care requirements and explain the fit.

Return JSON: { "matches": [ { "caregiverId": string, "score": number, "rationale": string, "considerations": string } ] }
- Include every caregiver given to you, ordered best fit first.
- "score" is 0-100 and reflects only practical fit: skills, availability, schedule, languages spoken, location and stated preferences.
- Each caregiver has a "negotiable" object saying which of their preferences they marked as flexible
  (availability, preferred hours, location/travel, hourly rate).
  * A mismatch on a preference they did NOT mark negotiable is a hard mismatch: reduce the score substantially.
  * A mismatch on a preference they DID mark negotiable should only reduce the score moderately and must not
    disqualify them; mention in "considerations" that this is something they said could be discussed.
  * Never assume a preference is negotiable when the flag is false.
- "rationale" is 1-2 warm sentences about why this could work well.
- "considerations" is one neutral sentence about what the family may want to ask or check.
- Never comment on trustworthiness, safety, character or background checks.
- Never use age, gender, caste, religion, ethnicity or any protected characteristic.`,
        user: JSON.stringify({ requirements: data.requirements, caregivers: data.caregivers }),
      });


      const parsed = z
        .array(
          z.object({
            caregiverId: z.string(),
            score: z.number(),
            rationale: z.string().default(""),
            considerations: z.string().default(""),
          }),
        )
        .parse(result.matches ?? []);

      const known = new Set(data.caregivers.map((c) => c.id));
      return parsed
        .filter((m) => known.has(m.caregiverId))
        .map((m) => ({ ...m, score: Math.max(0, Math.min(100, Math.round(m.score))) }));
    } catch (error) {
      return toMessage(error);
    }
  });

/** Turn a family's description of routines into draft care-plan tasks. */
export const structureCarePlan = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        description: z.string().trim().min(10).max(4000),
        personName: z.string().default(""),
        outputLanguage: z.string().default("English"),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<DraftTask[]> => {
    try {
      const result = await callAiJson<{ tasks?: unknown }>({
        system: `Convert a family's description of daily routines into a draft list of recurring care tasks.

Return JSON: { "tasks": [ { "title": string, "details": string, "category": string, "timeOfDay": string, "scheduledTime": string, "days": string[] } ] }
- "category" is one of: routine, meal, medication, mobility, companionship, household, appointment.
- "timeOfDay" is one of: morning, midday, afternoon, evening, night.
- "scheduledTime" is 24h "HH:MM" when a time was stated, otherwise "".
- "days" uses mon,tue,wed,thu,fri,sat,sun. Use all seven when the family says "every day".
- "title" is short and friendly; "details" repeats only what the family wrote.
- The family may speak or type in any language, including Bengali, Hindi and Tamil.
  Write "title" and "details" in ${data.outputLanguage}, keeping personal names, places and
  medicine names exactly as the family said them.
- For medication tasks, repeat the medicine name and dose exactly as written and add nothing.
  If no dose was written, leave it out. Never invent dosages, timings or medical advice.
- Do not add tasks the family did not describe.`,
        user: `Person receiving care: ${data.personName || "not stated"}\n\n${data.description}`,

      });

      return z
        .array(
          z.object({
            title: z.string(),
            details: z.string().default(""),
            category: z.string().default("routine"),
            timeOfDay: z
              .enum(["morning", "midday", "afternoon", "evening", "night"])
              .catch("morning"),
            scheduledTime: z.string().default(""),
            days: z
              .array(z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]))
              .default(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]),
          }),
        )
        .parse(result.tasks ?? []);
    } catch (error) {
      return toMessage(error);
    }
  });

/** Write a gentle end-of-day summary from what actually happened. */
export const generateDaySummary = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        personName: z.string().default(""),
        caregiverName: z.string().default(""),
        date: z.string(),
        entries: z.array(
          z.object({
            title: z.string(),
            time: z.string().default(""),
            status: z.string(),
            note: z.string().default(""),
          }),
        ),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<string> => {
    try {
      return await callAiText({
        system: `Write a short end-of-day care summary for the family, in 3-5 sentences of warm plain English.
- Base it only on the task records given. Do not invent events.
- Mention what went well, then anything still open.
- For tasks that are not complete, say "hasn't been marked complete yet". Never imply neglect or blame.
- Do not give medical advice or interpret symptoms.
- End with one gentle suggestion the family may want to consider, framed as a question or option.
- No markdown, no headings, no bullet points.`,
        user: JSON.stringify(data),
      });
    } catch (error) {
      return toMessage(error);
    }
  });

/** Suggest schedule adjustments based on how the week has actually gone. */
export const suggestPlanAdjustments = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        entries: z.array(
          z.object({
            taskId: z.string(),
            title: z.string(),
            time: z.string().default(""),
            recent: z.array(z.string()).default([]),
            notes: z.array(z.string()).default([]),
            observations: z.array(z.string()).default([]),
          }),
        ),

      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<{ taskId: string; suggestion: string; reason: string }[]> => {
    try {
      const result = await callAiJson<{ suggestions?: unknown }>({
        system: `Look at how recurring care tasks have gone recently and suggest gentle schedule adjustments.
Each entry includes "observations": factual counts already computed from the saved records. Base your reasoning only on those.

Return JSON: { "suggestions": [ { "taskId": string, "suggestion": string, "reason": string } ] }
- Only suggest changes for tasks with a clear repeated pattern. Return an empty list if nothing stands out.
- "suggestion" is a concrete, optional change, e.g. "Consider moving this to 9:30am".
- "reason" is one neutral sentence describing the pattern, never blaming anyone.
- Never suggest changing medication timing or dosage. For medication tasks, only suggest
  that the family may want to confirm the timing with the person's doctor.
- The family decides; phrase everything as a suggestion.`,
        user: JSON.stringify(data),
      });

      return z
        .array(
          z.object({
            taskId: z.string(),
            suggestion: z.string(),
            reason: z.string().default(""),
          }),
        )
        .parse(result.suggestions ?? []);
    } catch (error) {
      return toMessage(error);
    }
  });

/** Free-form assistant reply, grounded in the current care context. */
export const askAssistant = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        role: z.enum(["family", "caregiver"]),
        context: z.string().default(""),
        messages: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string().max(4000),
            }),
          )
          .min(1)
          .max(30),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<string> => {
    try {
      const history = data.messages
        .map((m) => `${m.role === "user" ? "User" : "Mitra"}: ${m.content}`)
        .join("\n\n");

      return await callAiText({
        system: `You are Mitra's assistant, talking to the ${data.role}.
Be warm, calm and brief (under 150 words). Use plain language and no markdown headings.
Ground answers in the care context below. If something isn't in the context, say so plainly.
Never give medical advice, diagnoses or medication instructions — suggest speaking to a doctor instead.
Never comment on whether anyone is trustworthy, and never suggest monitoring the caregiver.
For anything not yet done, say "hasn't been marked complete yet".

Care context:
${data.context || "No care plan has been set up yet."}`,
        user: history,
      });
    } catch (error) {
      return toMessage(error);
    }
  });

/** Turn a caregiver's spoken or typed introduction into a structured profile draft. */
export const structureCaregiverProfile = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        description: z.string().trim().min(10).max(4000),
        outputLanguage: z.string().default("English"),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    try {
      const result = await callAiJson<Record<string, unknown>>({
        system: `Convert a caregiver's own description of their work into a structured profile draft.
Return JSON with exactly these keys:
{
  "name": string,             // their name if they said it, else ""
  "headline": string,         // one short line, e.g. "Elder companion and mobility support"
  "about": string,            // 2-3 warm sentences in first person, using only what they said
  "yearsExperience": number,  // 0 if not stated
  "languages": string[],
  "skills": string[],
  "specialties": string[],    // kinds of care they focus on
  "certifications": string[], // only certifications they explicitly mentioned
  "area": string,             // neighbourhood / city if stated, else ""
  "availability": string,     // e.g. "Weekday mornings" if stated, else ""
  "preferredHours": string,   // e.g. "8 AM-12 PM" if stated, else ""
  "hourlyRate": number,       // 0 if not stated
  "availabilityNegotiable": boolean, // true ONLY if they said their availability is flexible
  "hoursNegotiable": boolean,        // true ONLY if they said their hours are flexible
  "locationNegotiable": boolean,     // true ONLY if they said they can travel further / area is flexible
  "rateNegotiable": boolean          // true ONLY if they said the rate is negotiable
}
The caregiver may speak or type in any language, including Bengali, Hindi and Tamil.
Write every text value in ${data.outputLanguage}, translating faithfully where needed.
Keep personal names, place names and certification names as they were said; do not translate proper nouns
("New Delhi" stays "New Delhi", never split or rewritten).
Multi-value fields must be JSON arrays with one value per entry, never a single comma-joined string.
Keep multi-word values whole: "elder care", "meal preparation" and "mobility assistance" are three entries.
Only include facts they actually said. Never invent experience, certifications or rates.
All four negotiable flags default to false; set true only on an explicit statement of flexibility.
Never comment on trustworthiness, safety or character.`,
        user: data.description,
      });


      return z
        .object({
          name: z.string().default(""),
          headline: z.string().default(""),
          about: z.string().default(""),
          yearsExperience: z.coerce.number().default(0),
          languages: stringArray,
          skills: stringArray,
          specialties: stringArray,
          certifications: stringArray,
          area: z.string().default(""),
          availability: z.string().default(""),
          preferredHours: z.string().default(""),
          hourlyRate: z.coerce.number().default(0),
          availabilityNegotiable: z.coerce.boolean().default(false),
          hoursNegotiable: z.coerce.boolean().default(false),
          locationNegotiable: z.coerce.boolean().default(false),
          rateNegotiable: z.coerce.boolean().default(false),
        })
        .parse(result);

    } catch (error) {
      return toMessage(error);
    }
  });

/** Turn a family member's spoken or typed introduction into a structured profile draft. */
export const structureFamilyProfile = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        description: z.string().trim().min(5).max(4000),
        outputLanguage: z.string().default("English"),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    try {
      const result = await callAiJson<Record<string, unknown>>({
        system: `Convert a family member's own words into a structured contact profile draft.
Return JSON with exactly these keys:
{
  "fullName": string,     // their own name if they said it, else ""
  "relationship": string, // their relationship to the person they care for, e.g. "Daughter", else ""
  "location": string,     // their neighbourhood / city if stated, else ""
  "phone": string         // phone number if stated, digits and + only, else ""
}
They may speak or type in any language, including Bengali, Hindi and Tamil.
Write "relationship" in ${data.outputLanguage}.
Keep proper nouns exactly as said: personal names, neighbourhoods and city names are never translated,
transliterated beyond what is natural, or split ("New Delhi" stays "New Delhi").
Only include what they actually said; leave anything else as "".
Do not collect or infer health details, income, age, gender, religion or any other sensitive information.`,
        user: data.description,
      });

      return z
        .object({
          fullName: z.string().default(""),
          relationship: z.string().default(""),
          location: z.string().default(""),
          phone: z.string().default(""),
        })
        .parse(result);
    } catch (error) {
      return toMessage(error);
    }
  });
