# Robot Fleet Bill of Materials (10,000 Units)

## 1. Scope & Assumptions
- Applies to the HACK-series multi-role robots used in the Robot Management Console demos.
- Quantities assume identical configuration across 10,000 production units.
- Costs are illustrative 2025 USD list prices and exclude taxes, duties, assembly, and logistics.
- Electronics are rated for industrial temperature (-20 °C to 60 °C) and 24/7 duty cycle.

## 2. Aggregated Bill of Materials
| Subsystem | Component / Description | Qty / Robot | Qty (10,000 robots) | Unit Cost (USD) | Extended Cost (USD) |
| --- | --- | --- | --- | --- | --- |
| Mobility | Rugged omni-wheel chassis w/ suspension | 1 | 10,000 | 1,150 | 11,500,000 |
| Mobility | Brushless drive motor pair (left/right) | 2 | 20,000 | 320 | 6,400,000 |
| Power | 1.5 kWh Li-ion smart battery pack | 1 | 10,000 | 780 | 7,800,000 |
| Power | Onboard 1.2 kW charger/DC-DC module | 1 | 10,000 | 260 | 2,600,000 |
| Compute | NVIDIA Jetson Orin NX compute carrier | 1 | 10,000 | 890 | 8,900,000 |
| Compute | Redundant MCU (STM32 class) for safety | 1 | 10,000 | 62 | 620,000 |
| Sensing | 64-beam solid-state LiDAR | 1 | 10,000 | 1,350 | 13,500,000 |
| Sensing | 4K stereo camera pair (front) | 1 | 10,000 | 540 | 5,400,000 |
| Sensing | mmWave radar pod (rear) | 1 | 10,000 | 410 | 4,100,000 |
| Manipulation | 6-DOF arm w/ five-finger gripper | 1 | 10,000 | 3,200 | 32,000,000 |
| Manipulation | Force/torque wrist sensor | 1 | 10,000 | 480 | 4,800,000 |
| Comms | Dual-band Wi-Fi 6E + LTE modem | 1 | 10,000 | 210 | 2,100,000 |
| Comms | GNSS + RTK antenna kit | 1 | 10,000 | 185 | 1,850,000 |
| Safety | LID safety scanner (360°) | 1 | 10,000 | 720 | 7,200,000 |
| Safety | E-stop mushroom + tethered pendant | 1 | 10,000 | 95 | 950,000 |
| Enclosure | IP65 composite shell + EMI shielding | 1 | 10,000 | 540 | 5,400,000 |
| Thermal | Liquid-assisted heatsink loop | 1 | 10,000 | 280 | 2,800,000 |
| Cabling | Harness, connectors, fasteners set | 1 | 10,000 | 190 | 1,900,000 |
| Software | Perpetual OS image + OTA license | 1 | 10,000 | 160 | 1,600,000 |
| QA/Calibration | Factory calibration kit allocation | 1 | 10,000 | 120 | 1,200,000 |

**Total estimated hardware cost:** **$122,720,000 USD** (excluding labor, NRE, and spares).

## 3. Spares & Overhead Recommendations
- Maintain 5% spare inventory for LiDAR, compute modules, and manipulator joints (500 units each) to cover warranty failures.
- Allocate additional $4.2M for field-deployable battery spares and certified recyclers.
- Budget 8% of BOM for integration, harness fabrication, and in-circuit testing fixtures.

## 4. Procurement Notes
1. **Long-lead items:** LiDAR, manipulator assemblies, and Jetson modules have 20-24 week lead times; issue POs first.
2. **Safety-critical components:** LID safety scanners and E-stop assemblies require IEC 61496/ISO 13850 certificates; store documentation alongside each lot.
3. **Traceability:** Use serialized QR labels on compute modules, batteries, and arms to sync with the Robot Management Console for lifecycle tracking.
4. **Supply chain resilience:** Dual-source cabling, chargers, and enclosures; keep minimum 12 weeks of buffer inventory at contract manufacturers.

## 5. Future Optimizations
- Evaluate automotive-grade radar+camera fusion modules to reduce per-unit sensor cost by ~12%.
- Consolidate MCU and safety controller into a single SIL2-certified board once firmware is validated.
- Transition to 2170 cell-based battery packs to improve MTBF and simplify recycling logistics.
