# Home Design Studio

A 2D floor plan editor with 3D preview — think Floorplanner/RoomSketcher lite.

## Core Features

- **2D Canvas Editor** — drag walls, doors, windows, furniture onto a snap-to-grid canvas
- **Room Detection** — auto-detect enclosed rooms from wall segments
- **Furniture Catalog** — categorized items (sofa, bed, table, etc.) with real dimensions, drag-and-drop placement
- **3D Preview** — render the floor plan as a 3D walkthrough view
- **AI Room Suggestions** — "furnish this living room" auto-places furniture using OpenAI
- **Undo/Redo** — full command pattern history
- **Export** — PDF floor plan, shareable link, screenshot

## Tech Stack

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS, shadcn/ui
- **Canvas:** Konva.js or HTML5 Canvas (for 2D editor)
- **3D:** Three.js / React Three Fiber (for 3D preview)
- **State:** Zustand (canvas state, undo/redo stack)
- **AI:** OpenAI (room furnishing suggestions)
- **Backend:** Bun, Express, Prisma, PostgreSQL
- **Auth:** Clerk
- **Storage:** Supabase (save designs, furniture assets)
- **Testing:** Jest, Playwright, MSW

## What This Project Shows

- Canvas/WebGL rendering (beyond typical DOM work)
- 3D graphics with Three.js (rare and impressive skill)
- Spatial algorithms (snap-to-grid, collision detection, room detection)
- Creative UI/UX (drag-and-drop, toolbar, property panels)
- AI integration for spatial reasoning
- Command pattern for undo/redo
