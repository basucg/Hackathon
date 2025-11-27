const {
  listRobots: getRobots,
  getRobotById,
  createRobot,
  updateRobotStatus,
  recordRobotCommand
} = require('../repositories/robotRepository');
const {
  getCurrentVersion,
  getHistory,
  recordVersion,
  ensureInitialVersion
} = require('../repositories/firmwareRepository');
const { getRobotInsights, simulateFirmwareUpdate } = require('../services/insightService');

const safeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const pickStatusPayload = (body = {}) => {
  const payload = {};

  if (body.batteryLevel !== undefined) {
    payload.batteryLevel = safeNumber(body.batteryLevel);
  }
  if (body.operationStatus) {
    payload.operationStatus = body.operationStatus;
  }
  if (body.temperatureC !== undefined) {
    payload.temperatureC = safeNumber(body.temperatureC);
  }
  if (body.signalStrength !== undefined) {
    payload.signalStrength = safeNumber(body.signalStrength);
  }
  if (body.location) {
    payload.location = body.location;
  }
  if (body.mission) {
    payload.mission = body.mission;
  }
  if (body.notes !== undefined) {
    payload.notes = body.notes;
  }
  if (body.metrics) {
    payload.metrics = {
      tasksCompleted: safeNumber(body.metrics.tasksCompleted),
      uptimeHours: safeNumber(body.metrics.uptimeHours)
    };
  }

  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== null)
  );
};

const listRobots = (req, res) => {
  res.json({ data: getRobots() });
};

const createRobotHandler = (req, res) => {
  const { name, model, mission } = req.body || {};
  if (!name) {
    return res.status(400).json({ error: 'Robot name is required' });
  }

  const robot = createRobot({
    name,
    model,
    mission,
    batteryLevel: safeNumber(req.body.batteryLevel) ?? 100,
    operationStatus: req.body.operationStatus ?? 'idle'
  });

  return res.status(201).json({ data: robot });
};

const getRobotHandler = (req, res) => {
  const robot = getRobotById(req.params.id);
  if (!robot) {
    return res.status(404).json({ error: 'Robot not found' });
  }
  return res.json({ data: robot });
};

const updateRobotStatusHandler = (req, res) => {
  const payload = pickStatusPayload(req.body);
  if (!Object.keys(payload).length) {
    return res.status(400).json({ error: 'Provide at least one status field to update' });
  }

  const robot = updateRobotStatus(req.params.id, payload);
  if (!robot) {
    return res.status(404).json({ error: 'Robot not found' });
  }
  return res.json({ data: robot });
};

const allowedDirections = new Set(['north', 'south', 'east', 'west', 'forward', 'backward', 'left', 'right', 'stop']);

const sendCommandHandler = (req, res) => {
  const { type, value, metadata } = req.body || {};
  if (!type || !value) {
    return res.status(400).json({ error: 'Command type and value are required' });
  }

  if (type === 'direction' && !allowedDirections.has(String(value).toLowerCase())) {
    return res.status(400).json({ error: 'Invalid direction command' });
  }

  const result = recordRobotCommand(req.params.id, {
    type,
    value,
    metadata
  });

  if (!result) {
    return res.status(404).json({ error: 'Robot not found' });
  }

  return res.status(201).json({ data: result });
};

const getInsightsHandler = (req, res) => {
  const robot = getRobotById(req.params.id);
  if (!robot) {
    return res.status(404).json({ error: 'Robot not found' });
  }
  const data = getRobotInsights(robot.id);
  const current = getCurrentVersion(robot.id);
  ensureInitialVersion(robot.id);
  data.ota.currentVersion = current.version;
  data.ota.availableVersion = data.ota.availableVersion || 'V1';
  data.firmwareHistory = getHistory(robot.id, 10);
  return res.json({ data });
};

const triggerOtaHandler = (req, res) => {
  const robot = getRobotById(req.params.id);
  if (!robot) {
    return res.status(404).json({ error: 'Robot not found' });
  }
  const payload = simulateFirmwareUpdate(robot.id, req.body);
  recordVersion(robot.id, payload.targetVersion);
  recordRobotCommand(robot.id, { type: 'ota', value: payload.targetVersion });
  return res.json({
    data: {
      ...payload,
      history: getHistory(robot.id, 20)
    }
  });
};

const sendModeHandler = (req, res) => {
  const robot = getRobotById(req.params.id);
  if (!robot) {
    return res.status(404).json({ error: 'Robot not found' });
  }
  const { mode, speed } = req.body || {};
  if (!mode) {
    return res.status(400).json({ error: 'Mode is required' });
  }
  const result = recordRobotCommand(robot.id, {
    type: 'mode',
    value: mode,
    metadata: { speed }
  });
  return res.status(201).json({ data: result });
};

module.exports = {
  listRobots,
  createRobotHandler,
  getRobotHandler,
  updateRobotStatusHandler,
  sendCommandHandler,
  getInsightsHandler,
  triggerOtaHandler,
  sendModeHandler
};
