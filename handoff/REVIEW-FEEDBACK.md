# Review Feedback — Step 1
Date: 2026-06-24
Ready for Builder: YES

## Must Fix
None.

## Should Fix
- `Dockerfile:18` — No `EXPOSE 3000` or `CMD` directive. Works because Elysia binds to 3000 internally, but adding both makes the container self-documenting and standard. — Add `EXPOSE 3000` and `CMD ["bun", "run", "src/index.ts"]` at end of Dockerfile.
- `src/index.ts:82` — PUT endpoint builds SET clause via string concatenation. Safe today because mode is CHECK-constrained and other fields are typed, but no runtime validation of mode value before SQL execution. An invalid mode hits a DB error and returns raw 500. — Validate mode against allowed values before query, or wrap in try/catch returning 400.

## Escalate to Architect
None.

## Cleared
- `src/db.ts` — Schema correct, WAL mode, foreign keys, CHECK constraints on mode/weather.
- `src/index.ts:9-41` — POST /api/trips and POST /api/trips/:id/gps handle input cleanly, trip existence checked before GPS insert.
- `src/index.ts:89-122` — GET endpoints return correct shapes, point_count subquery is efficient.
- `src/index.ts:124-136` — DELETE properly cascades gps_points then trips.
- `src/index.ts:138-143` — GET /api/export returns full dataset as specified.
- `public/index.html` — Leaflet map initializes correctly, GPS watchPosition with high accuracy, haversine formula correct, trip list renders with all fields, trail replay works.
- `public/sw.js` — Cache-first for static assets, network-only for /api/ with 503 fallback. Offline GPS queue not implemented (known gap, acceptable).
- `.dockerignore` — Excludes node_modules, data, .db, .git.

## Roger Additions
- `public/index.html:209` — Stored XSS via unsanitized `t.note` in innerHTML. Richard cleared the HTML file but missed this security gap. Note text from API is interpolated into innerHTML without escaping. A note containing `<script>` or HTML would execute on trip list render. — Add a simple `esc()` helper (`s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')`) and wrap all user-data template interpolations, especially `t.note`.
- `Dockerfile:11` — Unnecessary `RUN bun run src/index.ts --build 2>/dev/null || true` adds ~10s to build time with zero value. The server starts and immediately fails (no data/ dir), error is silenced. — Remove this line.
