import { Database } from "bun:sqlite";
import { join } from "path";

const DB_PATH = join(process.cwd(), "data", "commute.db");

const db = new Database(DB_PATH);

db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS trips (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    mode TEXT NOT NULL CHECK(mode IN ('walk','bus','bike')),
    weather TEXT CHECK(weather IN ('clear','cloudy','rain','snow','wind','cold','hot')),
    temp_c INTEGER,
    note TEXT,
    duration_sec INTEGER,
    distance_m REAL,
    kind TEXT NOT NULL DEFAULT 'trip'
  );

  CREATE TABLE IF NOT EXISTS gps_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id TEXT NOT NULL REFERENCES trips(id),
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    ts TEXT NOT NULL
  );
`);

// Auto-migrate existing DBs: add kind column if missing (no table rebuild needed)
const tripCols = db.query("PRAGMA table_info(trips)").all() as { name: string }[];
if (!tripCols.some((c) => c.name === "kind")) {
  db.exec("ALTER TABLE trips ADD COLUMN kind TEXT NOT NULL DEFAULT 'trip'");
}

export default db;
