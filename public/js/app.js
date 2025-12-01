const state = {
  robots: [],
  selectedRobotId: null,
  activeTab: 'overview',
  insights: {},
  isFallbackFleet: false
};

const auth = {
  token: localStorage.getItem('rebotToken') || null,
  user: null
};

const mapState = {
  map: null,
  tileLayer: null,
  pathLayer: null,
  marker: null,
  geofenceLayer: null
};

const chartState = {
  velocity: null,
  acceleration: null
};

const otaLogs = {};

const selectors = {
  loginView: document.getElementById('login-view'),
  appView: document.getElementById('app-view'),
  loginForm: document.getElementById('login-form'),
  loginUsername: document.getElementById('login-username'),
  loginPassword: document.getElementById('login-password'),
  loginMessage: document.getElementById('login-message'),
  logoutButton: document.getElementById('logout-btn'),
  fleetList: document.getElementById('fleet-list'),
  fleetCount: document.getElementById('fleet-count'),
  fleetSelector: document.getElementById('fleet-selector'),
  refreshButton: document.getElementById('refresh-btn'),
  lastRefresh: document.getElementById('last-refresh'),
  detailContent: document.getElementById('detail-content'),
  detailEmpty: document.getElementById('detail-empty'),
  detailName: document.getElementById('detail-name'),
  detailUniqueId: document.getElementById('detail-unique-id'),
  detailStatus: document.getElementById('detail-status'),
  detailStats: document.getElementById('detail-stats'),
  detailCommandLog: document.getElementById('detail-command-log'),
  statusForm: document.getElementById('status-form'),
  batteryInput: document.getElementById('battery-input'),
  signalInput: document.getElementById('signal-input'),
  powerStateInput: document.getElementById('power-state-input'),
  powerSubstateInput: document.getElementById('power-substate-input'),
  locationInput: document.getElementById('location-input'),
  missionInput: document.getElementById('mission-input'),
  notesInput: document.getElementById('notes-input'),
  tasksInput: document.getElementById('tasks-input'),
  uptimeInput: document.getElementById('uptime-input'),
  statusMessage: document.getElementById('status-message'),
  tabButtons: document.querySelectorAll('.tab-button'),
  tabPanels: document.querySelectorAll('[data-tab-panel]'),
  mapView: document.getElementById('map-view'),
  pathLogList: document.getElementById('path-log-list'),
  velocityChart: document.getElementById('velocity-chart'),
  accelerationChart: document.getElementById('acceleration-chart'),
  healthMotorTemp: document.getElementById('health-motor-temp'),
  healthCpu: document.getElementById('health-cpu'),
  healthBattery: document.getElementById('health-battery'),
  diagnosticList: document.getElementById('diagnostic-list'),
  alertList: document.getElementById('alert-list'),
  otaCurrent: document.getElementById('ota-current'),
  otaAvailable: document.getElementById('ota-available'),
  otaLastUpdate: document.getElementById('ota-last-update'),
  otaForm: document.getElementById('ota-form'),
  otaVersionInput: document.getElementById('ota-version-input'),
  otaLogList: document.getElementById('ota-log-list'),
  otaProgressFill: document.getElementById('ota-progress-fill'),
  otaStepsList: document.getElementById('ota-steps-list'),
  otaHistoryList: document.getElementById('ota-history-list'),
  otaFailureToggle: document.getElementById('ota-failure-toggle'),
  themeToggle: document.getElementById('theme-toggle-input'),
  jointShoulderInput: document.getElementById('joint-shoulder'),
  jointElbowInput: document.getElementById('joint-elbow'),
  jointWristInput: document.getElementById('joint-wrist'),
  jointShoulderValue: document.getElementById('joint-shoulder-value'),
  jointElbowValue: document.getElementById('joint-elbow-value'),
  jointWristValue: document.getElementById('joint-wrist-value'),
  manipulatorMessage: document.getElementById('manipulator-message'),
  manipulatorSendButton: document.getElementById('apply-manipulator-btn'),
  gripHoldButton: document.getElementById('grip-hold-btn'),
  gripReleaseButton: document.getElementById('grip-release-btn'),
  gripStatus: document.getElementById('grip-status'),
  armVisual: document.getElementById('arm-visual'),
  armUpper: document.getElementById('arm-upper'),
  armForearm: document.getElementById('arm-forearm'),
  armHand: document.getElementById('arm-hand'),
  jointElbowPreview: document.getElementById('joint-elbow-preview'),
  jointWristPreview: document.getElementById('joint-wrist-preview'),
  handEffector: document.getElementById('hand-effector')
};

const fingerSegments = ['finger-1', 'finger-2', 'finger-3', 'finger-4', 'finger-5'].map((prefix) => ({
  base: document.getElementById(`${prefix}-base`),
  tip: document.getElementById(`${prefix}-tip`),
  cap: document.getElementById(`${prefix}-cap`)
}));

const manipulatorState = {
  shoulder: 45,
  elbow: 60,
  wrist: 0,
  grip: 0
};
const ARM_LENGTHS = {
  upper: 110,
  forearm: 110,
  hand: 70
};
const FINGER_BASE_OFFSETS = [-0.35, -0.15, 0, 0.15, 0.35];
const FINGER_BASE_LENGTH = 55;
const FINGER_TIP_LENGTH = 35;
const ARM_BASE = { x: 160, y: 100 };

const capitalize = (value = '') => value.charAt(0).toUpperCase() + value.slice(1);
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const HACK_PREFIX = 'HACK_';
const HACK_PATTERN = /^HACK_(\d{1,5})$/;
const HACK_MIN = 1;
const HACK_MAX = 10000;
const ONLINE_SUBSTATE_OPTIONS = [
  { value: 'idle', label: 'Idle' },
  { value: 'charging', label: 'Charging' },
  { value: 'work', label: 'Work' }
];
const OFFLINE_SUBSTATE_OPTIONS = [
  { value: 'shutdown', label: 'Shutdown' },
  { value: 'power_disconnect', label: 'Power Disconnect' }
];
const ONLINE_SUBSTATE_SET = new Set(ONLINE_SUBSTATE_OPTIONS.map((option) => option.value));
const OFFLINE_SUBSTATE_SET = new Set(OFFLINE_SUBSTATE_OPTIONS.map((option) => option.value));

const MOCK_MODELS = ['Atlas Heavy', 'Scout Rover', 'Payload Lifter', 'Sentinel Drone', 'Surveyor XR'];
const MOCK_LOCATIONS = [
  'MG Road, Bengaluru',
  'Indiranagar, Bengaluru',
  'Whitefield, Bengaluru',
  'Electronic City, Bengaluru',
  'Hebbal, Bengaluru',
  'Peenya, Bengaluru'
];
const MOCK_MISSIONS = ['Perimeter Patrol', 'Cargo Transfer', 'Pipeline Inspection', 'Thermal Sweep', 'Rescue Standby'];
const MOCK_NOTES = [
  'Verified joint calibration before shift.',
  'Awaiting replacement lidar module.',
  'Power cycled after thermal warning cleared.',
  'Operator reported slight drift near dock.',
  'Ready for OTA validation sequence.'
];
const MOCK_COMMAND_TYPES = ['navigate', 'manipulator', 'ota', 'safety'];
const MOCK_COMMAND_VALUES = {
  navigate: ['waypoint-alpha', 'sector-7', 'grid-c3', 'return-home'],
  manipulator: ['joint-update', 'grip-hold', 'grip-release'],
  ota: ['firmware-check', 'ota-start', 'verify-version'],
  safety: ['estop-reset', 'clear-fault', 'enable-remote']
};
const BANGALORE_BASE = { lat: 12.9716, lng: 77.5946 };
const BANGALORE_NAV_PATH = [
  { label: 'Cubbon Park', lat: 12.9776, lng: 77.5993 },
  { label: 'MG Road', lat: 12.9716, lng: 77.5946 },
  { label: 'Koramangala', lat: 12.9352, lng: 77.6245 },
  { label: 'Whitefield', lat: 12.9836, lng: 77.7278 },
  { label: 'Yeshwanthpur', lat: 13.0285, lng: 77.5417 }
];
const BANGALORE_DEFAULT_GEOFENCE_RADIUS = 260;
const DEFAULT_HEALTH_TEMPLATE = {
  motorTemp: 48,
  cpuUsage: 36,
  batteryCycles: 512,
  diagnostics: [
    { name: 'Manipulator torque', status: 'ok' },
    { name: 'Power bus', status: 'ok' },
    { name: 'Vision system', status: 'ok' }
  ],
  alerts: []
};

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = (array = []) => array[randomInt(0, Math.max(array.length - 1, 0))];
const generateMockId = (index) => `mock-${index}-${Math.random().toString(16).slice(2, 8)}`;

const cloneDefaultHealth = () => ({
  motorTemp: DEFAULT_HEALTH_TEMPLATE.motorTemp,
  cpuUsage: DEFAULT_HEALTH_TEMPLATE.cpuUsage,
  batteryCycles: DEFAULT_HEALTH_TEMPLATE.batteryCycles,
  diagnostics: DEFAULT_HEALTH_TEMPLATE.diagnostics.map((diag) => ({ ...diag })),
  alerts: [...DEFAULT_HEALTH_TEMPLATE.alerts]
});

const withHealthDefaults = (health = {}) => ({
  motorTemp: health.motorTemp ?? DEFAULT_HEALTH_TEMPLATE.motorTemp,
  cpuUsage: health.cpuUsage ?? DEFAULT_HEALTH_TEMPLATE.cpuUsage,
  batteryCycles: health.batteryCycles ?? DEFAULT_HEALTH_TEMPLATE.batteryCycles,
  diagnostics:
    Array.isArray(health.diagnostics) && health.diagnostics.length
      ? health.diagnostics
      : DEFAULT_HEALTH_TEMPLATE.diagnostics.map((diag) => ({ ...diag })),
  alerts: Array.isArray(health.alerts) ? health.alerts : [...DEFAULT_HEALTH_TEMPLATE.alerts]
});

const createMockCommandLog = (count = 3) =>
  Array.from({ length: count }, (_, index) => {
    const type = randomItem(MOCK_COMMAND_TYPES);
    return {
      type,
      value: randomItem(MOCK_COMMAND_VALUES[type]),
      issuedAt: new Date(Date.now() - randomInt(index + 1, index + 5) * 60000).toISOString()
    };
  });

const buildMockPath = () =>
  BANGALORE_NAV_PATH.map((point, index, points) => ({
    lat: Number(point.lat.toFixed(5)),
    lng: Number(point.lng.toFixed(5)),
    label: point.label,
    timestamp: new Date(Date.now() - (points.length - index) * 300000).toISOString()
  }));

const createMockSeries = (length, base) =>
  Array.from({ length }, (_, t) => ({
    t,
    value: Number((base + Math.sin(t / 2) * base * 0.35 + Math.random() * 0.6).toFixed(2))
  }));

const createMockInsights = (robot, index = 0) => {
  const path = buildMockPath();
  const lastPoint = path[path.length - 1];
  const lastKnownLocation = { lat: lastPoint.lat, lng: lastPoint.lng };
  path[path.length - 1] = { ...path[path.length - 1], timestamp: new Date().toISOString() };
  const currentVersion = `v2.${(index % 4) + 1}.0`;
  return {
    telemetry: {
      timestamp: new Date().toISOString()
    },
    map: {
      lastKnownLocation,
      path,
      geofences: [
        {
          lat: lastKnownLocation.lat,
          lng: lastKnownLocation.lng,
          radius: BANGALORE_DEFAULT_GEOFENCE_RADIUS
        }
      ]
    },
    kinematics: {
      velocitySeries: createMockSeries(6, randomInt(2, 6)),
      accelerationSeries: createMockSeries(6, randomInt(1, 3))
    },
    health: withHealthDefaults(),
    ota: {
      currentVersion,
      availableVersion: currentVersion,
      lastUpdated: new Date(Date.now() - randomInt(1, 24) * 3600000).toISOString(),
      status: 'success'
    },
    firmwareHistory: [
      { version: currentVersion, appliedAt: new Date(Date.now() - 86400000).toISOString() },
      { version: 'v2.0.0', appliedAt: new Date(Date.now() - 86400000 * 15).toISOString() }
    ]
  };
};

const createMockRobot = (index) => {
  const isOnline = Math.random() > 0.25;
  const status = isOnline ? 'online' : 'offline';
  const subStatus = randomItem(isOnline ? ONLINE_SUBSTATE_OPTIONS : OFFLINE_SUBSTATE_OPTIONS)?.value ?? 'idle';
  const hackNumber = clamp(randomInt(index + 1, index + 200), HACK_MIN, HACK_MAX);
  const hackName = `${HACK_PREFIX}${hackNumber.toString().padStart(4, '0')}`;
  const anchorLocation = { ...BANGALORE_NAV_PATH[BANGALORE_NAV_PATH.length - 1] };
  return {
    id: generateMockId(index),
    name: hackName,
    identifier: hackName,
    hackName,
    status,
    subStatus,
    operationStatus: subStatus,
    model: randomItem(MOCK_MODELS),
    batteryLevel: randomInt(32, 98),
    temperatureC: randomInt(24, 70),
    signalStrength: randomInt(isOnline ? 62 : 12, 100),
    location: randomItem(MOCK_LOCATIONS),
    mission: randomItem(MOCK_MISSIONS),
    lastHeartbeat: new Date(Date.now() - randomInt(1, 90) * 60000).toISOString(),
    metrics: {
      tasksCompleted: randomInt(24, 620),
      uptimeHours: randomInt(120, 2400)
    },
    notes: randomItem(MOCK_NOTES),
    recentCommands: createMockCommandLog(randomInt(1, 4)),
    insightsLocation: anchorLocation
  };
};

const generateMockFleet = (count = 6) => Array.from({ length: count }, (_, index) => createMockRobot(index));

const parseHackNumber = (value = '') => {
  const match = HACK_PATTERN.exec(value);
  if (!match) {
    return null;
  }
  return clamp(Number(match[1]), HACK_MIN, HACK_MAX);
};

const ensureHackName = (robot, index = 0) => {
  const sources = [robot?.name, robot?.identifier, robot?.hackName];
  for (const source of sources) {
    const parsed = parseHackNumber(source);
    if (parsed !== null) {
      return `${HACK_PREFIX}${parsed}`;
    }
  }
  return `${HACK_PREFIX}${clamp(index + 1, HACK_MIN, HACK_MAX)}`;
};

const formatSubstateLabel = (value) => {
  if (!value) return '—';
  return value
    .split('_')
    .map((segment) => capitalize(segment))
    .join(' ');
};

const getSubstateOptions = (status) => (status === 'offline' ? OFFLINE_SUBSTATE_OPTIONS : ONLINE_SUBSTATE_OPTIONS);

const formatCoordinates = (location) =>
  location?.lat !== undefined && location?.lng !== undefined
    ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
    : '—';

const formatHeartbeat = (value) => (value ? new Date(value).toLocaleString() : '—');
const formatTimeOnly = (value) => (value ? new Date(value).toLocaleTimeString() : '—');
const formatTemperature = (value) => (value !== undefined ? `${value} °C` : '—');
const formatUptime = (value) => (value !== undefined ? `${value} h` : '—');
const degreesLabel = (value) => `${Math.round(value)}°`;

const normalizeRobot = (robot = {}, index = 0) => {
  const hackName = ensureHackName(robot, index);
  const resolvedSubstate = robot.subStatus || robot.operationStatus || 'idle';
  const resolvedStatus =
    robot.status || (OFFLINE_SUBSTATE_SET.has(resolvedSubstate) ? 'offline' : 'online');
  return {
    id: robot.id ?? `${hackName}-${index}`,
    name: robot.name ?? hackName,
    identifier: robot.identifier ?? hackName,
    hackName,
    model: robot.model ?? 'Multi-role',
    batteryLevel: robot.batteryLevel ?? 100,
    signalStrength: robot.signalStrength ?? 100,
    status: resolvedStatus,
    subStatus: resolvedSubstate,
    operationStatus: robot.operationStatus ?? resolvedSubstate,
    location: robot.location ?? '—',
    mission: robot.mission ?? 'Standby',
    lastHeartbeat: robot.lastHeartbeat ?? new Date().toISOString(),
    metrics: {
      tasksCompleted: robot.metrics?.tasksCompleted ?? 0,
      uptimeHours: robot.metrics?.uptimeHours ?? 0
    },
    temperatureC: robot.temperatureC ?? 0,
    notes: robot.notes ?? '',
    recentCommands: Array.isArray(robot.recentCommands) ? robot.recentCommands : [],
    insightsLocation: robot.insightsLocation
  };
};

const deriveConnectivity = (robot = {}) => {
  const status = robot.status ?? 'online';
  const substate = robot.subStatus ?? robot.operationStatus ?? (status === 'online' ? 'idle' : 'shutdown');
  return {
    status,
    substate,
    isOnline: status === 'online'
  };
};

const setSubstateOptions = (status = 'online', selectedValue) => {
  if (!selectors.powerSubstateInput) return;
  const options = getSubstateOptions(status);
  selectors.powerSubstateInput.innerHTML = '';
  options.forEach((option) => {
    const opt = document.createElement('option');
    opt.value = option.value;
    opt.textContent = option.label;
    selectors.powerSubstateInput.appendChild(opt);
  });
  if (selectedValue && options.some((option) => option.value === selectedValue)) {
    selectors.powerSubstateInput.value = selectedValue;
  } else if (options[0]) {
    selectors.powerSubstateInput.value = options[0].value;
  }
};

const syncPowerInputs = (robot) => {
  if (!selectors.powerStateInput || !selectors.powerSubstateInput || !robot) return;
  const connectivity = deriveConnectivity(robot);
  const stateValue = connectivity.isOnline ? 'online' : 'offline';
  selectors.powerStateInput.value = stateValue;
  setSubstateOptions(stateValue, connectivity.substate);
};

const applyRobotsToState = (robots = [], { fallback = false } = {}) => {
  state.robots = robots.map((robot, index) => normalizeRobot(robot, index));
  state.isFallbackFleet = fallback;
  if (state.selectedRobotId && !state.robots.some((robot) => robot.id === state.selectedRobotId)) {
    state.selectedRobotId = null;
  }
  if (!state.selectedRobotId && state.robots.length) {
    state.selectedRobotId = state.robots[0].id;
  }
  renderFleetList();
  renderDetail();
};

const useFallbackFleet = (count) => {
  const mockRobots = generateMockFleet(count ?? randomInt(5, 8));
  applyRobotsToState(mockRobots, { fallback: true });
  state.insights = state.robots.reduce((acc, robot, index) => {
    const mockInsight = createMockInsights(robot, index);
    acc[robot.id] = mockInsight;
    state.robots[index] = { ...robot, insightsLocation: mockInsight.map?.lastKnownLocation };
    return acc;
  }, {});
  renderFleetList();
  renderDetail();
};

const buildDefaultMapSnapshot = () => {
  const path = buildMockPath();
  const lastPoint = path[path.length - 1];
  const lastKnownLocation = { lat: lastPoint.lat, lng: lastPoint.lng };
  return {
    lastKnownLocation,
    path,
    geofences: [
      {
        lat: lastKnownLocation.lat,
        lng: lastKnownLocation.lng,
        radius: BANGALORE_DEFAULT_GEOFENCE_RADIUS
      }
    ]
  };
};

const ensurePathPoints = (path) => {
  const basePath = Array.isArray(path) && path.length ? path : buildMockPath();
  return basePath.map((point, index) => ({
    ...point,
    lat: Number(point.lat.toFixed(5)),
    lng: Number(point.lng.toFixed(5)),
    timestamp:
      point.timestamp ||
      new Date(Date.now() - (basePath.length - index) * 300000).toISOString()
  }));
};

const formatPathPointLabel = (point) => {
  const coords = `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`;
  return point.label ? `${point.label} · ${coords}` : coords;
};

const ensureMapDefaultsForRobot = (robot) => {
  if (!robot) return null;
  const insights = state.insights[robot.id] ?? {};
  if (!insights.map) {
    insights.map = buildDefaultMapSnapshot();
  }
  insights.map.path = ensurePathPoints(insights.map.path);
  if (!insights.map.lastKnownLocation) {
    const lastPoint = insights.map.path[insights.map.path.length - 1];
    insights.map.lastKnownLocation = { lat: lastPoint.lat, lng: lastPoint.lng };
  }
  if (!insights.map.geofences || !insights.map.geofences.length) {
    const { lat, lng } = insights.map.lastKnownLocation;
    insights.map.geofences = [
      {
        lat,
        lng,
        radius: BANGALORE_DEFAULT_GEOFENCE_RADIUS
      }
    ];
  }
  insights.health = withHealthDefaults(insights.health);
  state.insights[robot.id] = insights;
  return insights;
};

const buildStatsRows = (stats) => {
  if (!selectors.detailStats) return;
  selectors.detailStats.innerHTML = '';
  const headerRow = document.createElement('div');
  headerRow.className = 'stats-row stats-row-headers';
  const valueRow = document.createElement('div');
  valueRow.className = 'stats-row stats-row-values';

  stats.forEach(({ label, value }) => {
    const headerCell = document.createElement('span');
    headerCell.textContent = label;
    headerRow.appendChild(headerCell);

    const valueCell = document.createElement('span');
    valueCell.textContent = value;
    valueRow.appendChild(valueCell);
  });

  selectors.detailStats.append(headerRow, valueRow);
};

const renderOverviewStats = (robot) => {
  if (!robot) return;
  const connectivity = deriveConnectivity(robot);
  const statusSummary = `${connectivity.isOnline ? 'Online' : 'Offline'} · ${formatSubstateLabel(
    connectivity.substate
  )}`;
  const insightData = ensureMapDefaultsForRobot(robot) || {};
  const coordinates = insightData.map?.lastKnownLocation || robot.insightsLocation || BANGALORE_BASE;
  robot.insightsLocation = coordinates;
  const telemetryTime = insightData.telemetry?.timestamp || robot.lastHeartbeat;
  const stats = [
    { label: 'Status', value: statusSummary },
    { label: 'Battery', value: formatPercent(robot.batteryLevel) },
    { label: 'Location coordinates', value: formatCoordinates(coordinates) },
    { label: 'Heartbeat', value: formatHeartbeat(robot.lastHeartbeat) },
    { label: 'Location', value: robot.location || '—' },
    { label: 'Time', value: formatTimeOnly(telemetryTime) },
    { label: 'Uptime', value: formatUptime(robot.metrics?.uptimeHours) },
    { label: 'Temperature', value: formatTemperature(robot.temperatureC) }
  ];
  buildStatsRows(stats);
};

const toRadians = (deg) => (deg * Math.PI) / 180;

const updateArmPreview = () => {
  if (!selectors.armUpper || !selectors.armForearm || !selectors.armHand) return;
  const shoulderRad = toRadians(manipulatorState.shoulder);
  const elbowRad = shoulderRad + toRadians(manipulatorState.elbow);
  const wristRad = elbowRad + toRadians(manipulatorState.wrist);

  const shoulderEnd = {
    x: ARM_BASE.x + Math.sin(shoulderRad) * ARM_LENGTHS.upper,
    y: ARM_BASE.y - Math.cos(shoulderRad) * ARM_LENGTHS.upper
  };

  const wristPoint = {
    x: shoulderEnd.x + Math.sin(elbowRad) * ARM_LENGTHS.forearm,
    y: shoulderEnd.y - Math.cos(elbowRad) * ARM_LENGTHS.forearm
  };

  const handPoint = {
    x: wristPoint.x + Math.sin(wristRad) * ARM_LENGTHS.hand,
    y: wristPoint.y - Math.cos(wristRad) * ARM_LENGTHS.hand
  };

  const setLine = (el, start, end) => {
    el.setAttribute('x1', start.x.toFixed(1));
    el.setAttribute('y1', start.y.toFixed(1));
    el.setAttribute('x2', end.x.toFixed(1));
    el.setAttribute('y2', end.y.toFixed(1));
  };

  setLine(selectors.armUpper, ARM_BASE, shoulderEnd);
  setLine(selectors.armForearm, shoulderEnd, wristPoint);
  setLine(selectors.armHand, wristPoint, handPoint);

  if (selectors.jointElbowPreview) {
    selectors.jointElbowPreview.setAttribute('cx', shoulderEnd.x.toFixed(1));
    selectors.jointElbowPreview.setAttribute('cy', shoulderEnd.y.toFixed(1));
  }
  if (selectors.jointWristPreview) {
    selectors.jointWristPreview.setAttribute('cx', wristPoint.x.toFixed(1));
    selectors.jointWristPreview.setAttribute('cy', wristPoint.y.toFixed(1));
  }
  if (selectors.handEffector) {
    selectors.handEffector.setAttribute('cx', handPoint.x.toFixed(1));
    selectors.handEffector.setAttribute('cy', handPoint.y.toFixed(1));
  }

  const curl = manipulatorState.grip * 0.9;
  const spreadBase = 0.5 - manipulatorState.grip * 0.2;
  fingerSegments.forEach((finger, index) => {
    if (!finger.base || !finger.tip) return;
    const offset = FINGER_BASE_OFFSETS[index] * spreadBase;
    const baseAngle = wristRad + offset;
    const tipAngle = baseAngle + curl;

    const baseEnd = {
      x: handPoint.x + Math.sin(baseAngle) * FINGER_BASE_LENGTH,
      y: handPoint.y - Math.cos(baseAngle) * FINGER_BASE_LENGTH
    };
    const tipEnd = {
      x: baseEnd.x + Math.sin(tipAngle) * FINGER_TIP_LENGTH,
      y: baseEnd.y - Math.cos(tipAngle) * FINGER_TIP_LENGTH
    };

    setLine(finger.base, handPoint, baseEnd);
    setLine(finger.tip, baseEnd, tipEnd);
    if (finger.cap) {
      finger.cap.setAttribute('cx', tipEnd.x.toFixed(1));
      finger.cap.setAttribute('cy', tipEnd.y.toFixed(1));
    }
  });
};

const updateManipulatorUI = () => {
  if (selectors.jointShoulderInput) selectors.jointShoulderInput.value = manipulatorState.shoulder;
  if (selectors.jointElbowInput) selectors.jointElbowInput.value = manipulatorState.elbow;
  if (selectors.jointWristInput) selectors.jointWristInput.value = manipulatorState.wrist;
  if (selectors.jointShoulderValue) selectors.jointShoulderValue.textContent = degreesLabel(manipulatorState.shoulder);
  if (selectors.jointElbowValue) selectors.jointElbowValue.textContent = degreesLabel(manipulatorState.elbow);
  if (selectors.jointWristValue) selectors.jointWristValue.textContent = degreesLabel(manipulatorState.wrist);
  if (selectors.gripStatus) {
    selectors.gripStatus.textContent = `Grip: ${manipulatorState.grip >= 0.5 ? 'hold' : 'open'}`;
  }
  updateArmPreview();
};

const setGripState = (value) => {
  manipulatorState.grip = clamp(value, 0, 1);
  updateManipulatorUI();
};

const handleGripHold = () => {
  setGripState(1);
  setMessage(selectors.manipulatorMessage, 'Grip hold engaged.', 'success');
};

const handleGripRelease = () => {
  setGripState(0);
  setMessage(selectors.manipulatorMessage, 'Grip released.', 'success');
};

const toJSON = async (response) => {
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody.error || response.statusText || 'Unknown error';
    throw new Error(message);
  }
  return response.json();
};

const setToken = (token) => {
  auth.token = token;
  if (token) {
    localStorage.setItem('rebotToken', token);
  } else {
    localStorage.removeItem('rebotToken');
  }
};

const showLogin = (message) => {
  selectors.loginView.classList.remove('hidden');
  selectors.appView.classList.add('hidden');
  if (message) {
    setMessage(selectors.loginMessage, message, 'error');
  } else {
    setMessage(selectors.loginMessage, '', '');
  }
};

const showApp = () => {
  selectors.loginView.classList.add('hidden');
  selectors.appView.classList.remove('hidden');
};

const forceLogout = (message) => {
  setToken(null);
  auth.user = null;
  showLogin(message);
};

const apiFetch = async (url, options = {}) => {
  const headers = { ...(options.headers || {}) };
  if (auth.token) {
    headers.Authorization = `Bearer ${auth.token}`;
  }
  const response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    forceLogout('Session expired. Please sign in again.');
  }
  return response;
};

const fetchRobots = async () => {
  const response = await apiFetch('/api/robots');
  const json = await toJSON(response);
  return json.data ?? [];
};

const setMessage = (el, message, type) => {
  el.textContent = message;
  el.className = `helptext ${type || ''}`.trim();
};

const formatPercent = (value) => (value !== undefined ? `${value}%` : '—');

const getSelectedRobot = () => state.robots.find((robot) => robot.id === state.selectedRobotId);

const selectRobot = (robotId) => {
  state.selectedRobotId = robotId;
  state.activeTab = 'overview';
  renderFleetList();
  renderDetail();
  loadInsightsForRobot(robotId);
};

const renderFleetSelector = () => {
  if (!selectors.fleetSelector) return;
  const placeholderOption = document.createElement('option');
  placeholderOption.value = '';
  placeholderOption.textContent = 'Select robot';
  placeholderOption.disabled = true;
  placeholderOption.selected = !state.selectedRobotId;

  selectors.fleetSelector.innerHTML = '';
  selectors.fleetSelector.appendChild(placeholderOption);

  state.robots.forEach((robot) => {
    const option = document.createElement('option');
    option.value = String(robot.id);
    option.textContent = robot.hackName || robot.name;
    if (state.selectedRobotId && robot.id === state.selectedRobotId) {
      option.selected = true;
    }
    selectors.fleetSelector.appendChild(option);
  });

  selectors.fleetSelector.disabled = state.robots.length === 0;
  if (state.selectedRobotId) {
    selectors.fleetSelector.value = String(state.selectedRobotId);
  }
};

const renderFleetList = () => {
  selectors.fleetList.innerHTML = '';
  state.robots.forEach((robot, index) => {
    const item = document.createElement('li');
    item.className = `fleet-item${robot.id === state.selectedRobotId ? ' active' : ''}`;
    item.dataset.id = robot.id;

    const meta = document.createElement('div');
    meta.className = 'fleet-meta';
    meta.innerHTML = `<strong>${robot.hackName || robot.name}</strong><span class="robot-id">${robot.model || 'Multi-role'}</span>`;

    const status = document.createElement('div');
    const connectivity = deriveConnectivity(robot);
    status.className = `fleet-status ${connectivity.isOnline ? 'status-online' : 'status-offline'}`;
    const statusLabel = `${connectivity.isOnline ? 'Online' : 'Offline'} · ${formatSubstateLabel(
      connectivity.substate
    )}`;
    status.innerHTML = `<span class="status-dot"></span>${statusLabel}`;

    const readings = document.createElement('div');
    readings.className = 'fleet-readings';
    readings.innerHTML = `
      <span>Battery: ${formatPercent(robot.batteryLevel)}</span>
      <span>Signal: ${formatPercent(robot.signalStrength)}</span>
    `;

    item.append(meta, readings, status);
    item.addEventListener('click', () => selectRobot(robot.id));
    selectors.fleetList.appendChild(item);

    if (index === 0 && !state.selectedRobotId) {
      state.selectedRobotId = robot.id;
    }
  });

  if (state.selectedRobotId && !state.robots.some((robot) => robot.id === state.selectedRobotId)) {
    state.selectedRobotId = state.robots[0]?.id ?? null;
  }

  renderFleetSelector();
  const fleetLabel = state.isFallbackFleet
    ? `${state.robots.length} demo robots ready`
    : `${state.robots.length} robots available`;
  selectors.fleetCount.textContent = fleetLabel;
};

const renderDetail = () => {
  const robot = getSelectedRobot();
  if (!robot) {
    selectors.detailContent.classList.add('hidden');
    selectors.detailEmpty.classList.remove('hidden');
    return;
  }

  selectors.detailEmpty.classList.add('hidden');
  selectors.detailContent.classList.remove('hidden');

  selectors.detailName.textContent = robot.name;
  if (selectors.detailUniqueId) {
    selectors.detailUniqueId.textContent = robot.hackName || robot.name;
  }
  const connectivity = deriveConnectivity(robot);
  const detailStatusLabel = `${connectivity.isOnline ? 'Online' : 'Offline'} — ${formatSubstateLabel(
    connectivity.substate
  )}`;
  selectors.detailStatus.textContent = detailStatusLabel;
  selectors.detailStatus.classList.toggle('status-online', connectivity.isOnline);
  selectors.detailStatus.classList.toggle('status-offline', !connectivity.isOnline);
  syncPowerInputs(robot);

  renderOverviewStats(robot);

  selectors.detailCommandLog.innerHTML = '';
  if (!robot.recentCommands?.length) {
    const emptyLi = document.createElement('li');
    emptyLi.textContent = 'No commands issued yet.';
    selectors.detailCommandLog.appendChild(emptyLi);
  } else {
    robot.recentCommands.forEach((command) => {
      const li = document.createElement('li');
      const time = new Date(command.issuedAt).toLocaleTimeString();
      li.textContent = `[${time}] ${command.type}: ${command.value}`;
      selectors.detailCommandLog.appendChild(li);
    });
  }

  updateTabUI();
  renderInsights();
};

const updateTimestamp = () => {
  selectors.lastRefresh.textContent = `Last sync: ${new Date().toLocaleTimeString()}`;
};

const loadRobots = async () => {
  if (!auth.token) {
    return;
  }
  selectors.refreshButton.disabled = true;
  try {
    const robots = await fetchRobots();
    if (Array.isArray(robots) && robots.length) {
      applyRobotsToState(robots);
    } else {
      useFallbackFleet();
    }
    updateTimestamp();
  } catch (error) {
    console.error('Failed to load robots', error); // eslint-disable-line no-console
    if (!state.robots.length && auth.token) {
      useFallbackFleet();
      updateTimestamp();
    }
  } finally {
    selectors.refreshButton.disabled = false;
  }
};

const loadInsightsForRobot = async (robotId) => {
  if (!robotId) {
    return;
  }
  if (state.isFallbackFleet) {
    renderInsights();
    return;
  }
  if (!auth.token) {
    return;
  }
  try {
    const response = await apiFetch(`/api/robots/${robotId}/insights`);
    const json = await toJSON(response);
    state.insights[robotId] = json.data;
    renderInsights();
  } catch (error) {
    console.error('Failed to load insights', error); // eslint-disable-line no-console
  }
};

const collectStatusPayload = () => {
  const payload = {};
  const {
    batteryInput,
    signalInput,
    powerStateInput,
    powerSubstateInput,
    locationInput,
    missionInput,
    notesInput,
    tasksInput,
    uptimeInput
  } = selectors;
  if (batteryInput?.value) payload.batteryLevel = Number(batteryInput.value);
  if (signalInput?.value) payload.signalStrength = Number(signalInput.value);
  if (powerStateInput?.value) payload.status = powerStateInput.value;
  if (powerSubstateInput?.value) {
    payload.subStatus = powerSubstateInput.value;
    payload.operationStatus = powerSubstateInput.value;
  }
  if (locationInput?.value) payload.location = locationInput.value;
  if (missionInput?.value) payload.mission = missionInput.value;
  if (notesInput?.value) payload.notes = notesInput.value;

  const metrics = {};
  if (tasksInput?.value) metrics.tasksCompleted = Number(tasksInput.value);
  if (uptimeInput?.value) metrics.uptimeHours = Number(uptimeInput.value);
  if (Object.keys(metrics).length) {
    payload.metrics = metrics;
  }

  return payload;
};

const sendStatusUpdate = async (event) => {
  event.preventDefault();
  const robot = getSelectedRobot();
  if (!robot) {
    return setMessage(selectors.statusMessage, 'Select a robot first.', 'error');
  }
  const payload = collectStatusPayload();
  if (!Object.keys(payload).length) {
    return setMessage(selectors.statusMessage, 'Add at least one field to update.', 'error');
  }
  try {
    const response = await apiFetch(`/api/robots/${robot.id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    await toJSON(response);
    setMessage(selectors.statusMessage, 'Status update sent successfully.', 'success');
    selectors.statusForm.reset();
    await loadRobots();
  } catch (error) {
    setMessage(selectors.statusMessage, error.message, 'error');
  }
};

const parseMetadata = (value) => {
  if (!value) return undefined;
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error('Metadata must be valid JSON');
  }
};

const sendCommand = async ({ robotId, type, value, metadata }) => {
  const response = await apiFetch(`/api/robots/${robotId}/commands`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, value, metadata })
  });
  return toJSON(response);
};

const sendManipulatorCommand = async () => {
  const robot = getSelectedRobot();
  if (!robot) {
    return setMessage(selectors.manipulatorMessage, 'Select a robot first.', 'error');
  }
  try {
    await sendCommand({
      robotId: robot.id,
      type: 'manipulator',
      value: 'joint-update',
      metadata: {
        shoulder: manipulatorState.shoulder,
        elbow: manipulatorState.elbow,
        wrist: manipulatorState.wrist,
        grip: manipulatorState.grip >= 0.5 ? 'hold' : 'open'
      }
    });
    setMessage(selectors.manipulatorMessage, 'Joint update dispatched.', 'success');
  } catch (error) {
    setMessage(selectors.manipulatorMessage, error.message, 'error');
  }
};

const handleOtaSubmit = async (event) => {
  event.preventDefault();
  const robot = getSelectedRobot();
  if (!robot) {
    return setMessage(selectors.statusMessage, 'Select a robot first.', 'error');
  }
  const targetVersion = selectors.otaVersionInput.value.trim();
  const simulateFailure = selectors.otaFailureToggle?.checked;
  try {
    const response = await apiFetch(`/api/robots/${robot.id}/ota`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetVersion, simulateFailure })
    });
    const json = await toJSON(response);
    otaLogs[robot.id] = json.data.progressLog;
    if (!state.insights[robot.id]) {
      state.insights[robot.id] = {};
    }
    state.insights[robot.id].ota = {
      ...state.insights[robot.id].ota,
      currentVersion: json.data.targetVersion,
      availableVersion: json.data.targetVersion,
      status: json.data.status
    };
    state.insights[robot.id].firmwareHistory = json.data.history || [];
    renderOtaPanel();
    renderOtaLog(robot.id);
    renderOtaHistory(robot.id);
    if (selectors.otaFailureToggle) {
      selectors.otaFailureToggle.checked = false;
    }
  } catch (error) {
    setMessage(selectors.statusMessage, error.message, 'error');
  }
};

const handleLoginSubmit = async (event) => {
  event.preventDefault();
  const username = selectors.loginUsername.value.trim();
  const password = selectors.loginPassword.value.trim();
  if (!username || !password) {
    return setMessage(selectors.loginMessage, 'Enter username and password.', 'error');
  }

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const json = await toJSON(response);
    setToken(json.token);
    auth.user = json.user;
    selectors.loginForm.reset();
    showApp();
    setMessage(selectors.loginMessage, '', '');
    await loadRobots();
  } catch (error) {
    setMessage(selectors.loginMessage, error.message, 'error');
  }
};

const handleLogout = async () => {
  try {
    if (auth.token) {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    }
  } catch (error) {
    console.warn('Logout failed', error); // eslint-disable-line no-console
  } finally {
    forceLogout();
  }
};

selectors.refreshButton.addEventListener('click', loadRobots);
selectors.statusForm.addEventListener('submit', sendStatusUpdate);
selectors.loginForm.addEventListener('submit', handleLoginSubmit);
selectors.logoutButton.addEventListener('click', handleLogout);
selectors.otaForm.addEventListener('submit', handleOtaSubmit);
selectors.tabButtons.forEach((button) =>
  button.addEventListener('click', () => setActiveTab(button.dataset.tab))
);
selectors.themeToggle.addEventListener('change', (event) => {
  if (event.target.checked) {
    document.body.setAttribute('data-theme', 'dark');
  } else {
    document.body.removeAttribute('data-theme');
  }
});
selectors.powerStateInput?.addEventListener('change', (event) => {
  setSubstateOptions(event.target.value);
});
selectors.fleetSelector?.addEventListener('change', (event) => {
  const { value } = event.target;
  if (!value) return;
  const robot = state.robots.find((entry) => String(entry.id) === value);
  if (robot) {
    selectRobot(robot.id);
  }
});
[
  ['shoulder', selectors.jointShoulderInput],
  ['elbow', selectors.jointElbowInput],
  ['wrist', selectors.jointWristInput]
].forEach(([joint, input]) => {
  input?.addEventListener('input', (event) => {
    manipulatorState[joint] = Number(event.target.value);
    updateManipulatorUI();
  });
});
selectors.manipulatorSendButton?.addEventListener('click', sendManipulatorCommand);
selectors.gripHoldButton?.addEventListener('click', handleGripHold);
selectors.gripReleaseButton?.addEventListener('click', handleGripRelease);
updateManipulatorUI();
setSubstateOptions(selectors.powerStateInput?.value || 'online');

const bootstrap = async () => {
  if (!auth.token) {
    showLogin();
    return;
  }
  await loadRobots();
  if (auth.token) {
    showApp();
  }
};

bootstrap();

const renderInsights = () => {
  const robot = getSelectedRobot();
  if (!robot) return;
  const data = ensureMapDefaultsForRobot(robot);
  if (!data) return;
  robot.insightsLocation = data.map?.lastKnownLocation || BANGALORE_BASE;
  renderOverviewStats(robot);
  renderMapPanel(data);
  renderCharts(data);
  renderHealthPanel(data);
  renderOtaPanel();
  renderOtaLog(robot.id);
};

const updateTabUI = () => {
  setActiveTab(state.activeTab);
};

const setActiveTab = (tab) => {
  state.activeTab = tab;
  selectors.tabButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.tab === tab);
  });
  selectors.tabPanels.forEach((panel) => {
    panel.classList.toggle('hidden', panel.dataset.tabPanel !== tab);
  });
  if (tab === 'map' && mapState.map) {
    setTimeout(() => mapState.map.invalidateSize(), 200);
  }
};

const renderMapPanel = (insights) => {
  if (!insights?.map) {
    if (selectors.pathLogList) {
      selectors.pathLogList.innerHTML = '<li>No navigation history available.</li>';
    }
    return;
  }
  const path = ensurePathPoints(insights.map.path);
  const lastKnownLocation = insights.map.lastKnownLocation || path[path.length - 1];
  const geofences = insights.map.geofences;
  if (selectors.mapView && window.L) {
    if (!mapState.map) {
      mapState.map = window.L.map('map-view');
      mapState.tileLayer = window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
      }).addTo(mapState.map);
    }
    mapState.map.setView([lastKnownLocation.lat, lastKnownLocation.lng], 13);
    if (mapState.pathLayer) {
      mapState.map.removeLayer(mapState.pathLayer);
    }
    mapState.pathLayer = window.L.polyline(
      path.map((point) => [point.lat, point.lng]),
      { color: '#4cc9f0' }
    ).addTo(mapState.map);

    if (mapState.marker) {
      mapState.map.removeLayer(mapState.marker);
    }
    mapState.marker = window.L.marker([lastKnownLocation.lat, lastKnownLocation.lng]).addTo(mapState.map);

    if (mapState.geofenceLayer) {
      mapState.map.removeLayer(mapState.geofenceLayer);
    }
    if (geofences?.length) {
      const fence = geofences[0];
      mapState.geofenceLayer = window.L.circle([fence.lat, fence.lng], {
        radius: fence.radius,
        color: '#f72585',
        fillOpacity: 0.08
      }).addTo(mapState.map);
    }

    setTimeout(() => mapState.map.invalidateSize(), 250);
  }

  if ((!window.L || !selectors.mapView) && selectors.pathLogList) {
    const staticUrl = buildStaticMapUrl(path, lastKnownLocation);
    selectors.pathLogList.insertAdjacentHTML(
      'beforebegin',
      `<div class="static-map-preview"><img src="${staticUrl}" alt="Navigation path snapshot" /></div>`
    );
  }

  if (selectors.pathLogList) {
    const logEntries = path
      .slice()
      .reverse()
      .map(
        (point) =>
          `<li><strong>${new Date(point.timestamp).toLocaleTimeString()}</strong> · ${formatPathPointLabel(point)}</li>`
      )
      .join('');
    selectors.pathLogList.innerHTML = logEntries || '<li>No navigation history available.</li>';
  }
};

const buildStaticMapUrl = (path, center) => {
  const locationParam = path.map((point) => `${point.lat},${point.lng}`).join('|');
  const encodedPath = encodeURIComponent(
    `color:0x4cc9f0|weight:5|${path.map((point) => `${point.lat},${point.lng}`).join('|')}`
  );
  const centerParam = `${center.lat},${center.lng}`;
  return `https://maps.googleapis.com/maps/api/staticmap?size=640x320&path=${encodedPath}&markers=color:red%7C${locationParam}&center=${centerParam}&zoom=13&key=YOUR_GOOGLE_MAPS_KEY`;
};

const renderCharts = (insights) => {
  if (!window.Chart || !insights?.kinematics) return;
  const { velocitySeries, accelerationSeries } = insights.kinematics;
  if (selectors.velocityChart) {
    if (!chartState.velocity) {
      chartState.velocity = new window.Chart(selectors.velocityChart.getContext('2d'), {
        type: 'line',
        data: {
          labels: velocitySeries.map((point) => `T${point.t}`),
          datasets: [
            {
              label: 'Velocity (m/s)',
              data: velocitySeries.map((point) => point.value),
              borderColor: '#4cc9f0',
              tension: 0.3
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true }
          }
        }
      });
    } else {
      chartState.velocity.data.labels = velocitySeries.map((point) => `T${point.t}`);
      chartState.velocity.data.datasets[0].data = velocitySeries.map((point) => point.value);
      chartState.velocity.update();
    }
  }

  if (selectors.accelerationChart) {
    if (!chartState.acceleration) {
      chartState.acceleration = new window.Chart(selectors.accelerationChart.getContext('2d'), {
        type: 'line',
        data: {
          labels: accelerationSeries.map((point) => `T${point.t}`),
          datasets: [
            {
              label: 'Acceleration (m/s²)',
              data: accelerationSeries.map((point) => point.value),
              borderColor: '#f72585',
              tension: 0.3
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true }
          }
        }
      });
    } else {
      chartState.acceleration.data.labels = accelerationSeries.map((point) => `T${point.t}`);
      chartState.acceleration.data.datasets[0].data = accelerationSeries.map((point) => point.value);
      chartState.acceleration.update();
    }
  }
};

const renderHealthPanel = (insights) => {
  if (!insights?.health) return;
  const { health } = insights;
  selectors.healthMotorTemp.textContent = `${health.motorTemp} °C`;
  selectors.healthCpu.textContent = `${health.cpuUsage} %`;
  selectors.healthBattery.textContent = `${health.batteryCycles}`;
  selectors.diagnosticList.innerHTML = health.diagnostics
    .map((diag) => `<li><strong>${diag.name}</strong> · <span>${diag.status.toUpperCase()}</span></li>`)
    .join('');
  selectors.alertList.innerHTML = health.alerts?.length
    ? health.alerts.map((alert) => `<li>${alert}</li>`).join('')
    : '<li>No active alerts</li>';
};

const renderOtaPanel = () => {
  const robot = getSelectedRobot();
  if (!robot) return;
  const data = state.insights[robot.id];
  if (!data?.ota) return;
  selectors.otaCurrent.textContent = data.ota.currentVersion;
  selectors.otaAvailable.textContent = data.ota.availableVersion;
  selectors.otaLastUpdate.textContent = data.ota.lastUpdated
    ? new Date(data.ota.lastUpdated).toLocaleString()
    : '—';
  renderOtaHistory(robot.id);
};

const renderOtaLog = (robotId) => {
  if (!selectors.otaProgressFill) return;
  const entries = otaLogs[robotId];
  if (!entries || !entries.length) {
    selectors.otaLogList.innerHTML = '<li>No updates triggered yet.</li>';
    selectors.otaStepsList.innerHTML = '';
    selectors.otaProgressFill.style.width = '0%';
    selectors.otaProgressFill.classList.remove('failure');
    return;
  }
  selectors.otaLogList.innerHTML = entries
    .map(
      (entry) =>
        `<li><strong>Step ${entry.step}:</strong> ${entry.message} <span class="muted small">${new Date(
          entry.timestamp
        ).toLocaleTimeString()}</span></li>`
    )
    .join('');
  selectors.otaStepsList.innerHTML = entries
    .map((entry) => `<li><strong>${entry.progress}%</strong> · ${entry.message}</li>`)
    .join('');
  const latest = entries[entries.length - 1];
  selectors.otaProgressFill.style.width = `${latest.progress}%`;
  const status = state.insights[robotId]?.ota?.status || 'success';
  selectors.otaProgressFill.classList.toggle('failure', status === 'failed');
};

const renderOtaHistory = (robotId) => {
  if (!selectors.otaHistoryList) return;
  const data = state.insights[robotId];
  if (!data) return;
  const history = data.firmwareHistory || [];
  if (!history.length) {
    selectors.otaHistoryList.innerHTML = '<li>No firmware updates yet.</li>';
    return;
  }
  selectors.otaHistoryList.innerHTML = history
    .map(
      (entry) =>
        `<li><strong>${entry.version}</strong> · ${
          entry.appliedAt ? new Date(entry.appliedAt).toLocaleString() : '—'
        }</li>`
    )
    .join('');
};
