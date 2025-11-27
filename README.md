# Rebot Management Console

Operational dashboard and JSON API for tracking robot telemetry, sending manual status updates, and dispatching directional commands.

## Features
- REST API to read the fleet, patch robot telemetry, and queue commands (direction, maintenance, etc.)
- In-memory robot registry with seeded demo bots (Atlas, Scout, Lifter)
- Realtime-inspired web UI (vanilla HTML/CSS/JS) that shows battery, signal, operations, and recent commands
- Status uplink form to push telemetry from the console
- Direction pad and custom command form to steer robots or trigger workflows

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

## Frontend workflow
1. Hit **Refresh Telemetry** to pull the latest API response.
2. Click any robot in the fleet list to load its detail view.
3. Use **Status uplink** to push manual readings (battery, signal, mission, notes, metrics).
4. Use the **Command center** to steer with the direction pad or send arbitrary commands (with optional JSON metadata).
5. Review the command log in the detail panel to confirm queued actions (last 10 entries).