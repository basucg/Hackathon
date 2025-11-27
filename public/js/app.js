const state = {
  robots: []
};

const selectors = {
  robotsContainer: document.getElementById('robots-container'),
  fleetCount: document.getElementById('fleet-count'),
  refreshButton: document.getElementById('refresh-btn'),
  lastRefresh: document.getElementById('last-refresh'),
  statusForm: document.getElementById('status-form'),
  statusRobotSelect: document.getElementById('status-robot-select'),
  batteryInput: document.getElementById('battery-input'),
  signalInput: document.getElementById('signal-input'),
  operationInput: document.getElementById('operation-input'),
  locationInput: document.getElementById('location-input'),
  missionInput: document.getElementById('mission-input'),
  notesInput: document.getElementById('notes-input'),
  tasksInput: document.getElementById('tasks-input'),
  uptimeInput: document.getElementById('uptime-input'),
  statusMessage: document.getElementById('status-message'),
  commandRobotSelect: document.getElementById('command-robot-select'),
  commandTypeInput: document.getElementById('command-type-input'),
  commandValueInput: document.getElementById('command-value-input'),
  commandMetaInput: document.getElementById('command-meta-input'),
  commandMessage: document.getElementById('command-message'),
  directionPad: document.querySelector('.direction-pad'),
  robotCardTemplate: document.getElementById('robot-card-template')
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

const renderRobotCard = (robot) => {
  const { robotCardTemplate } = selectors;
  const clone = robotCardTemplate.content.firstElementChild.cloneNode(true);
  clone.querySelector('h3').textContent = robot.name;
  clone.querySelector('.subtitle').textContent = `${robot.model} • ${robot.mission}`;

  const badge = clone.querySelector('.badge');
  badge.textContent = robot.operationStatus;
  badge.style.background = robot.operationStatus === 'idle' ? 'rgba(46, 194, 126, 0.1)' : 'rgba(247, 162, 97, 0.1)';
  badge.style.color = robot.operationStatus === 'idle' ? '#2ec27e' : '#f4a261';

  const stats = clone.querySelector('.stats');
  const statMap = [
    ['Battery', formatPercent(robot.batteryLevel)],
    ['Signal', formatPercent(robot.signalStrength)],
    ['Location', robot.location],
    ['Temp (°C)', formatNumber(robot.temperatureC)],
    ['Tasks', formatNumber(robot.metrics?.tasksCompleted)],
    ['Uptime (h)', formatNumber(robot.metrics?.uptimeHours)],
    ['Last heartbeat', new Date(robot.lastHeartbeat).toLocaleTimeString()],
    ['Notes', robot.notes || '—']
  ];

  statMap.forEach(([label, value]) => {
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.textContent = value;
    stats.append(dt, dd);
  });

  const commandList = clone.querySelector('.command-log ul');
  if (!robot.recentCommands?.length) {
    const li = document.createElement('li');
    li.textContent = 'No commands issued yet.';
    commandList.appendChild(li);
  } else {
    robot.recentCommands.forEach((command) => {
      const li = document.createElement('li');
      const time = new Date(command.issuedAt).toLocaleTimeString();
      li.textContent = `[${time}] ${command.type}: ${command.value}`;
      commandList.appendChild(li);
    });
  }

  return clone;
};

const populateSelect = (selectEl, robots) => {
  selectEl.innerHTML = '';
  robots.forEach((robot, index) => {
    const option = document.createElement('option');
    option.value = robot.id;
    option.textContent = `${robot.name} (${robot.model})`;
    if (index === 0) {
      option.selected = true;
    }
    selectEl.appendChild(option);
  });
};

const renderRobots = () => {
  selectors.robotsContainer.innerHTML = '';
  state.robots.forEach((robot) => {
    selectors.robotsContainer.appendChild(renderRobotCard(robot));
  });
  selectors.fleetCount.textContent = `${state.robots.length} robots online`;
  populateSelect(selectors.statusRobotSelect, state.robots);
  populateSelect(selectors.commandRobotSelect, state.robots);
};

const updateTimestamp = () => {
  selectors.lastRefresh.textContent = `Last sync: ${new Date().toLocaleTimeString()}`;
};

const loadRobots = async () => {
  selectors.refreshButton.disabled = true;
  try {
    state.robots = await fetchRobots();
    renderRobots();
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
  const robotId = selectors.statusRobotSelect.value;
  const payload = collectStatusPayload();
  if (!Object.keys(payload).length) {
    return setMessage(selectors.statusMessage, 'Add at least one field to update.', 'error');
  }
  try {
    const response = await fetch(`/api/robots/${robotId}/status`, {
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
  if (!selectors.commandRobotSelect.value) {
    return setMessage(selectors.commandMessage, 'Select a robot first.', 'error');
  }
  try {
    await sendCommand({
      robotId: selectors.commandRobotSelect.value,
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
  const robotId = selectors.commandRobotSelect.value;
  if (!robotId) {
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
      robotId,
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
document.getElementById('custom-command-form').addEventListener('submit', sendCustomCommand);

loadRobots();
