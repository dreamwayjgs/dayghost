# Architect Brief
*Written by Architect. Read by Builder and Reviewer.*
*Overwrite this file each step — it is not a log, it is the current active brief.*

---

## Step 1 — Commute GPS Tracker (Full MVP)

### Architecture
- **Backend:** Bun + Elysia + SQLite (better-sqlite3)
- **Frontend:** Browser PWA (vanilla HTML/JS/TS, no framework)
- **Map:** Leaflet.js (CDN, no API key)
- **Deploy:** Docker on Project Owner's server

### Data Model

```sql
CREATE TABLE trips (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  mode TEXT NOT NULL CHECK(mode IN ('walk','bus','bike')),
  weather TEXT CHECK(weather IN ('clear','rain','snow','wind','cold','hot')),
  temp_c INTEGER,
  note TEXT,
  duration_sec INTEGER,
  distance_m REAL
);

CREATE TABLE gps_points (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trip_id TEXT NOT NULL REFERENCES trips(id),
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  ts TEXT NOT NULL
);
```

### API Endpoints

| Method | Path | Body | Response |
|---|---|---|---|
| POST | /api/trips | {mode, weather, temp_c, note} | {id} |
| POST | /api/trips/:id/gps | {lat, lng, ts} | 201 |
| PUT | /api/trips/:id | {weather, temp_c, note, mode} | 200 |
| GET | /api/trips | — | [{trip, point_count}] |
| GET | /api/trips/:id | — | {trip, gps: [[lat,lng,ts],...]} |
| DELETE | /api/trips/:id | — | 204 |
| GET | /api/export | — | JSON dump of all trips+gps |

### Browser PWA
- `index.html` — single page, no build step
- GPS recording: `navigator.geolocation.watchPosition` at ~1s interval
- Map: Leaflet, show current position + trail
- Trip form: mode selector, weather selector, temp input, note textarea
- Start/stop recording → POST trip → stream GPS points to server
- Trip list: view past trips, click to see on map
- Offline: service worker caches static assets. GPS data queues in IndexedDB, syncs when online.

### Constraints
- No auth (single user, personal tool)
- No ORM (raw SQL via better-sqlite3)
- No TypeScript on server (plain JS, Bun runtime). Frontend can use TS if simple.
- SQLite file: `./data/commute.db`
- GPS points stored server-side, not just browser

### Build Order
1. Project init: `bun init`, install elysia + better-sqlite3 + @elysiajs/static
2. SQLite setup: create DB, tables, seed if empty
3. API: CRUD for trips + GPS points
4. Frontend: HTML shell + Leaflet map + GPS recording
5. Trip form + save flow
6. Trip list + view past trips
7. Export endpoint
8. Service worker for offline static cache
9. Dockerfile

### Flags
- Flag: GPS watchPosition must handle permission denial gracefully
- Flag: Don't use any build tools for frontend. Plain files served statically.
- Flag: `better-sqlite3` is synchronous — fine for single user, don't wrap in async

### Definition of Done
- [ ] `bun run src/index.ts` starts server, serves frontend at /
- [ ] Can start GPS recording, see trail on map, stop and save trip
- [ ] Trip appears in list with mode/weather/note
- [ ] Click trip → replay trail on map
- [ ] GET /api/export returns valid JSON with all data
- [ ] GPS points persist in SQLite (survive server restart)

---

## Builder Plan
*Builder adds their plan here before building. Architect reviews and approves.*

### Step 1 Plan — Full MVP

**Assumptions:**
- Bun runtime available (confirmed by brief)
- SQLite file at `./data/commute.db` (create `data/` dir if missing)
- Frontend served from `./public/` directory
- No auth needed (single user)

**Build Steps (verifiable checks):**

1. **Project init** — `bun init`, install deps (elysia, better-sqlite3, @elysiajs/static)
   - Check: `bun run src/index.ts` starts without error

2. **SQLite setup** — Create `src/db.ts`, init DB with trips + gps_points tables
   - Check: DB file created, tables exist

3. **API CRUD** — Implement all 7 endpoints in `src/index.ts`
   - POST/GET/PUT/DELETE trips, POST gps points, GET export
   - Check: `curl` tests pass for each endpoint

4. **Frontend shell** — `public/index.html` with Leaflet map + GPS watchPosition
   - Check: Browser shows map, current position marker appears

5. **Trip form** — Mode selector, weather, temp, note + start/stop recording
   - Check: Can start recording, GPS points stream to server

6. **Trip list** — Fetch trips, display list, click to replay trail
   - Check: Saved trips appear, clicking shows trail on map

7. **Export** — Verify GET /api/export returns all data
   - Check: JSON response contains all trips + GPS points

8. **Service worker** — Cache static assets for offline use
   - Check: App loads offline after first visit

9. **Dockerfile** — Multi-stage build, expose port
   - Check: `docker build` succeeds

**Uncertainties:**
- None — brief is clear

Architect approval: [ ] Approved / [ ] Redirect — see notes below
