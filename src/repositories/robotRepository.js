const db = require('../db/client');
const { generateId } = require('../utils/id');
const firmwareRepo = require('./firmwareRepository');

const defaultRobots = [
  {
    name: 'Atlas-01',
    model: 'Atlas Heavy',
    batteryLevel: 82,
    operationStatus: 'idle',
    temperatureC: 32,
    signalStrength: 94,
    location: 'Charging Dock',
    mission: 'On-Call Maintenance',
    metrics: { tasksCompleted: 128, uptimeHours: 413 }
  },
  {
    name: 'Scout-17',
    model: 'Scout Rover',
    batteryLevel: 57,
    operationStatus: 'patrolling',
    temperatureC: 28,
    signalStrength: 88,
    location: 'Sector C',
    mission: 'Perimeter Patrol',
    metrics: { tasksCompleted: 64, uptimeHours: 189 }
  },
  {
    name: 'Lifter-03',
    model: 'Payload Lifter',
    batteryLevel: 36,
    operationStatus: 'loading',
    temperatureC: 41,
    signalStrength: 72,
    location: 'Warehouse Bay',
    mission: 'Cargo Transfer',
    metrics: { tasksCompleted: 342, uptimeHours: 1032 }
  }
];

const robotRowToEntity = (row) => {
  const firmware = firmwareRepo.getCurrentVersion(row.id);
  return {
    id: row.id,
    name: row.name,
    model: row.model,
    batteryLevel: row.batteryLevel,
    operationStatus: row.operationStatus,
    temperatureC: row.temperatureC,
    signalStrength: row.signalStrength,
    location: row.location,
    mission: row.mission,
    lastHeartbeat: row.lastHeartbeat,
    metrics: {
      tasksCompleted: row.tasksCompleted,
      uptimeHours: row.uptimeHours
    },
    notes: row.notes,
    firmwareVersion: firmware.version,
    recentCommands: []
  };
};

const commandRowToEntity = (row) => ({
  id: row.id,
  type: row.type,
  value: row.value,
  metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
  issuedAt: row.issuedAt
});

const insertRobotStmt = db.prepare(`
INSERT INTO robots (id, name, model, batteryLevel, operationStatus, temperatureC, signalStrength, location, mission, lastHeartbeat, tasksCompleted, uptimeHours, notes)
VALUES (@id, @name, @model, @batteryLevel, @operationStatus, @temperatureC, @signalStrength, @location, @mission, @lastHeartbeat, @tasksCompleted, @uptimeHours, @notes)
`);

const updateRobotStmt = (setClause) =>
  db.prepare(`UPDATE robots SET ${setClause} WHERE id = @id`);

const insertCommandStmt = db.prepare(`
INSERT INTO robot_commands (id, robotId, type, value, metadata, issuedAt)
VALUES (@id, @robotId, @type, @value, @metadata, @issuedAt)
`);

const selectRobotsStmt = db.prepare('SELECT * FROM robots ORDER BY name');
const selectRobotByIdStmt = db.prepare('SELECT * FROM robots WHERE id = ?');
const countRobotsStmt = db.prepare('SELECT COUNT(1) as count FROM robots');
const selectCommandsForRobotStmt = db.prepare(`
SELECT * FROM robot_commands
WHERE robotId = ?
ORDER BY issuedAt DESC
LIMIT 10
`);

const seedIfEmpty = () => {
  const { count } = countRobotsStmt.get();
  if (count > 0) {
    return;
  }
  defaultRobots.forEach((robot) => {
    createRobot(robot);
  });
};

const attachCommands = (robot) => {
  if (!robot) return robot;
  const commands = selectCommandsForRobotStmt.all(robot.id).map(commandRowToEntity);
  return {
    ...robot,
    recentCommands: commands
  };
};

const buildRobotRecord = (payload) => ({
  id: payload.id ?? generateId(12),
  name: payload.name,
  model: payload.model ?? 'Generic',
  batteryLevel: payload.batteryLevel ?? 100,
  operationStatus: payload.operationStatus ?? 'idle',
  temperatureC: payload.temperatureC ?? 25,
  signalStrength: payload.signalStrength ?? 100,
  location: payload.location ?? 'Dock',
  mission: payload.mission ?? 'Standby',
  lastHeartbeat: payload.lastHeartbeat ?? new Date().toISOString(),
  tasksCompleted: payload.metrics?.tasksCompleted ?? payload.tasksCompleted ?? 0,
  uptimeHours: payload.metrics?.uptimeHours ?? payload.uptimeHours ?? 0,
  notes: payload.notes ?? 'New robot onboarded'
});

const listRobots = () => {
  seedIfEmpty();
  return selectRobotsStmt.all().map((row) => attachCommands(robotRowToEntity(row)));
};

const getRobotById = (id) => {
  const row = selectRobotByIdStmt.get(id);
  if (!row) {
    return null;
  }
  return attachCommands(robotRowToEntity(row));
};

const createRobot = (payload) => {
  const record = buildRobotRecord(payload);
  insertRobotStmt.run(record);
  firmwareRepo.ensureInitialVersion(record.id);
  return getRobotById(record.id);
};

const updateRobotStatus = (id, statusPayload) => {
  const updates = [];
  const params = { id };

  if (statusPayload.batteryLevel !== undefined) {
    updates.push('batteryLevel = @batteryLevel');
    params.batteryLevel = statusPayload.batteryLevel;
  }
  if (statusPayload.operationStatus) {
    updates.push('operationStatus = @operationStatus');
    params.operationStatus = statusPayload.operationStatus;
  }
  if (statusPayload.temperatureC !== undefined) {
    updates.push('temperatureC = @temperatureC');
    params.temperatureC = statusPayload.temperatureC;
  }
  if (statusPayload.signalStrength !== undefined) {
    updates.push('signalStrength = @signalStrength');
    params.signalStrength = statusPayload.signalStrength;
  }
  if (statusPayload.location) {
    updates.push('location = @location');
    params.location = statusPayload.location;
  }
  if (statusPayload.mission) {
    updates.push('mission = @mission');
    params.mission = statusPayload.mission;
  }
  if (statusPayload.notes !== undefined) {
    updates.push('notes = @notes');
    params.notes = statusPayload.notes;
  }
  if (statusPayload.metrics?.tasksCompleted !== undefined) {
    updates.push('tasksCompleted = @tasksCompleted');
    params.tasksCompleted = statusPayload.metrics.tasksCompleted;
  }
  if (statusPayload.metrics?.uptimeHours !== undefined) {
    updates.push('uptimeHours = @uptimeHours');
    params.uptimeHours = statusPayload.metrics.uptimeHours;
  }

  updates.push('lastHeartbeat = @lastHeartbeat');
  params.lastHeartbeat = new Date().toISOString();

  if (!updates.length) {
    return getRobotById(id);
  }

  const stmt = updateRobotStmt(updates.join(', '));
  const result = stmt.run(params);
  if (result.changes === 0) {
    return null;
  }

  return getRobotById(id);
};

const recordRobotCommand = (id, payload) => {
  const robot = getRobotById(id);
  if (!robot) {
    return null;
  }

  const command = {
    id: generateId(16),
    robotId: id,
    type: payload.type,
    value: payload.value,
    metadata: payload.metadata ? JSON.stringify(payload.metadata) : null,
    issuedAt: new Date().toISOString()
  };

  insertCommandStmt.run(command);
  return { robot: getRobotById(id), command: commandRowToEntity(command) };
};

module.exports = {
  listRobots,
  getRobotById,
  createRobot,
  updateRobotStatus,
  recordRobotCommand
};
