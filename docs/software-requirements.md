# Robot Management Console – Software Requirements Specification (SRS)

## 1. Introduction
### 1.1 Purpose
Define functional and non-functional requirements for the Robot Management Console, covering both backend API and frontend UI necessary to supervise and teleoperate DesignMinds robots.

### 1.2 Scope
- Manage authenticated operator sessions.
- Render fleet dashboards, detail tabs, and manipulator controls.
- Provide REST endpoints for listing robots, updating telemetry, issuing commands (direction, mode, manipulator, OTA), and retrieving insights.
- Store persistent robot metadata, command history, firmware history, users, and sessions in SQLite.

### 1.3 References
- Design Document (`docs/design.md`).
- Source directories `src/`, `public/` for implementation context.
- README for operational guidance.

## 2. Overall Description
### 2.1 Product Perspective
Standalone Node/Express server with SQLite backing and static frontend. No external services required.

### 2.2 Product Functions
- Authenticate operator login/logout.
- Display fleet summary with availability counts.
- Provide tabbed detail view (Overview, Teleop, Map & Path, Health, OTA).
- Allow manual telemetry overrides, command dispatch, OTA simulations, manipulator joint adjustments.
- Visualize path history, charts, health diagnostics, and manipulator arm posture.

### 2.3 User Classes
| Class | Description |
| --- | --- |
| Operator | Daily user, issues teleop & manipulator commands. |
| Admin | Manages firmware, monitors health, reviews command history. |
| Developer | Extends API, seeds data, tests integrations. |

### 2.4 Constraints
- SQLite must remain embedded (no external DB).
- Frontend uses vanilla JS (no framework build step).
- All interactions secured via bearer token.

### 2.5 Assumptions & Dependencies
- Users access via modern browsers supporting ES modules, Fetch API, and SVG.
- Node.js runtime available (>=18) for server.
- `better-sqlite3` native module successfully builds in environment.

## 3. Functional Requirements
### 3.1 Authentication
- **FR-AUTH-1**: System shall provide `/api/auth/login` accepting username/password and returning `{ token, user }` on success.
- **FR-AUTH-2**: System shall persist issued tokens in `sessions` with timestamps.
- **FR-AUTH-3**: System shall reject protected endpoint requests lacking valid bearer token.
- **FR-AUTH-4**: System shall provide `/api/auth/logout` to invalidate tokens.

### 3.2 Fleet Listing
- **FR-FLEET-1**: `/api/robots` shall return array of robots with telemetry fields (batteryLevel, signalStrength, location, metrics, status, etc.).
- **FR-FLEET-2**: Frontend shall display only robots whose names follow `HACK_DESIGNMINDS_<n>` (derive ID if missing).
- **FR-FLEET-3**: UI shall show availability badge (`Online · <substate>` or `Offline`) based on battery/signal heuristics.
- **FR-FLEET-4**: Selecting a robot shall load detail panel and insights.

### 3.3 Overview Tab
- **FR-OVR-1**: UI shall present stats grid with headers [Battery, Location coordinates, Heartbeat, Location, Time, Uptime, Temperature] and populate data row accordingly.
- **FR-OVR-2**: Status form shall allow operators to override battery, signal, substate, location, notes, metrics and send PUT `/api/robots/:id/status`.
- **FR-OVR-3**: Command log shall list last 10 commands with timestamps.

### 3.4 Teleop Tab
- **FR-TELE-1**: Direction pad buttons shall queue `/commands` with `{ type: 'direction', value: <direction>, metadata.speed }`.
- **FR-TELE-2**: Mode buttons shall call `/mode` with `{ mode, speed }`.
- **FR-TELE-3**: Custom command form shall validate type/value, optional metadata JSON, and post to `/commands`.
- **FR-TELE-4**: Manipulator card shall provide range sliders for shoulder (-30°..150°), elbow (0°..135°), wrist (-90°..90°).
- **FR-TELE-5**: Manipulator preview shall render shoulder/elbow/wrist segments and update live with slider input.
- **FR-TELE-6**: Clicking "Send joint update" shall POST `/api/robots/:id/commands` with `{ type: 'manipulator', value: 'joint-update', metadata: { shoulder, elbow, wrist } }` and display success/error message.

### 3.5 Map & Path Tab
- **FR-MAP-1**: `/api/robots/:id/insights` shall supply map data (lastKnownLocation, path array, geofences).
- **FR-MAP-2**: UI shall instantiate Leaflet map, show path polyline, marker, optional geofence circle.
- **FR-MAP-3**: Path log shall reverse list path points with timestamp + coordinates.
- **FR-MAP-4**: Velocity & acceleration charts shall plot insight series using Chart.js.

### 3.6 Health Tab
- **FR-HLTH-1**: UI shall show motor temp, CPU usage, battery cycles from insights.
- **FR-HLTH-2**: Diagnostics list shall show name/status items; alerts list shall show text or "No active alerts".

### 3.7 OTA Tab
- **FR-OTA-1**: Form shall gather targetVersion, optional file (placeholder), and failure toggle.
- **FR-OTA-2**: Posting to `/api/robots/:id/ota` shall update progress bar, step list, history list, and log entries.
- **FR-OTA-3**: OTA status (current, available, last updated) shall update from insights data.

### 3.8 Data Persistence
- **FR-DATA-1**: `robotRepository.seedIfEmpty` shall insert default robots when table empty.
- **FR-DATA-2**: `ensureColumn` shall create additional columns (identifier, status, subStatus, latitude, longitude, lastKnownAt) if missing.
- **FR-DATA-3**: `robot_commands` shall store metadata JSON string for later retrieval.

### 3.9 Insights Service
- **FR-INS-1**: `insightService` shall synthesize telemetry (map path, kinematics, health, OTA) deterministically per robot id.
- **FR-INS-2**: Frontend shall cache insights per robot in `state.insights` and re-render relevant tabs.

## 4. Non-Functional Requirements
| ID | Requirement |
| --- | --- |
| NFR-1 | System shall support at least 50 robots without UI lag (lazy rendering + simple DOM updates). |
| NFR-2 | API responses shall complete within 300 ms on dev hardware (SQLite in-memory operations). |
| NFR-3 | UI shall be responsive for viewports down to 600 px (grid collapses). |
| NFR-4 | Authentication tokens shall be random 12+ characters. |
| NFR-5 | Code shall avoid blocking I/O on the main Node event loop beyond SQLite queries. |
| NFR-6 | Teleop/manipulator commands shall provide feedback within 1 second (optimistic UI message). |

## 5. External Interface Requirements
- **User Interface**: Provided via `/public/index.html`, styled by `/public/css/styles.css`, interactive behavior via `/public/js/app.js`.
- **API Interface**: JSON REST endpoints described in Section 3.
- **Hardware Interface**: None (simulated).
- **Software Interface**: Node modules (`express`, `better-sqlite3`, `uuid`, `chart.js`, `leaflet`).

## 6. System Architecture Requirements
- Must run as a single Node process, default port 3000.
- Static assets served from `public/` directory.
- Use Express routers per subsystem (auth, robots).

## 7. Data Requirements
- Robot records must include telemetry metrics, optional mission/notes, derived identifier.
- Command metadata stored as JSON string to preserve manipulator joint payloads.
- Sessions table must include creation timestamps for future expiration logic.

## 8. Security Requirements
- Passwords stored hashed (bcrypt) via repository logic.
- Bearer tokens validated per request; invalid tokens cause HTTP 401.
- No sensitive data logged to console.
- Only authenticated clients may call robot or OTA endpoints.

## 9. Reliability & Availability
- On server restart, SQLite file ensures persistent data.
- If `robots.db` is deleted, seeding recreates demo data automatically.
- Manipulator preview remains functional offline but command dispatch requires backend availability.

## 10. Maintainability & Extensibility
- Frontend modularized via functions for each tab; new controls can be added by extending `state` and render functions.
- Backend repositories isolate SQL, simplifying migrations or schema tweaks.
- Adding new command types follows the pattern in `sendCommand` and repository inserts.

## 11. Performance Requirements
- Fleet list rendering shall complete in <100 ms for 50 robots (simple loops, minimal DOM creation).
- Leaflet map reflow triggered after tab switch with `invalidateSize` to prevent layout thrash.
- SVG manipulator updates triggered on `input` events only (no polling).

## 12. Testing Requirements
- Manual test cases must cover: login success/failure, robot refresh, overview status update, command dispatch, manipulator slider/command, map rendering, OTA success/failure.
- Automated tests (future): repository CRUD, auth middleware, manipulator command payload validation.

## 13. Documentation Requirements
- README shall describe setup and API usage (already provided).
- Design doc (this SRS references) maintained under `docs/`.

## 14. Open Issues
- Real robot telemetry integration pending.
- No rate limiting on command endpoints.
- Tokens never expire unless explicitly logged out.
