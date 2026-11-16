# Home Design Studio

Draw a floor plan in the browser, furnish it, and walk through it in 3D.

Live: https://home-design-studio-sage.vercel.app

## What it does

- A 2D editor on a millimetre grid: draw walls, drop in doors and windows, add furniture with real sizes. Walls snap to the grid and to each other, Shift holds the angle, undo and redo group drags into single steps.
- A 3D walkthrough of the same plan, with corner, top, front and walk cameras.
- Live collaboration: several people edit one plan at once and see each other's cursors.
- Sharing by email invite with view or edit access, and revocable read-only links.
- Named versions you can restore.
- PNG and PDF export, and print.
- Free and Pro plans through Stripe. Pro unlocks sharing and Design AI, which edits the plan from a chat, furnishes a room, or turns a photo of a floor plan into an editable one.

## Stack

- `web/`: Next.js, React, TypeScript, Tailwind, Konva (2D), React Three Fiber (3D), zustand, TanStack Query, Firebase Auth. Deployed on Vercel.
- `server/`: Bun, Express, Prisma on PostgreSQL, Yjs + Hocuspocus over WebSocket, Stripe, OpenAI, zod. Deployed on Render.
- The plan itself is one JSON document validated by the schema in `server/src/shared/canvas.ts`; the web app carries a byte-identical copy.

## Run it locally

You need Bun, a PostgreSQL database and a Firebase project for sign-in.

```bash
docker run -d --name hds-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=home_design_studio -p 5432:5432 postgres:16-alpine

cd server
cp .env.example .env          # fill in DATABASE_URL and the Firebase keys
bun install
bun prisma generate
bun run db:push
bun run dev                   # API and WebSocket on http://localhost:4000

cd ../web
cp .env.example .env.local    # API URL, WebSocket URL, Firebase web config
bun install
bun run dev                   # editor on http://localhost:3000
```

Stripe, OpenAI and SMTP keys are optional: billing, Design AI and invite emails switch off when they are missing. `bun run check` runs the type check, lint, format check and tests in each app; `bun run build` builds it.

## License

MIT. See `LICENSE`.
