# Home Design Studio

A 2D floor plan editor with 3D preview — think Floorplanner/RoomSketcher lite.

> Setup, folder map and API reference live in [README.md](./README.md).
> This file is the short "what and why".

## Core Features

- **2D Canvas Editor** — draw walls, place doors, windows and furniture on a snap-to-grid canvas
- **Furniture Catalog** — categorized items (sofa, bed, table, etc.) with real dimensions, drag-and-drop placement
- **3D Preview** — render the floor plan as a 3D orbit/walkthrough view
- **Real-time Collaboration** — multiple people editing one design, with live cursors
- **AI Design Assistant** — a chat that can build and edit the whole layout via tool calls
- **AI Room Suggestions** — "furnish this living room" auto-places furniture
- **Image to Design** — turn a photo of a floor plan into an editable design
- **Undo/Redo** — snapshot history that groups drags and batch operations
- **Version History** — snapshot, browse and restore earlier versions of a design
- **Sharing** — invite by email with view/edit rights, or a public read-only link
- **Export** — PDF floor plan and PNG screenshot
- **Billing** — Free vs Pro plans via Stripe

## Tech Stack

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS
- **Canvas:** Konva.js (2D editor)
- **3D:** Three.js / React Three Fiber (3D preview)
- **State:** Zustand (canvas state, undo/redo stack)
- **Collaboration:** Yjs + Hocuspocus over WebSocket
- **AI:** OpenAI (design chat, room furnishing, image-to-design)
- **Backend:** Bun, Express, Prisma, PostgreSQL
- **Auth:** Firebase Authentication (Firebase Admin verifies tokens server-side)
- **Storage:** Supabase (image uploads)
- **Billing:** Stripe
- **Testing:** Bun test (unit). Playwright is installed for E2E but no specs exist yet.

## What This Project Shows

- Canvas/WebGL rendering (beyond typical DOM work)
- 3D graphics with Three.js (rare and impressive skill)
- Spatial algorithms (snap-to-grid, collision detection, polygon area)
- Real-time collaborative editing with CRDTs
- Creative UI/UX (drag-and-drop, toolbar, property panels)
- AI integration for spatial reasoning, including streaming tool calls
- Snapshot-based undo/redo with coalescing and batching
