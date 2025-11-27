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
  detailModel: document.getElementById('detail-model'),
  detailMission: document.getElementById('detail-mission'),
  detailStatus: document.getElementById('detail-status'),
  detailStats: document.getElementById('detail-stats'),
  detailCommandLog: document.getElementById('detail-command-log'),
  statusForm: document.getElementById('status-form'),
  batteryInput: document.getElementById('battery-input'),
  signalInput: document.getElementById('signal-input'),
  operationInput: document.getElementById('operation-input'),
  locationInput: document.getElementById('location-input'),
  missionInput: document.getElementById('mission-input'),
  notesInput: document.getElementById('notes-input'),
  tasksInput: document.getElementById('tasks-input'),
  uptimeInput: document.getElementById('uptime-input'),
  statusMessage: document.getElementById('status-message'),
  commandTypeInput: document.getElementById('command-type-input'),
  commandValueInput: document.getElementById('command-value-input'),
  commandMetaInput: document.getElementById('command-meta-input'),
  commandMessage: document.getElementById('command-message'),
  directionPad: document.querySelector('.direction-pad'),
  customCommandForm: document.getElementById('custom-command-form'),
  tabButtons: document.querySelectorAll('.tab-button'),
  tabPanels: document.querySelectorAll('[data-tab-panel]'),
  teleopFeed: document.getElementById('teleop-feed'),
  speedSlider: document.getElementById('speed-slider'),
  modeButtons: document.querySelectorAll('.mode-buttons button'),
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
  themeToggle: document.getElementById('theme-toggle-input')
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
const formatNumber = (value) => (value !== undefined ? value : '—');

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
    meta.innerHTML = `<strong>${robot.name}</strong><span>${robot.model}</span>`;

    const status = document.createElement('div');
    const isOnline = (robot.signalStrength ?? 0) > 40 && (robot.batteryLevel ?? 0) > 15;
    status.className = `fleet-status ${isOnline ? 'status-online' : 'status-offline'}`;
    status.innerHTML = `<span class="status-dot"></span>${isOnline ? 'Online' : 'Offline'}`;

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

  selectors.fleetCount.textContent = `${state.robots.length} robots online`;
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
  selectors.detailModel.textContent = robot.model;
  selectors.detailMission.textContent = robot.mission || 'No mission assigned';
  selectors.detailStatus.textContent = robot.operationStatus;

  const statMap = [
    ['Battery', formatPercent(robot.batteryLevel)],
    ['Signal', formatPercent(robot.signalStrength)],
    ['Temperature (°C)', formatNumber(robot.temperatureC)],
    ['Location', robot.location || '—'],
    ['Tasks completed', formatNumber(robot.metrics?.tasksCompleted)],
    ['Uptime (hours)', formatNumber(robot.metrics?.uptimeHours)],
    ['Last heartbeat', robot.lastHeartbeat ? new Date(robot.lastHeartbeat).toLocaleString() : '—'],
    ['Notes', robot.notes || '—']
  ];

  selectors.detailStats.innerHTML = '';
  statMap.forEach(([label, value]) => {
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.textContent = value;
    selectors.detailStats.append(dt, dd);
  });

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
    state.robots = await fetchRobots();
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
  const { batteryInput, signalInput, operationInput, locationInput, missionInput, notesInput, tasksInput, uptimeInput } =
    selectors;
  if (batteryInput.value) payload.batteryLevel = Number(batteryInput.value);
  if (signalInput.value) payload.signalStrength = Number(signalInput.value);
  if (operationInput.value) payload.operationStatus = operationInput.value;
  if (locationInput.value) payload.location = locationInput.value;
  if (missionInput.value) payload.mission = missionInput.value;
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

const getSelectedSpeed = () => Number(selectors.speedSlider?.value ?? 0);

const handleDirection = async (event) => {
  const { direction } = event.target.dataset;
  if (!direction) return;
  event.preventDefault();
  const robot = getSelectedRobot();
  if (!robot) {
    return setMessage(selectors.commandMessage, 'Select a robot first.', 'error');
  }
  try {
    await sendCommand({
      robotId: robot.id,
      type: 'direction',
      value: direction,
      metadata: { speed: getSelectedSpeed() }
    });
    setMessage(selectors.commandMessage, `Direction command "${direction}" queued.`, 'success');
    await loadRobots();
  } catch (error) {
    setMessage(selectors.commandMessage, error.message, 'error');
  }
};

const sendCustomCommand = async (event) => {
  event.preventDefault();
  const robot = getSelectedRobot();
  if (!robot) {
    return setMessage(selectors.commandMessage, 'Select a robot first.', 'error');
  }
  const type = selectors.commandTypeInput.value.trim();
  const value = selectors.commandValueInput.value.trim();
  if (!type || !value) {
    return setMessage(selectors.commandMessage, 'Provide both command type and value.', 'error');
  }
  let metadata;
  try {
    metadata = parseMetadata(selectors.commandMetaInput.value);
  } catch (err) {
    return setMessage(selectors.commandMessage, err.message, 'error');
  }
  try {
    await sendCommand({
      robotId: robot.id,
      type,
      value,
      metadata: { ...metadata, speed: getSelectedSpeed() }
    });
    setMessage(selectors.commandMessage, 'Command dispatched to robot.', 'success');
    selectors.commandTypeInput.value = '';
    selectors.commandValueInput.value = '';
    selectors.commandMetaInput.value = '';
    await loadRobots();
  } catch (error) {
    setMessage(selectors.commandMessage, error.message, 'error');
  }
};

const handleModeChange = async (event) => {
  const { mode } = event.target.dataset;
  if (!mode) return;
  const robot = getSelectedRobot();
  if (!robot) {
    return setMessage(selectors.commandMessage, 'Select a robot first.', 'error');
  }
  try {
    await apiFetch(`/api/robots/${robot.id}/mode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, speed: getSelectedSpeed() })
    });
    setMessage(selectors.commandMessage, `Mode "${mode}" acknowledged.`, 'success');
    await loadRobots();
  } catch (error) {
    setMessage(selectors.commandMessage, error.message, 'error');
  }
};

const handleOtaSubmit = async (event) => {
  event.preventDefault();
  const robot = getSelectedRobot();
  if (!robot) {
    return setMessage(selectors.statusMessage, 'Select a robot first.', 'error');
  }
  const targetVersion = selectors.otaVersionInput.value.trim();
  try {
    const response = await apiFetch(`/api/robots/${robot.id}/ota`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetVersion })
    });
    const json = await toJSON(response);
    otaLogs[robot.id] = json.data.progressLog;
    if (!state.insights[robot.id]) {
      state.insights[robot.id] = {};
    }
    state.insights[robot.id].ota = {
      ...state.insights[robot.id].ota,
      currentVersion: json.data.targetVersion,
      availableVersion: json.data.targetVersion
    };
    renderOtaPanel();
    renderOtaLog(robot.id);
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
selectors.directionPad.addEventListener('click', handleDirection);
selectors.customCommandForm.addEventListener('submit', sendCustomCommand);
selectors.loginForm.addEventListener('submit', handleLoginSubmit);
selectors.logoutButton.addEventListener('click', handleLogout);
selectors.modeButtons.forEach((button) => button.addEventListener('click', handleModeChange));
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
  selectors.detailMission.textContent = data.telemetry?.missionStatus || robot.mission || 'No mission assigned';
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
};

const renderOtaLog = (robotId) => {
  const entries = otaLogs[robotId];
  if (!entries || !entries.length) {
    selectors.otaLogList.innerHTML = '<li>No updates triggered yet.</li>';
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
};
