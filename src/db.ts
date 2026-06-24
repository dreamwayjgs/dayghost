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
    distance_m REAL
  );

  CREATE TABLE IF NOT EXISTS gps_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id TEXT NOT NULL REFERENCES trips(id),
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    ts TEXT NOT NULL
  );
`);

export default db;
