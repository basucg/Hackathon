const state = {
  robots: [],
  selectedRobotId: null
};

const selectors = {
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
  customCommandForm: document.getElementById('custom-command-form')
};

const toJSON = async (response) => {
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody.error || response.statusText || 'Unknown error';
    throw new Error(message);
  }
  return response.json();
};

const fetchRobots = async () => {
  const response = await fetch('/api/robots');
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
  renderFleetList();
  renderDetail();
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

    const readings = document.createElement('div');
    readings.className = 'fleet-readings';
    readings.innerHTML = `
      <span>Battery: ${formatPercent(robot.batteryLevel)}</span>
      <span>Signal: ${formatPercent(robot.signalStrength)}</span>
    `;

    item.append(meta, readings);
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
};

const updateTimestamp = () => {
  selectors.lastRefresh.textContent = `Last sync: ${new Date().toLocaleTimeString()}`;
};

const loadRobots = async () => {
  selectors.refreshButton.disabled = true;
  try {
    state.robots = await fetchRobots();
    renderFleetList();
    renderDetail();
    updateTimestamp();
  } catch (error) {
    alert(`Failed to load robots: ${error.message}`);
  } finally {
    selectors.refreshButton.disabled = false;
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
    const response = await fetch(`/api/robots/${robot.id}/status`, {
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
  const response = await fetch(`/api/robots/${robotId}/commands`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, value, metadata })
  });
  return toJSON(response);
};

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
      value: direction
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
      metadata
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

selectors.refreshButton.addEventListener('click', loadRobots);
selectors.statusForm.addEventListener('submit', sendStatusUpdate);
selectors.directionPad.addEventListener('click', handleDirection);
selectors.customCommandForm.addEventListener('submit', sendCustomCommand);

loadRobots();
