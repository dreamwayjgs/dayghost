import { Elysia } from "elysia";
import { staticPlugin } from "@elysiajs/static";
import { join } from "path";
import { readFileSync } from "fs";
import db from "./db";

const BUILD_TIME = Date.now();
const publicDir = join(process.cwd(), "public");

const app = new Elysia()
  .get("/", () => {
    let html = readFileSync(join(publicDir, "index.html"), "utf-8");
    html = html.replace(
      "navigator.serviceWorker.register('/sw.js')",
      `navigator.serviceWorker.register('/sw.js?v=${BUILD_TIME}')`
    );
    return new Response(html, {
      headers: { "Content-Type": "text/html", "Cache-Control": "no-cache" },
    });
  })
  .get("/sw.js", () => {
    const sw = readFileSync(join(publicDir, "sw.js"), "utf-8");
    return new Response(sw, {
      headers: {
        "Content-Type": "application/javascript",
        "Cache-Control": "no-cache",
      },
    });
  })
  .use(staticPlugin({ assets: publicDir, prefix: "/" }))

  .post("/api/trips", ({ body }) => {
    const { mode, weather, temp_c, note, kind } = body as {
      mode: string;
      weather?: string;
      temp_c?: number;
      note?: string;
      kind?: string;
    };

    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    db.query(
      "INSERT INTO trips (id, timestamp, mode, weather, temp_c, note, kind) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(id, timestamp, mode, weather ?? null, temp_c ?? null, note ?? null, kind ?? "trip");

    return { id };
  })

  .post("/api/trips/:id/gps", ({ params, body }) => {
    const { id } = params;
    const { lat, lng, ts } = body as { lat: number; lng: number; ts: string };

    const trip = db.query("SELECT id FROM trips WHERE id = ?").get(id);
    if (!trip) {
      return new Response("Trip not found", { status: 404 });
    }

    db.query(
      "INSERT INTO gps_points (trip_id, lat, lng, ts) VALUES (?, ?, ?, ?)"
    ).run(id, lat, lng, ts);

    return new Response(null, { status: 201 });
  })

  .put("/api/trips/:id", ({ params, body }) => {
    const { id } = params;
    const { weather, temp_c, note, mode } = body as {
      weather?: string;
      temp_c?: number;
      note?: string;
      mode?: string;
    };

    const trip = db.query("SELECT id FROM trips WHERE id = ?").get(id);
    if (!trip) {
      return new Response("Trip not found", { status: 404 });
    }

    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (weather !== undefined) {
      fields.push("weather = ?");
      values.push(weather);
    }
    if (temp_c !== undefined) {
      fields.push("temp_c = ?");
      values.push(temp_c);
    }
    if (note !== undefined) {
      fields.push("note = ?");
      values.push(note);
    }
    if (mode !== undefined) {
      fields.push("mode = ?");
      values.push(mode);
    }

    if (fields.length === 0) {
      return new Response("No fields to update", { status: 400 });
    }

    values.push(id);
    db.query(`UPDATE trips SET ${fields.join(", ")} WHERE id = ?`).run(
      ...values
    );

    return new Response(null, { status: 200 });
  })

  .get("/api/trips", () => {
    const trips = db
      .query(
        `
        SELECT
          t.id, t.timestamp, t.mode, t.weather, t.temp_c, t.note, t.distance_m, t.kind,
          COALESCE(t.duration_sec,
            (SELECT CAST((julianday(MAX(ts)) - julianday(MIN(ts))) * 86400 AS INTEGER)
             FROM gps_points WHERE trip_id = t.id)) as duration_sec,
          (SELECT COUNT(*) FROM gps_points WHERE trip_id = t.id) as point_count
        FROM trips t
        ORDER BY t.timestamp DESC
      `
      )
      .all();

    return trips;
  })

  .get("/api/trips/:id", ({ params }) => {
    const { id } = params;

    const trip = db.query("SELECT * FROM trips WHERE id = ?").get(id) as
      | Record<string, unknown>
      | undefined;
    if (!trip) {
      return new Response("Trip not found", { status: 404 });
    }

    const gpsPoints = db
      .query("SELECT lat, lng, ts FROM gps_points WHERE trip_id = ? ORDER BY ts")
      .all(id) as { lat: number; lng: number; ts: string }[];

    const gps = gpsPoints.map((p) => [p.lat, p.lng, p.ts]);

    return { trip, gps };
  })

  .delete("/api/trips/:id", ({ params }) => {
    const { id } = params;

    const trip = db.query("SELECT id FROM trips WHERE id = ?").get(id);
    if (!trip) {
      return new Response("Trip not found", { status: 404 });
    }

    db.query("DELETE FROM gps_points WHERE trip_id = ?").run(id);
    db.query("DELETE FROM trips WHERE id = ?").run(id);

    return new Response(null, { status: 204 });
  })

  .get("/api/export", () => {
    const trips = db.query("SELECT * FROM trips ORDER BY timestamp").all();
    const gpsPoints = db.query("SELECT * FROM gps_points ORDER BY ts").all();

    return { trips, gps_points: gpsPoints };
  })

  .listen(3000);

console.log(`Server running at http://localhost:${app.server?.port}`);
