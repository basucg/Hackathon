const state = {
  robots: [],
  selectedRobotId: null,
  activeTab: 'overview',
  insights: {}
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
  operationInput: document.getElementById('operation-input'),
  locationInput: document.getElementById('location-input'),
  notesInput: document.getElementById('notes-input'),
  tasksInput: document.getElementById('tasks-input'),
  uptimeInput: document.getElementById('uptime-input'),
  statusMessage: document.getElementById('status-message'),
  tabButtons: document.querySelectorAll('.tab-button'),
  tabPanels: document.querySelectorAll('[data-tab-panel]'),
  teleopFeed: document.getElementById('teleop-feed'),
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
  armVisual: document.getElementById('arm-visual'),
  armUpper: document.getElementById('arm-upper'),
  armForearm: document.getElementById('arm-forearm'),
  armHand: document.getElementById('arm-hand'),
  jointElbowPreview: document.getElementById('joint-elbow-preview'),
  jointWristPreview: document.getElementById('joint-wrist-preview'),
  handEffector: document.getElementById('hand-effector')
};

const DESIGN_MINDS_PREFIX = 'HACK_DESIGNMINDS_';
const DESIGN_MINDS_PATTERN = /^HACK_DESIGNMINDS_\d+$/;
const ONLINE_SUBSTATES = new Set(['idle', 'charging', 'work']);
const manipulatorState = {
  shoulder: 45,
  elbow: 60,
  wrist: 0
};
const ARM_LENGTHS = {
  upper: 80,
  forearm: 70,
  hand: 40
};
const ARM_BASE = { x: 120, y: 210 };

const capitalize = (value = '') => value.charAt(0).toUpperCase() + value.slice(1);

const ensureDesignMindsId = (robot, index) => {
  const providedId = [robot.designMindsId, robot.uniqueId].find(
    (candidate) => typeof candidate === 'string' && DESIGN_MINDS_PATTERN.test(candidate)
  );
  if (providedId) {
    return providedId;
  }
  const derivedNumber =
    typeof robot.id === 'string' && robot.id.match(/\d+/)?.[0] ? robot.id.match(/\d+/)[0] : index + 1;
  return `${DESIGN_MINDS_PREFIX}${derivedNumber}`;
};

const normalizeRobot = (robot, index) => ({
  ...robot,
  designMindsId: ensureDesignMindsId(robot, index)
});

const normalizeSubstate = (status = '') => {
  const lower = status.toLowerCase();
  return ONLINE_SUBSTATES.has(lower) ? lower : 'idle';
};

const deriveConnectivity = (robot) => {
  const isOnline = (robot.signalStrength ?? 0) > 40 && (robot.batteryLevel ?? 0) > 15;
  return {
    isOnline,
    substate: isOnline ? normalizeSubstate(robot.operationStatus) : null
  };
};

const formatCoordinates = (location) =>
  location?.lat !== undefined && location?.lng !== undefined
    ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
    : '—';

const formatHeartbeat = (value) => (value ? new Date(value).toLocaleString() : '—');
const formatTimeOnly = (value) => (value ? new Date(value).toLocaleTimeString() : '—');
const formatTemperature = (value) => (value !== undefined ? `${value} °C` : '—');
const formatUptime = (value) => (value !== undefined ? `${value} h` : '—');
const degreesLabel = (value) => `${Math.round(value)}°`;

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
  const insightData = state.insights[robot.id] || {};
  const telemetryTime = insightData.telemetry?.timestamp || robot.lastHeartbeat;
  const stats = [
    { label: 'Battery', value: formatPercent(robot.batteryLevel) },
    { label: 'Location coordinates', value: formatCoordinates(robot.insightsLocation) },
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
};

const updateManipulatorUI = () => {
  if (selectors.jointShoulderInput) selectors.jointShoulderInput.value = manipulatorState.shoulder;
  if (selectors.jointElbowInput) selectors.jointElbowInput.value = manipulatorState.elbow;
  if (selectors.jointWristInput) selectors.jointWristInput.value = manipulatorState.wrist;
  if (selectors.jointShoulderValue) selectors.jointShoulderValue.textContent = degreesLabel(manipulatorState.shoulder);
  if (selectors.jointElbowValue) selectors.jointElbowValue.textContent = degreesLabel(manipulatorState.elbow);
  if (selectors.jointWristValue) selectors.jointWristValue.textContent = degreesLabel(manipulatorState.wrist);
  updateArmPreview();
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

const renderFleetList = () => {
  selectors.fleetList.innerHTML = '';
  state.robots.forEach((robot, index) => {
    const item = document.createElement('li');
    item.className = `fleet-item${robot.id === state.selectedRobotId ? ' active' : ''}`;
    item.dataset.id = robot.id;

    const meta = document.createElement('div');
    meta.className = 'fleet-meta';
    meta.innerHTML = `<strong>${robot.name}</strong><span class="robot-id">${robot.designMindsId}</span>`;

    const status = document.createElement('div');
    const connectivity = deriveConnectivity(robot);
    status.className = `fleet-status ${connectivity.isOnline ? 'status-online' : 'status-offline'}`;
    const statusLabel = connectivity.isOnline
      ? `Online · ${capitalize(connectivity.substate)}`
      : 'Offline';
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

  selectors.fleetCount.textContent = `${state.robots.length} robots available`;
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
    selectors.detailUniqueId.textContent = robot.designMindsId;
  }
  const connectivity = deriveConnectivity(robot);
  const detailStatusLabel = connectivity.isOnline
    ? `Online — ${capitalize(connectivity.substate)}`
    : 'Offline';
  selectors.detailStatus.textContent = detailStatusLabel;
  selectors.detailStatus.classList.toggle('status-online', connectivity.isOnline);
  selectors.detailStatus.classList.toggle('status-offline', !connectivity.isOnline);

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
    state.robots = robots.map((robot, index) => normalizeRobot(robot, index));
    renderFleetList();
    renderDetail();
    updateTimestamp();
  } catch (error) {
    console.error('Failed to load robots', error); // eslint-disable-line no-console
  } finally {
    selectors.refreshButton.disabled = false;
  }
};

const loadInsightsForRobot = async (robotId) => {
  if (!auth.token || !robotId) {
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
  const { batteryInput, signalInput, operationInput, locationInput, notesInput, tasksInput, uptimeInput } = selectors;
  if (batteryInput.value) payload.batteryLevel = Number(batteryInput.value);
  if (signalInput.value) payload.signalStrength = Number(signalInput.value);
  if (operationInput.value) payload.operationStatus = operationInput.value;
  if (locationInput.value) payload.location = locationInput.value;
  if (notesInput.value) payload.notes = notesInput.value;

  const metrics = {};
  if (tasksInput.value) metrics.tasksCompleted = Number(tasksInput.value);
  if (uptimeInput.value) metrics.uptimeHours = Number(uptimeInput.value);
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
      metadata: { ...manipulatorState }
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
updateManipulatorUI();

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
  const data = state.insights[robot.id];
  if (!data) return;
  robot.insightsLocation = data.map?.lastKnownLocation;
  renderOverviewStats(robot);
  if (selectors.teleopFeed && data.telemetry?.cameraFeedUrl) {
    selectors.teleopFeed.src = data.telemetry.cameraFeedUrl;
  }
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
  if (!selectors.mapView || !window.L || !insights?.map) return;
  const { lastKnownLocation, path, geofences } = insights.map;
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

  selectors.pathLogList.innerHTML = path
    .slice()
    .reverse()
    .map(
      (point) =>
        `<li><strong>${new Date(point.timestamp).toLocaleTimeString()}</strong> · ${point.lat.toFixed(
          4
        )}, ${point.lng.toFixed(4)}</li>`
    )
    .join('');

  setTimeout(() => mapState.map.invalidateSize(), 250);
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
