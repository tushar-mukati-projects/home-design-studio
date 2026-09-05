# Home Design Studio

A 2D floor plan editor with a 3D walkthrough preview, real-time collaboration and an AI
design assistant. Draw walls on a snap-to-grid canvas, drop in furniture, let the app detect
rooms automatically, then preview the result in 3D, share it, or export it as PDF/PNG.

Two apps in one repo:

| Folder    | What it is                      | Runs on                    |
| --------- | ------------------------------- | -------------------------- |
| `web/`    | Next.js frontend (the editor)   | http://localhost:3000      |
| `server/` | Express + Prisma API + WebSocket | http://localhost:4000      |

---

## Getting started

You need [Bun](https://bun.sh) and a PostgreSQL database.

```bash
# 1. Install dependencies (run in each folder)
cd server && bun install
cd ../web && bun install

# 2. Configure the server
cd ../server
cp .env.example .env        # then fill in DATABASE_URL at minimum
bun prisma generate         # generates the typed database client
bun run db:push             # creates the tables

# 3. Run both apps (two terminals)
cd server && bun run dev    # API on :4000
cd web && bun run dev       # editor on :3000
```

The server seeds the default furniture catalog and starter templates on first boot.

Only `DATABASE_URL` is required to start. Everything else degrades gracefully: without
Firebase keys you cannot sign in, without `OPENAI_API_KEY` the AI features fail, without
SMTP the share-invite emails are skipped (and logged). See `server/.env.example` for the
full list, grouped by feature.

---

## Everyday commands

Run these inside `server/` or `web/`.

| Command             | What it does                                             |
| ------------------- | -------------------------------------------------------- |
| `bun run dev`       | Start in watch mode                                      |
| `bun run test`      | Run the unit tests                                       |
| `bun run test:watch`| Re-run tests as you edit                                 |
| `bun run check`     | Typecheck + lint + format check + tests (run before committing) |
| `bun run check:fix` | Auto-fix lint and formatting                             |
| `bun run build`     | Production build                                         |

`server/` also has `bun run db:push` (apply schema changes) and `bun run db:studio`
(browse the database in a GUI).

---

## Where things live

### `web/` — the frontend

```
web/
├── src/
│   ├── app/          Next.js routes. One folder = one URL.
│   │                   /            landing page
│   │                   /dashboard   your designs
│   │                   /editor/[id] the editor
│   │                   /shared/[id] read-only shared link (?code=)
│   │                   /pricing, /sign-in, /sign-up
│   ├── features/     The actual product, grouped by feature.
│   │   └── editor/     canvas/         the 2D drawing surface (Konva)
│   │                   three-d-preview/ the 3D view (React Three Fiber)
│   │                   furniture-catalog/ drag-and-drop furniture
│   │                   properties-panel/  edit the selected item
│   │                   ai-chat/        the AI design assistant
│   │                   collaboration/  live cursors, multiplayer sync
│   │                   export/         PDF + PNG export
│   │                   sharing/, version-history/, import/, toolbar/
│   ├── stores/       Zustand state. editor-store.ts holds the canvas + undo history.
│   ├── hooks/        Data fetching (TanStack Query), one folder per resource.
│   ├── components/   Generic reusable UI (buttons, dialogs) + layout.
│   ├── lib/          Shared setup: axios, firebase, constants, utils.
│   └── mocks/        MSW fake API, for developing without a backend.
└── tests/            Unit tests, mirroring the src/ layout.
```

### `server/` — the API

```
server/
├── src/
│   ├── index.ts      The only file at the top level: starts the app.
│   ├── routes/       URL -> controller. Start here to find an endpoint.
│   ├── controllers/  Read the request, call a service, send the response.
│   ├── services/     The real logic. Most of the interesting code is here.
│   ├── schemas/      Zod request validation.
│   ├── middleware/   Auth, plan gating, uploads, validation, error handling.
│   ├── collaboration/ Real-time multiplayer (Yjs + Hocuspocus over WebSocket).
│   └── lib/          Shared building blocks: db, config, logger, types,
│                     constants, serializers, firebase-admin, supabase.
├── tests/            Unit tests, mirroring the src/ layout.
└── prisma/schema.prisma   The database schema.
```

**A request flows like this:**

```
HTTP request
  -> routes/       picks the handler, applies auth + validation middleware
  -> controllers/  unpacks the request
  -> services/     does the work, talks to the database
  -> lib/serializers.ts  shapes the response (and strips private fields)
```

So to change what an endpoint *does*, edit a service. To change *who can call it*,
edit the route. To change *what it returns*, edit the serializer.

---

## The API

All routes are prefixed with `/api` and need a Firebase ID token
(`Authorization: Bearer <token>`), except the webhook and the public share link.

Everything that belongs to a design lives under `/designs`, so there is one place
to look and one id to pass.

| Area           | Endpoints |
| -------------- | --------- |
| `/designs`     | `GET /?scope=owned\|shared\|all` `POST /` (`templateId` optional) `GET /:id?code=` `PATCH /:id` `DELETE /:id` |
| └ sharing      | `GET /:id/access` `POST /:id/members` `DELETE /:id/members/:memberId` `POST /:id/links` `DELETE /:id/links/:linkId` |
| └ versions     | `GET /:id/versions` `POST /:id/versions` `POST /:id/versions/:versionId/restore` `DELETE /:id/versions/:versionId` |
| `/furniture`   | `GET /` — the shared catalog of placeable items |
| `/templates`   | `GET /` — create from one with `POST /designs { templateId }` |
| `/billing`     | `GET /plan` `POST /checkout` `POST /portal` `POST /webhook` |
| `/ai` (Pro)    | `POST /design-chat` `POST /furnish` `POST /image-to-design` |

`GET /designs/:id` is the only way to read a design. It answers three questions at
once: the owner asking for their own, a member asking for one shared with them, and
an anonymous visitor holding a share link, who passes `?code=` instead of a token.

Plus a WebSocket at `/collaboration` for real-time editing, and `GET /health`.

---

## The data model

Six tables. `prisma/schema.prisma` is the single source of truth for all of them.

| Table              | Holds |
| ------------------ | ----- |
| `users`            | One row per account. `auth_sub` is the auth provider's user id. |
| `subscriptions`    | Billing state, one row per paying user. No row = free plan. |
| `billing_events`   | Every Stripe webhook, keyed by its event id so retries are ignored. |
| `designs`          | A floor plan. **`canvas_data` holds the entire drawing.** |
| `design_versions`  | Point-in-time snapshots of a design's `canvas_data`. |
| `design_members`   | Who a design is shared with, by email, and whether they can edit. |
| `design_links`     | Share links: a secret code per link, optionally expiring. |
| `furniture_items`  | The catalog of things that *can* be placed. Seeded on boot. |
| `design_templates` | Starter floor plans. Seeded on boot. |

**Walls, doors, windows, rooms and furniture placements are not tables.** They all live
inside `designs.canvas_data`, because the collaborative editor owns that document and
writes it as one unit. The API's `rooms` and `furniture` fields are *derived* from it in
`lib/serializers.ts`, so they cannot fall out of step with the drawing.

`furniture_items` is the one genuinely relational piece, and stays a table: it is the
shared catalog every design draws from, not something a single design owns.

---

## Key concepts

**Coordinates are canvas pixels.** `30 px = 1 foot`, defined once in
`web/src/lib/constants.ts`. Always convert through those helpers rather than dividing by 30.

**`canvas_data` is the single source of truth for a design.** Walls, doors, windows, rooms
and furniture all live in that one JSON column — there are no tables for them. The API's
`rooms` and `furniture` fields are *derived* from it in `lib/serializers.ts`, so they can
never go stale.

**A design has a live copy while it is being edited.** The editor syncs through a Yjs
document over WebSocket (so several people can edit at once), and that document owns
persistence: its save hook writes `canvas_data` and `yjs_state` together.

So **server-side canvas changes go through the document, never the columns.**
`updateDesign()` and version restore both call `applyToCollabDoc()`
(`collaboration/hocuspocus.ts`), which:

- reaches any editor that currently has the design open, instead of being flushed away by it;
- loads the existing CRDT state first, so removing an element records a real deletion — a
  freshly rebuilt state has no deletion history, and a client reconnecting with an old
  local copy would push the removed elements straight back;
- keeps `canvas_data` and `yjs_state` in agreement, and preserves keys like `gridSize`
  that are not part of the drawing itself.

It throws if it cannot apply the change, so a caller never reports success on a write that
did not land.

**Versions are snapshots, not the store.** `designs.canvas_data` is the current drawing;
`design_versions.canvas_data` are frozen copies of past ones. That is a copy on purpose —
versions are never updated, so unlike a second live table they cannot drift. Versions are
created **only** when someone saves one; nothing is written automatically.

**Undo is snapshot-based.** `editor-store.ts` keeps up to 50 snapshots. Continuous edits
(dragging a slider) pass a *coalesce key* so the whole drag becomes one undo step, and
multi-step operations wrap in `beginBatch()` / `endBatch()`.

**Plans gate features.** `free` = 3 designs, no sharing, no AI. `pro` = unlimited.
Enforced server-side in `src/middleware/plan-gate.ts`; the limits live in
`src/lib/constants.ts`. A user's plan lives in `subscriptions` — **no row means free**,
so nothing has to be created at signup.

**Stripe grants Pro through the webhook, not the redirect.** `/dashboard?checkout=success`
is cosmetic; `POST /api/billing/webhook` is what flips the plan. It is authenticated by
signature rather than login, which is why `express.raw` must run before `express.json` for
that path. Every event is stored in `billing_events` keyed by Stripe's event id, so a
retried delivery is ignored instead of applied twice.

---

## Tech stack

**Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS v4, Konva (2D canvas),
React Three Fiber (3D), Zustand (state), TanStack Query (data), Framer Motion, jsPDF.

**Backend:** Bun, Express, Prisma 7 + PostgreSQL, Yjs + Hocuspocus (collaboration),
Firebase Admin (auth), Stripe (billing), OpenAI (AI), Winston (logs).

PostgreSQL is hosted on Supabase, but nothing talks to Supabase directly — Prisma
connects to it as an ordinary Postgres database.

**Testing:** `bun test` for unit tests. There is no end-to-end suite.

---

## Known gaps

- Sharing is keyed on a **verified** email. Someone whose provider has not verified their
  address cannot open a design shared with them until they verify.
- Dragging a furniture card onto the canvas does nothing — the card is `draggable` but the
  canvas has no drop handler. Clicking a card (quick-add) is the working path.
- The editor has **no React error boundary**, so one malformed element in `canvas_data`
  blanks the whole page rather than one shape.
- Restoring a version **overwrites the current canvas with no undo** — nothing snapshots
  what it replaces, and the editor reloads afterwards, so the local undo stack is gone too.
- `PATCH /api/designs/:id` replaces `canvas_data` wholesale. A partial body such as
  `{"canvasData":{"walls":[…]}}` clears rooms, furniture, doors and windows.
