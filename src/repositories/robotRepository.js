const db = require('../db/client');
const { generateId } = require('../utils/id');
const firmwareRepo = require('./firmwareRepository');

const HACK_PREFIX = 'HACK_';
const HACK_MIN = 1;
const HACK_MAX = 10000;
let hackSequence = HACK_MIN;

const clampHackNumber = (value) => Math.min(Math.max(value, HACK_MIN), HACK_MAX);
const parseHackNumber = (value = '') => {
  const match = /^HACK_(\d{1,5})$/i.exec(value);
  if (!match) {
    return null;
  }
  return clampHackNumber(Number(match[1]));
};

const nextHackNumber = () => {
  const current = hackSequence;
  hackSequence = hackSequence >= HACK_MAX ? HACK_MIN : hackSequence + 1;
  return current;
};

const advanceHackSequence = (usedNumber) => {
  if (typeof usedNumber !== 'number') return;
  const clamped = clampHackNumber(usedNumber);
  if (clamped >= hackSequence) {
    hackSequence = clamped + 1;
    if (hackSequence > HACK_MAX) {
      hackSequence = HACK_MIN;
    }
  }
};

const deriveHackIdentity = (value, fallbackNumber) => {
  const parsed = parseHackNumber(value);
  const number = parsed ?? clampHackNumber(fallbackNumber ?? nextHackNumber());
  advanceHackSequence(number);
  return {
    number,
    identifier: `${HACK_PREFIX}${number}`
  };
};

const defaultRobots = [
  {
    hackNumber: 1,
    status: 'online',
    subStatus: 'idle',
    model: 'Atlas Heavy',
    batteryLevel: 82,
    temperatureC: 32,
    signalStrength: 94,
    location: 'Charging Dock',
    mission: 'Routine Maintenance',
    metrics: { tasksCompleted: 128, uptimeHours: 413 }
  },
  {
    hackNumber: 2,
    status: 'online',
    subStatus: 'work',
    model: 'Scout Rover',
    batteryLevel: 57,
    temperatureC: 28,
    signalStrength: 88,
    location: 'Sector C',
    mission: 'Perimeter Patrol',
    metrics: { tasksCompleted: 64, uptimeHours: 189 }
  },
  {
    hackNumber: 3,
    status: 'offline',
    subStatus: 'shutdown',
    model: 'Payload Lifter',
    batteryLevel: 36,
    temperatureC: 41,
    signalStrength: 12,
    location: 'Warehouse Bay',
    mission: 'Cargo Transfer',
    metrics: { tasksCompleted: 342, uptimeHours: 1032 }
  }
];

const robotRowToEntity = (row) => {
  firmwareRepo.ensureInitialVersion(row.id);
  const firmware = firmwareRepo.getCurrentVersion(row.id);
  return {
    id: row.id,
    name: row.name,
    identifier: row.identifier,
    model: row.model,
    batteryLevel: row.batteryLevel,
    operationStatus: row.operationStatus,
    status: row.status || 'online',
    subStatus: row.subStatus || row.operationStatus || 'idle',
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
INSERT INTO robots (id, name, identifier, status, subStatus, model, batteryLevel, operationStatus, temperatureC, signalStrength, location, mission, lastHeartbeat, tasksCompleted, uptimeHours, notes)
VALUES (@id, @name, @identifier, @status, @subStatus, @model, @batteryLevel, @operationStatus, @temperatureC, @signalStrength, @location, @mission, @lastHeartbeat, @tasksCompleted, @uptimeHours, @notes)
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

const buildRobotRecord = (payload = {}) => {
  const derived = deriveHackIdentity(payload.name ?? payload.identifier, payload.hackNumber);
  const resolvedSubStatus = payload.subStatus ?? payload.operationStatus ?? 'idle';
  const resolvedStatus = payload.status ?? (OFFLINE_SUBSTATE_SET.has(resolvedSubStatus) ? 'offline' : 'online');
  return {
    id: payload.id ?? generateId(12),
    name: derived.identifier,
    identifier: derived.identifier,
    status: resolvedStatus,
    subStatus: resolvedSubStatus,
    model: payload.model ?? 'Generic',
    batteryLevel: payload.batteryLevel ?? 100,
    operationStatus: resolvedSubStatus,
    temperatureC: payload.temperatureC ?? 25,
    signalStrength: payload.signalStrength ?? 100,
    location: payload.location ?? 'Dock',
    mission: payload.mission ?? 'Standby',
    lastHeartbeat: payload.lastHeartbeat ?? new Date().toISOString(),
    tasksCompleted: payload.metrics?.tasksCompleted ?? payload.tasksCompleted ?? 0,
    uptimeHours: payload.metrics?.uptimeHours ?? payload.uptimeHours ?? 0,
    notes: payload.notes ?? 'New robot onboarded'
  };
};

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

const updateRobotStatus = (id, statusPayload = {}) => {
  const updates = [];
  const params = { id };

  if (statusPayload.batteryLevel !== undefined) {
    updates.push('batteryLevel = @batteryLevel');
    params.batteryLevel = statusPayload.batteryLevel;
  }
  if (statusPayload.status) {
    updates.push('status = @status');
    params.status = statusPayload.status;
  }
  if (statusPayload.subStatus) {
    updates.push('subStatus = @subStatus');
    params.subStatus = statusPayload.subStatus;
  }
  const nextOperationStatus = statusPayload.operationStatus || statusPayload.subStatus;
  if (nextOperationStatus) {
    updates.push('operationStatus = @operationStatus');
    params.operationStatus = nextOperationStatus;
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
