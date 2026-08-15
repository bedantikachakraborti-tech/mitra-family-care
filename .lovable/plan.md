# Care coordination: messaging, notifications, reviews, role-split care plan

The database is already updated (task buffers, match lifecycle, messages, notifications, reviews) and the shared types exist. What remains is the app layer.

## 1. Data layer

Add to the client data layer, next to the existing task/plan queries:
- Messages: read a conversation for a match, send a message, mark messages read, live updates.
- Notifications: list mine, unread count, mark read / mark all read, create a notification for the other side of a match.
- Reviews: read reviews for a person, write/edit my review of my counterpart.
- Match lifecycle: activate a match on selection, unmatch (with who and when), read match status.
- Task buffers: include the buffer period when creating and editing tasks, and record whether a completion landed inside or outside that window.

## 2. Split the care plan by role

Today one screen serves both sides. Split it:
- Family view: the authoritative editor — natural-language intake, drafted task review, editing, and a buffer control (10–60 minutes) per task.
- Caregiver view: an operational checklist only — today's tasks, complete / postpone / note, no plan editing.
- `/care-plan` stays as the entry point and shows the right view for the signed-in role.

Neutral language throughout; a task outside its window reads as "completed after the agreed window", never as a failure.

## 3. Private chat

New chat screen for a matched family and caregiver: message list, composer, read receipts, live updates. Only available while the match is active; unmatching ends access to sending while keeping history readable.

## 4. Notifications

Bell in the app shell with an unread badge, and a notification panel listing recent items with links to the relevant screen. Notifications are created on: new message, caregiver selected, task marked complete or postponed, and day summary ready. Each uses a dedupe key so nothing repeats.

## 5. Mutual reviews

After a match ends (or on request), both sides can rate 1–5 with categories and a comment, edit their own review, and see reviews on the caregiver profile. Reviews cover the working relationship — never trustworthiness or safety claims.

## 6. Navigation and end-to-end pass

Update the sidebar and bottom navigation for the new chat and role-specific care routes, then walk the whole flow: request → match → selection → plan with buffers → caregiver checklist → logs → chat → notifications → summary → review.

## Technical notes

- All new reads/writes go through the browser Supabase client with existing RLS helpers (`can_access_request`, `has_active_match`, `request_counterpart`); no new backend functions needed.
- Realtime subscriptions for messages and notifications, scoped to the request id.
- No mock data, no changes to auth, matching, AI safety rules, or the multilingual layer.
