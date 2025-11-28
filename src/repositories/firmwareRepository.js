const db = require('../db/client');

const insertVersionStmt = db.prepare(`
INSERT INTO robot_firmware_history (robotId, version, appliedAt)
VALUES (@robotId, @version, @appliedAt)
`);

const selectLatestStmt = db.prepare(`
SELECT version, appliedAt
FROM robot_firmware_history
WHERE robotId = ?
ORDER BY appliedAt DESC, id DESC
LIMIT 1
`);

const selectHistoryStmt = db.prepare(`
SELECT version, appliedAt
FROM robot_firmware_history
WHERE robotId = @robotId
ORDER BY appliedAt DESC, id DESC
LIMIT @limit
`);

const countHistoryStmt = db.prepare('SELECT COUNT(1) as count FROM robot_firmware_history WHERE robotId = ?');

const ensureInitialVersion = (robotId) => {
  const { count } = countHistoryStmt.get(robotId);
  if (count > 0) {
    return;
  }
  recordVersion(robotId, 'V1');
};

const recordVersion = (robotId, version) => {
  insertVersionStmt.run({
    robotId,
    version,
    appliedAt: new Date().toISOString()
  });
};

const getCurrentVersion = (robotId) => {
  const row = selectLatestStmt.get(robotId);
  if (!row) {
    return { version: 'V1', appliedAt: null };
  }
  return row;
};

const getHistory = (robotId, limit = 10) => {
  return selectHistoryStmt
    .all({ robotId, limit })
    .map((row) => ({
      version: row.version,
      appliedAt: row.appliedAt
    }));
};

module.exports = {
  ensureInitialVersion,
  recordVersion,
  getCurrentVersion,
  getHistory
};
