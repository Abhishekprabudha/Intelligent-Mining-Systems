# AIonOS Mesabi Intelligent Mine Decision System

**Pit-to-Pellet AI Operating Brain for Green Steel Supply**

This is a front-end-only, GitHub Pages-ready demo for a Mesabi Metallics / Essar-style iron ore mining and DR-grade pellet operation. It is designed as a premium enterprise mission-control experience for a CEO, COO, mining leadership, plant leadership, reliability, ESG, safety, logistics, and transformation audience.

The demo uses **synthetic operational data only**. It does not require a backend, authentication, external APIs, secrets, or real confidential data.

---

## What the demo shows

The application demonstrates how AI agents can help an integrated mine-to-pellet operation make better shift-level decisions by connecting:

- Mine planning and ore chemistry
- Pit digital twin and block-level quality risk
- Fleet, haulage, crusher, and conveyor conditions
- Pellet plant process optimization
- DR-grade pellet quality risk
- Predictive maintenance and spare readiness
- Energy, carbon, water, dust, weather, and safety intelligence
- Finished pellet inventory, rail loadout, and customer quality matching
- Human-in-the-loop approval of agent recommendations
- Scenario simulation with before/after impact
- COO Copilot answers for executive decision-making

---

## Screens included

1. **Executive Mission Control**  
   Boardroom-level KPI layer for plan attainment, quality, cost, energy, carbon, asset availability, safety, recommendations, value at risk, and value protected.

2. **Mine Digital Twin**  
   Synthetic pit blocks with Fe, silica, phosphorus, moisture, hardness, haul distance, strip ratio, risk status, active equipment, haul roads, crusher feed point, and weather overlay.

3. **Pellet Plant Optimizer**  
   Animated pit-to-pellet process flow: Mine Feed → Primary Crusher → Grinding → Concentrate → Balling Disc → Induration Furnace → Cooling → Screening → Finished DR Pellets → Rail Loadout.

4. **Reliability War Room**  
   Predictive maintenance cards for shovel, drill, haul truck, crusher, conveyor, mill, balling disc, fan, pump, stacker, and reclaimer.

5. **Energy, ESG & Safety Cockpit**  
   Energy per ton, peak demand, carbon intensity, water usage, dust index, safety risk, permit status, reclamation, and weather-risk recommendations.

6. **Logistics & Supply Chain Control**  
   Finished pellet inventory, railcar availability, loadout sequencing, customer shipment schedule, quality matching, demurrage risk, and dispatch recommendations.

7. **Agent Command Center**  
   Live agent feed with Mine Plan, Drill & Blast, Fleet Dispatch, Crusher & Conveyor, Pellet Quality, Energy & Carbon, Maintenance & Spares, Safety & Compliance, Logistics, and COO Copilot agents.

8. **Scenario Simulator**  
   Scripted demo scenarios that update KPIs and show before/after impact.

---

## Scenario simulator

Available scenarios:

- Silica Spike in Ore Feed
- Conveyor Bearing Failure Risk
- Winter Weather Disruption
- Pellet Compression Strength Drop
- Power Price Spike
- Rail Loadout Delay
- Dust Compliance Alert
- Startup Ramp-Up Shortfall

Each scenario includes:

- Trigger condition
- Before metrics
- Agent recommendation
- Recovery actions
- After-approval projection
- Value at risk
- Value protected
- Human approval button

---

## Local AI logic

The app includes deterministic local functions in `src/aiLogic.js` and TypeScript equivalents in `src/aiLogic.ts` for:

- Pellet quality score
- Equipment failure risk
- Production risk
- Energy optimization opportunity
- ESG risk
- Safety risk
- Logistics delay risk
- Recommendation priority
- Value at risk
- Value protected after action

Example equipment risk formula implemented:

```txt
failure_risk =
  0.30 × vibration_anomaly
+ 0.25 × temperature_anomaly
+ 0.20 × current_draw_anomaly
+ 0.15 × operating_hours_factor
+ 0.10 × maintenance_overdue_factor
```

---

## Synthetic data files

All synthetic JSON files are stored in `public/data`:

- `site_profile.json`
- `ore_blocks.json`
- `mine_plan.json`
- `equipment_master.json`
- `equipment_telemetry.json`
- `fleet_dispatch_events.json`
- `drill_blast_plans.json`
- `crusher_conveyor_sensors.json`
- `pellet_plant_sensors.json`
- `pellet_quality_lab.json`
- `energy_weather_market.json`
- `emissions_water_dust.json`
- `maintenance_work_orders.json`
- `spares_inventory.json`
- `safety_events.json`
- `logistics_shipments.json`
- `agent_recommendations.json`
- `scenarios.json`

Run this to validate the synthetic data files:

```bash
npm run check:data
```

---

## How to run locally

Because this is a static ES module app, run it with any simple local server.

Option A:

```bash
python3 -m http.server 5173
```

Then open:

```txt
http://localhost:5173
```

Option B:

```bash
npm run serve
```

---

## How to deploy on GitHub Pages

1. Create a new GitHub repository.
2. Upload all files in this folder to the repository root.
3. Commit and push.
4. Go to **Settings → Pages**.
5. Under **Build and deployment**, select:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
6. Save.
7. Open the GitHub Pages URL after deployment.

The `.nojekyll` file is included so GitHub Pages serves the static assets directly.

---

## Recommended boardroom demo script

### Opening line

“AIonOS is not a dashboard. This is an operating brain that connects the mine, plant, reliability, ESG, logistics, and leadership decision layer into one live control system.”

### 1. Start with Executive Mission Control

Show the overall operating picture. Call out:

- Pellet production vs plan
- DR pellet quality score
- Silica risk
- CV-204 reliability risk
- Value at risk
- Value protected by AI actions

Suggested narrative:

“Leadership does not need ten dashboards. They need one system that tells them what changed, why it matters, what to approve, and what value is protected.”

### 2. Move to Mine Digital Twin

Click **Block N-14** and show how ore chemistry drives downstream pellet quality.

Suggested narrative:

“The AI does not look at the mine in isolation. It understands the downstream pellet plant consequence of each ore block.”

### 3. Move to Pellet Plant Optimizer

Show the animated process flow and Pellet Quality Agent recommendation.

Suggested narrative:

“This is the wow moment: the system detects that compression strength will fall before it happens, explains the root cause, and recommends a coordinated ore blend, binder, balling, and furnace correction.”

### 4. Move to Reliability War Room

Show **CV-204** risk and the deterministic failure-risk explanation.

Suggested narrative:

“The agent is explainable. It shows the formula, the signal drivers, and why the maintenance window should happen now.”

### 5. Move to Energy, ESG & Safety

Show peak tariff, carbon intensity, wind, dust, and safety controls.

Suggested narrative:

“ESG is not a reporting layer. AIonOS turns it into operational decisions during the shift.”

### 6. Move to Logistics

Show P2 loadout resequencing for Customer A.

Suggested narrative:

“The operating brain matches quality inventory to customer contracts and rail constraints so value is protected after the pellet leaves the plant.”

### 7. Move to Agent Command Center

Show human-in-the-loop approval and live activity feed.

Suggested narrative:

“These agents do not replace leadership. They compress the time from signal to decision.”

### 8. Finish with Scenario Simulator and COO Copilot

Trigger **Silica Spike in Ore Feed**, approve the plan, then ask the COO Copilot:  
“Can we still hit today’s pellet target?”

Suggested close:

“This is the future of intelligent mining: one AI-native command layer that sees across the entire value chain and protects production, quality, cost, safety, and carbon performance.”

---

## Notes

- The visual design is intentionally high-impact and boardroom-ready.
- The system is optimized for desktop demo usage.
- All data is synthetic and representative of iron ore mining and DR-grade pellet operations.
- No backend is required.
