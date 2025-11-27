# Rebot Management Console

Operational dashboard and JSON API for tracking robot telemetry, sending manual status updates, and dispatching directional commands.

## Features
- REST API to read the fleet, patch robot telemetry, stream insights, and queue commands (direction, mode, OTA, etc.)
- SQLite-backed robot registry with seeded demo bots (Atlas, Scout, Lifter) persisted to `data/robots.db`
- Firmware history tracking for every robot (10k+ ready) with OTA progress logs and version rollups
- Secure login gate with session tokens so only approved operators can access controls
- Live cloud console tabs:
  - **Overview** – status uplink, command log, telemetry stats
  - **Teleop** – camera feed placeholder, joystick pad, mode/speed controls, custom commands
  - **Map & Path** – Leaflet map with trail + geofence overlay, velocity/acceleration charts (Chart.js)
  - **Health** – motor/CPU/battery indicators, diagnostics, alert log
  - **OTA Update** – firmware metadata, upload simulator, progress log
- Direction pad, command panel, and messaging surface to send mode changes or OTA triggers

## Getting started
```bash
npm install
npm run dev        # nodemon for local development
# or
npm start          # plain node
```

The server listens on `http://localhost:3000` by default. The UI is served from the same port.

## API

| Method | Path                       | Description                            |
| ------ | -------------------------- | -------------------------------------- |
| GET    | `/api/robots`              | List all robots                        |
| POST   | `/api/robots`              | Create a new robot                     |
| GET    | `/api/robots/:id`          | Fetch a single robot                   |
| PUT    | `/api/robots/:id/status`   | Update telemetry (battery, status, …)  |
| POST   | `/api/robots/:id/commands` | Queue a command (direction/other)      |
| GET    | `/api/robots/:id/insights` | Retrieve map/kinematics/health mock data |
| POST   | `/api/robots/:id/mode`     | Change drive mode + target speed       |
| POST   | `/api/robots/:id/ota`      | Simulate an over-the-air firmware push |

### Sample: update telemetry
```bash
curl -X PUT http://localhost:3000/api/robots/ROBOT_ID/status \
  -H "Content-Type: application/json" \
  -d '{
    "batteryLevel": 91,
    "operationStatus": "patrolling",
    "location": "Sector 7",
    "metrics": { "tasksCompleted": 142, "uptimeHours": 512 }
  }'
```

### Sample: send direction command
```bash
curl -X POST http://localhost:3000/api/robots/ROBOT_ID/commands \
  -H "Content-Type: application/json" \
  -d '{ "type": "direction", "value": "north" }'
```

## Data storage
- Robot metadata and command history live in a SQLite file at `data/robots.db` (automatically created).
- Seed robots are inserted the first time the DB is empty; delete the file to reset the environment.
- Use any SQLite browser to inspect the tables (`robots`, `robot_commands`, `robot_firmware_history`) if you need direct access.

## Authentication
- Default credentials: `robot-admin` / `robotops` (change by updating the seed logic in `src/repositories/authRepository.js`).
- Sessions are issued as bearer tokens stored in SQLite; the frontend keeps the token in `localStorage` and includes it on every API call.
- Use the **Logout** button or delete `localStorage.rebotToken` to end a session; tokens also become invalid if removed from the `sessions` table.

## Frontend workflow
1. Sign in (`robot-admin` / `robotops`) to unlock the console. Tokens persist in `localStorage`.
2. Hit **Refresh Telemetry** to pull the latest API response.
3. Click any robot card to load its multi-tab detail view.
4. Tabs:
   - **Overview** – push manual readings, inspect recent commands.
   - **Teleop** – drive with the pad, tweak speed, change modes, watch the simulated feed.
   - **Map & Path** – explore location trails, geofence overlays, velocity/acc charts.
   - **Health** – monitor motor temp, CPU load, battery cycles, faults.
   - **OTA Update** – enter a version + file, optionally simulate failures, watch the progress bar + step log, and review firmware history.
5. Use the command log + health alerts to narrate your demo (“collision detected”, “mode switched to autonomous”, etc.).