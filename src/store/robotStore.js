const { nanoid } = require('nanoid');

const robots = new Map();

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

const buildRobot = (robot) => ({
  id: robot.id ?? nanoid(8),
  name: robot.name,
  model: robot.model ?? 'Generic',
  batteryLevel: robot.batteryLevel ?? 100,
  operationStatus: robot.operationStatus ?? 'idle',
  temperatureC: robot.temperatureC ?? 25,
  signalStrength: robot.signalStrength ?? 100,
  location: robot.location ?? 'Dock',
  mission: robot.mission ?? 'Standby',
  lastHeartbeat: robot.lastHeartbeat ?? new Date().toISOString(),
  metrics: {
    tasksCompleted: robot.metrics?.tasksCompleted ?? 0,
    uptimeHours: robot.metrics?.uptimeHours ?? 0
  },
  notes: robot.notes ?? '',
  recentCommands: robot.recentCommands ?? []
});

const seedIfEmpty = () => {
  if (robots.size) {
    return;
  }
  defaultRobots.forEach((robot) => {
    const record = buildRobot(robot);
    robots.set(record.id, record);
  });
};

const getRobots = () => {
  seedIfEmpty();
  return Array.from(robots.values());
};

const getRobotById = (id) => robots.get(id);

const createRobot = (payload) => {
  const record = buildRobot(payload);
  record.notes ||= 'New robot onboarded';
  robots.set(record.id, record);
  return record;
};

const updateRobotStatus = (id, statusPayload) => {
  const robot = robots.get(id);
  if (!robot) {
    return null;
  }

  const next = {
    ...robot,
    ...statusPayload,
    metrics: {
      ...robot.metrics,
      ...statusPayload.metrics
    },
    lastHeartbeat: new Date().toISOString()
  };

  robots.set(id, next);
  return next;
};

const recordRobotCommand = (id, commandPayload) => {
  const robot = robots.get(id);
  if (!robot) {
    return null;
  }

  const commandRecord = {
    id: nanoid(6),
    issuedAt: new Date().toISOString(),
    ...commandPayload
  };

  const updated = {
    ...robot,
    recentCommands: [commandRecord, ...robot.recentCommands].slice(0, 10)
  };

  robots.set(id, updated);
  return { robot: updated, command: commandRecord };
};

module.exports = {
  getRobots,
  getRobotById,
  createRobot,
  updateRobotStatus,
  recordRobotCommand
};
