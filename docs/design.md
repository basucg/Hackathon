# Robot Management Console – Design Document

## 1. Context
The Robot Management Console is a full-stack web application that lets authorized operators monitor and teleoperate a fleet of robots. The system exposes a JSON REST API backed by a SQLite store and renders a single-page UI with fleet overview, detail tabs, and control surfaces (teleop, OTA, health, map). Recent work re-scoped the fleet to DesignMinds robots (`HACK_DESIGNMINDS_<n>`) and added a manipulator control surface for shoulder/elbow/wrist joints with a live SVG preview.

## 2. Goals & Success Criteria
- Provide a cohesive operator experience for discovering robots, inspecting telemetry, and issuing commands (drive, mode, OTA, manipulator).
- Keep the application self-contained (API + UI served from the same Node process).
- Enforce authentication before any telemetry/command endpoints are reachable.
- Maintain an auditable history for telemetry changes (implicit via SQLite rows) and active commands (recent list per robot).
- Deliver a realistic teleoperation feel with responsive controls, design-aligned UI, and immediate visual feedback (fleet list, manipulator arm preview).

### Non-Goals
- Real-time streaming or websockets (refreshes are user-driven via REST).
- Physics-accurate kinematics; manipulator preview is illustrative.
- Managing firmware binary storage beyond metadata/history entries.

## 3. Users & Personas
| Persona | Needs |
| --- | --- |
| Robot Operator | Quickly assess robot availability, send teleop commands, adjust arm joints, monitor OTA health. |
| Fleet Administrator | Review command logs, confirm firmware status, manage user access. |
| Developer/Demo Engineer | Seed data, extend insights service, test API endpoints. |

## 4. System Overview
```
+-------------+        HTTPS         +-----------------+        SQLite
| Frontend UI | <------------------> | Node/Express API| <-----------------> robots.db
+-------------+                      +-----------------+
       ^                                      ^
       |                                      |
 Manipulator SVG                    Services & Repos
 Teleop widgets                    (robots, auth, firmware)
```

- **Frontend**: Vanilla JS SPA served from `public/`. State is stored in `state` object; `fetch` is used for API calls with bearer token headers.
- **Backend**: Express router under `src/`, controllers call repositories backed by better-sqlite3.
- **Data**: SQLite tables for `robots`, `robot_commands`, `robot_firmware_history`, `users`, `sessions`. `robotRepository` seeds demo robots when empty.

## 5. Architecture Details
### 5.1 Backend Layers
1. **Routes** (`src/routes/*.js`) – map REST endpoints to controllers.
2. **Controllers** – parse inputs, call repositories/services, return JSON shape `{ data, error }`.
3. **Repositories** – call SQLite via prepared statements, map rows to domain objects.
4. **Services** (e.g., `insightService`) – serve mock telemetry/insights.
5. **Middleware** – `requireAuth` verifies bearer token by reading the `sessions` table.

### 5.2 Frontend Modules
- **State management** (`state`, `auth`, `mapState`, `chartState` objects).
- **Selectors** caches DOM nodes for reuse.
- **Rendering**: `renderFleetList`, `renderDetail`, `renderInsights`, etc., mutate DOM based on `state`.
- **Teleop & Manipulator**: `handleDirection`, `sendCustomCommand`, `sendManipulatorCommand`, slider listeners update `manipulatorState` and call `sendCommand` with `{ type: 'manipulator', metadata: { shoulder, elbow, wrist } }`.
- **Visualization**: Leaflet maps, Chart.js charts, SVG arm preview using forward kinematics (segment lengths + angles).

### 5.3 Data Flow Examples
1. **Login**
   - User submits credentials via `/api/auth/login`.
   - Backend verifies password, issues JWT-like token stored in SQLite `sessions`.
   - Frontend stores token in `localStorage` and toggles to app view.
2. **Telemetry Refresh**
   - User clicks Refresh → `loadRobots()` calls `/api/robots`.
   - Response deserialized, normalized (DesignMinds IDs), state updated, UI rerendered.
3. **Manipulator Update**
   - User drags sliders (shoulder/elbow/wrist).
   - `manipulatorState` updates + preview re-renders instantly.
   - Clicking “Send joint update” posts to `/api/robots/:id/commands` with `{ type: 'manipulator', value: 'joint-update', metadata }`.
   - Command log refresh shows the queued update.
4. **OTA Flow**
   - Operator fills form, optional simulate failure.
   - Controller stores log in memory and updates firmware history via `firmwareRepository`.

## 6. Key Design Decisions
| Decision | Rationale |
| --- | --- |
| Keep SQLite with synchronous better-sqlite3 | Simplicity, zero external dependency, fast dev iteration. |
| Derive `HACK_DESIGNMINDS_<n>` IDs client-side | Guarantees naming consistency without DB migration; still stored in derived `designMindsId`. |
| SVG-based manipulator preview | Lightweight, no extra canvas/lib dependencies; easy to animate via DOM updates. |
| REST-only updates | Avoids websockets complexity; polling fits hackathon scope. |
| Single bundle JS | Minimal tooling; script served as ES module from `/public/js/app.js`. |

## 7. UI/UX Specification
- **Fleet List**: badge shows availability (“Online · Idle”, “Offline”), metadata displays `robot.name` + `designMindsId`.
- **Detail Header**: subtitle dedicated to DesignMinds ID, status badge reuses online/offline palette.
- **Overview Stats Grid**: 2-row layout (headers row + data row) for [Battery, Coordinates, Heartbeat, Location, Time, Uptime, Temperature].
- **Teleop Tab**: Two-column grid – left video feed, center command panel, right manipulator card. Responsive stacking below 960px.
- **Manipulator Card**:
  - Range sliders with degree readouts.
  - CTA button and status text (success/error classes shared with other forms).
  - Arm preview sized to fit panel using `viewBox` 240×240.

## 8. API Contracts (excerpt)
| Endpoint | Method | Request | Response |
| --- | --- | --- | --- |
| `/api/robots` | GET | header `Authorization: Bearer <token>` | `{ data: [ { id, name, batteryLevel, ... } ] }` |
| `/api/robots/:id/commands` | POST | `{ type, value, metadata? }` | `{ data: { command: {...} } }` |
| `/api/robots/:id/mode` | POST | `{ mode, speed }` | ack message |
| `/api/robots/:id/OTA` | POST | `{ targetVersion, simulateFailure? }` | progress payload |
| `/api/robots/:id/insights` | GET | telemetry+map+health mock data |

## 9. Data Model Snapshot
```
robots(id PK, name, model, batteryLevel, operationStatus, temperatureC,
       signalStrength, location, mission, lastHeartbeat, tasksCompleted,
       uptimeHours, notes, identifier, status, subStatus, latitude,
       longitude, lastKnownAt)
robot_commands(id PK, robotId FK, type, value, metadata JSON, issuedAt)
robot_firmware_history(id PK, robotId FK, version, appliedAt)
users(id, username, passwordHash, role)
sessions(token, userId FK, createdAt)
```

## 10. Failure & Retry Strategies
- **Auth Expiry**: 401 responses trigger `forceLogout()` with “Session expired” message.
- **API Errors**: `toJSON` helper throws; UI surfaces error via `.helptext.error` spans.
- **Manipulator Validation**: Sliders clamp to safe ranges; requests only sent when a robot is selected.
- **OTA Simulation**: Failure toggle adds `failure` class on progress bar.

## 11. Security Considerations
- All API endpoints (except `/auth/*`) use `requireAuth` middleware.
- Tokens stored in SQLite allow server-side revocation.
- CORS not required since UI served same origin.
- Inputs sanitized server-side via parameter binding; front-end validators prevent obvious misuse.

## 12. Observability & Metrics
- Console logs kept minimal (`console.error` for failed fetches).
- Command history shows recent actions; OTA logs + health alerts provide operator feedback.
- Future enhancement: integrate structured logging or analytics for manipulator use.

## 13. Testing Strategy
- Manual end-to-end via UI (login → teleop → manipulator command → confirm in command log).
- Unit tests could target repositories and services (not included yet).
- Lint checks via `eslint` (not currently configured, but `ReadLints` used during coding).

## 14. Future Work
- Add WebSocket push for telemetry and manipulator feedback.
- Persist DesignMinds identifier server-side and expose via API.
- Support gripper articulation / finger positions beyond wrist rotation.
- Integrate real video feed & sensors if hardware available.
- Internationalization of UI labels and measurement units.
