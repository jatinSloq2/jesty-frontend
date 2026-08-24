# Jesty Frontend

WhatsApp-style inbox (orange re-skin) for the `jesty-backend` Meta Cloud API service.
Next.js 15 (App Router) + TypeScript + Tailwind v4 + hand-rolled shadcn-style primitives + GSAP.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in your backend URL + service token
npm run dev
```

`.env.local`:
- `NEXT_PUBLIC_API_URL` — e.g. `http://localhost:5000/api`
- `NEXT_PUBLIC_SOCKET_URL` — e.g. `http://localhost:5000`
- `NEXT_PUBLIC_JESTY_SERVICE_TOKEN` — the `jesty-backend-service-token` value, required
  for `POST /messages/upload` and `POST /profile/picture` (see design guide §5)

## Verified

`npm install`, `npx tsc --noEmit`, and `npx next build` all pass clean (10/10 routes compiled).
`node_modules` and `.next` are stripped from this archive — run `npm install` first.

## Structure

- `src/app/(auth)/login` — login
- `src/app/(app)/inbox` — inbox list + `/inbox/[conversationId]` chat pane
- `src/app/(app)/settings/channels` — connected WhatsApp numbers
- `src/app/(app)/settings/profile` — WhatsApp Business Profile editor
- `src/components/ui` — hand-rolled shadcn-style primitives (Radix + Tailwind v4; the
  `ui.shadcn.com` registry wasn't reachable from the build sandbox, so these are written
  directly rather than pulled via the CLI — swap in the CLI-generated versions freely,
  the `cn()` conventions match)
- `src/components/inbox`, `src/components/settings`, `src/components/layout` — feature components
- `src/lib/api.ts` — typed REST client (incl. the dedicated upload path with the
  `jesty-backend-service-token` header)
- `src/lib/socket.ts` — Socket.IO client
- `src/providers` — auth context, theme provider, channel (active WhatsApp number) store

## Design system notes

- Every corner is sharp (`--radius: 0`) except avatars and the unread-count pill, which
  stay circular on purpose — see `.avatar-circle` / `.pill-circle` in `globals.css`.
- Color tokens in `globals.css` under `:root` / `.dark` match the design guide's table exactly.
- GSAP animations: list stagger on load, bubble entrance, theme-toggle icon flip,
  send-button bounce, page-level fade/slide transitions — see `src/hooks/use-gsap-context.ts`.

## Known gaps vs. the full design guide (flagged, not silently dropped)

- Long-press-to-react on touch (hover-only for now)
- Full emoji picker (currently a 6-emoji quick row, matches the spec's default state)
- Push notifications: the Notifications page drives the real
  `POST/DELETE /notifications/device-token` endpoint end-to-end, but it registers a
  placeholder device identifier (`crypto.randomUUID()`), not a genuine FCM token — wire in
  Firebase Cloud Messaging's `getToken()` (VAPID key + service worker) for production push

## Phase 2 — Contacts / Groups / Tags / Attributes / Notifications

- `/contacts` — searchable, tag/group-filterable list; create dialog; detail sheet to edit
  tags, groups, custom attribute values, and notes, plus block/unblock and delete
- `/groups` — card grid with member counts; create/edit/delete; "Manage members" dialog
  (search + checkbox add/remove against `POST /groups/:id/members`)
- `/settings/tags` — list/create/edit (name + color swatch)/delete
- `/settings/attributes` — list/create/edit (label, machine key, type, list options)/delete
- `/notifications` — browser permission flow + device-token register/unregister
