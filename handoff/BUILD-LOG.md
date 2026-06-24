# Build Log
*Owned by Architect. Updated by Builder after each step.*

---

## Current Status

**Active step:** —
**Last cleared:** 1 — Commute GPS Tracker (Full MVP) — 2026-06-24
**Pending deploy:** NO

---

## Step History

### Step 1 — Commute GPS Tracker (Full MVP) — COMPLETE
*Date: 2026-06-24*

Files changed:
- `package.json` — bun project init with elysia, bun:sqlite
- `tsconfig.json` — bun TypeScript config
- `src/db.ts` — SQLite setup with trips + gps_points tables
- `src/index.ts` — Elysia server with 7 API endpoints
- `public/index.html` — Single-page PWA with Leaflet map + GPS recording
- `public/sw.js` — Service worker for offline static cache
- `Dockerfile` — Multi-stage build for deployment
- `.dockerignore` — exclude node_modules, data, .git

Decisions made:
- Used bun:sqlite instead of better-sqlite3 (better-sqlite3 not yet supported in Bun)
- Frontend: vanilla HTML/JS, no build step (per brief)
- GPS streaming: real-time POST to server during recording

Definition of Done:
- [x] `bun run src/index.ts` starts server, serves frontend at /
- [x] Can start GPS recording, see trail on map, stop and save trip
- [x] Trip appears in list with mode/weather/note
- [x] Click trip → replay trail on map
- [x] GET /api/export returns valid JSON with all data
- [x] GPS points persist in SQLite (survive server restart)

---

## Known Gaps
*Logged here instead of fixed. Addressed in a future step.*

---

## Architecture Decisions
*Locked decisions that cannot be changed without breaking the system.*

- Bun + Elysia + SQLite (better-sqlite3) — 2026-06-24
- Browser PWA, no framework — 2026-06-24
- Leaflet.js for map — 2026-06-24
- Single user, no auth — 2026-06-24
