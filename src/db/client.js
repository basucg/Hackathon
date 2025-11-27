const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dataDir = path.join(__dirname, '..', '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'robots.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS robots (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  model TEXT,
  batteryLevel INTEGER DEFAULT 100,
  operationStatus TEXT DEFAULT 'idle',
  temperatureC REAL DEFAULT 25,
  signalStrength INTEGER DEFAULT 100,
  location TEXT,
  mission TEXT,
  lastHeartbeat TEXT,
  tasksCompleted INTEGER DEFAULT 0,
  uptimeHours INTEGER DEFAULT 0,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS robot_commands (
  id TEXT PRIMARY KEY,
  robotId TEXT NOT NULL,
  type TEXT NOT NULL,
  value TEXT NOT NULL,
  metadata TEXT,
  issuedAt TEXT NOT NULL,
  FOREIGN KEY(robotId) REFERENCES robots(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_robot_commands_robotId ON robot_commands(robotId);
`);

module.exports = db;
