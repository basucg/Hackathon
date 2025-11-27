const crypto = require('crypto');

const baseLocations = [
  { lat: 37.7749, lng: -122.4194 },
  { lat: 34.0522, lng: -118.2437 },
  { lat: 47.6062, lng: -122.3321 }
];

const seededRandom = (seed) => {
  const hash = crypto.createHash('sha256').update(seed).digest('hex');
  const int = parseInt(hash.slice(0, 8), 16);
  return (min, max, offset = 0) => {
    const val = ((int + offset) % 1000) / 1000;
    return min + val * (max - min);
  };
};

const generatePath = (seed) => {
  const rand = seededRandom(seed);
  const base = baseLocations[seed.length % baseLocations.length];
  const path = [];
  for (let i = 0; i < 12; i += 1) {
    path.push({
      lat: base.lat + rand(-0.01, 0.01, i) / 10,
      lng: base.lng + rand(-0.01, 0.01, i + 1) / 10,
      timestamp: new Date(Date.now() - (12 - i) * 600000).toISOString()
    });
  }
  return path;
};

const generateSeries = (seed, label) => {
  const rand = seededRandom(`${seed}-${label}`);
  return Array.from({ length: 10 }).map((_, idx) => ({
    t: idx,
    value: Math.round(rand(10, 80, idx) * 10) / 10
  }));
};

const generateHealth = (seed) => {
  const rand = seededRandom(`${seed}-health`);
  return {
    motorTemp: Math.round(rand(45, 80)),
    cpuUsage: Math.round(rand(30, 95)),
    batteryCycles: Math.round(rand(300, 1200)),
    alerts: rand(0, 1) > 0.7 ? ['Vibration spike detected', 'Check wheel alignment'] : [],
    diagnostics: [
      { name: 'IMU', status: rand(0, 1, 4) > 0.2 ? 'ok' : 'warn' },
      { name: 'Lidar', status: rand(0, 1, 5) > 0.1 ? 'ok' : 'error' },
      { name: 'Drive', status: rand(0, 1, 6) > 0.3 ? 'ok' : 'warn' }
    ]
  };
};

const generateOtaStatus = (seed) => {
  const major = 1 + (seed.charCodeAt(0) % 3);
  const minor = seed.charCodeAt(1) % 10;
  const patch = seed.charCodeAt(2) % 10;
  return {
    currentVersion: `v${major}.${minor}.${patch}`,
    availableVersion: `v${major}.${minor + 1}.${patch}`,
    lastUpdated: new Date(Date.now() - 86400000).toISOString()
  };
};

const getRobotInsights = (robotId) => {
  const path = generatePath(robotId);
  return {
    map: {
      lastKnownLocation: path[path.length - 1],
      path,
      geofences: [
        { id: 'alpha', lat: path[0].lat + 0.01, lng: path[0].lng + 0.01, radius: 500 }
      ]
    },
    kinematics: {
      velocitySeries: generateSeries(robotId, 'vel'),
      accelerationSeries: generateSeries(robotId, 'accel'),
      constraints: [
        { name: 'Max slope', value: '12°', status: 'ok' },
        { name: 'Wheel slip', value: '4%', status: 'warn' }
      ]
    },
    health: generateHealth(robotId),
    ota: generateOtaStatus(robotId),
    telemetry: {
      missionStatus: 'Executing perimeter patrol',
      cameraFeedUrl: 'https://storage.googleapis.com/robot-demo-assets/patrol-feed.mp4'
    }
  };
};

const simulateFirmwareUpdate = (robotId, payload = {}) => {
  const targetInput = payload.targetVersion ? String(payload.targetVersion).trim().toUpperCase() : null;
  const version = targetInput ? (targetInput.startsWith('V') ? targetInput : `V${targetInput}`) : 'V1';
  const shouldFail = Boolean(payload.simulateFailure);
  const steps = [
    'Queued update package',
    'Transferring binaries',
    'Verifying checksum',
    'Applying firmware',
    'Rebooting subsystems',
    shouldFail ? 'Update failed - rollback triggered' : 'Update complete'
  ];
  const progressLog = steps.map((message, idx) => ({
    step: idx + 1,
    message,
    timestamp: new Date(Date.now() + idx * 5000).toISOString(),
    progress: Math.round((idx / (steps.length - 1)) * 100)
  }));
  return {
    targetVersion: version,
    status: shouldFail ? 'failed' : 'success',
    progressLog
  };
};

module.exports = {
  getRobotInsights,
  simulateFirmwareUpdate
};
