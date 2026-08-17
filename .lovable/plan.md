# Split the care plan into two real routes

Today there is a single `/care-plan` page that branches on role inside the component. This replaces it with two distinct pages plus a redirect.

## 1. `/care-family` — the family's authoritative care plan

Moves the existing family editor out of `/care-plan` into its own page, unchanged in behaviour:

- Natural-language / voice intake that drafts tasks for review
- Add, edit and delete tasks
- Edit day, time of day and scheduled time
- Buffer control per task (10–60 minutes)
- Read-only view of today's outcomes per task: completed, completed after the agreed window, postponed, not completed within the window, plus the caregiver's notes

Only a family account can open it. A caregiver landing here is sent to `/care-caregiver`.

## 2. `/care-caregiver` — the caregiver's operational checklist

A working checklist for the day, built from the same tasks and logs:

- Today's assigned tasks with scheduled time and the agreed completion window
- Mark complete, postpone, add a note — the existing workflow and neutral wording
- A read-only weekly rhythm section so the caregiver can see what's coming

No editing controls at all: no schedule edits, no buffer changes, no add/delete, no changes to medication instructions. This is enforced by the page having no such controls and by the existing database rules that only allow the family to write plan tasks.

Only a caregiver account can open it. A family member landing here is sent to `/care-family`.

## 3. `/care-plan` becomes a redirect

It keeps working as an entry point and forwards to the right page based on the signed-in user's saved role from their profile — never from the URL or anything held only in the browser.

## 4. Navigation and links

- Family sidebar/bottom nav "Care Plan" points to `/care-family`
- Caregiver nav "Care Plan" points to `/care-caregiver`
- Existing "See the care plan" links on the family home, caregiver home and care circle pages are repointed to the matching route

## Technical notes

- New files: `src/routes/_authenticated/care-family.tsx`, `src/routes/_authenticated/care-caregiver.tsx`. `care-plan.tsx` is reduced to a role-gated redirect that waits for the profile query before deciding.
- The role gate lives in each route's component (profile is fetched client-side via `useMyProfile`), redirecting with `<Navigate>` rather than a loader, so no protected server call runs during prerender.
- The family editor body moves verbatim from `care-plan.tsx`; the caregiver checklist reuses the task/log actions already in `caregiver.index.tsx` (`setTaskLog`, `statusLabel`, buffer helpers) — extracted into a shared component so both stay in sync.
- No database, RLS, AI, matching or task-sync changes.
- Each route gets its own `head()` metadata.
- Verification: typecheck plus a browser pass signing in as each role, hitting `/care-plan`, `/care-family` and `/care-caregiver` directly and confirming the redirects and the absence of editing controls for caregivers.
