import fs from 'node:fs';
import path from 'node:path';
const dir = path.resolve('public/data');
const required = [
  'site_profile.json','ore_blocks.json','mine_plan.json','equipment_master.json','equipment_telemetry.json','fleet_dispatch_events.json','drill_blast_plans.json','crusher_conveyor_sensors.json','pellet_plant_sensors.json','pellet_quality_lab.json','energy_weather_market.json','emissions_water_dust.json','maintenance_work_orders.json','spares_inventory.json','safety_events.json','logistics_shipments.json','agent_recommendations.json','scenarios.json'
];
let ok = true;
for (const file of required) {
  const fp = path.join(dir, file);
  if (!fs.existsSync(fp)) { console.error(`Missing ${file}`); ok = false; continue; }
  JSON.parse(fs.readFileSync(fp, 'utf8'));
}
console.log(ok ? `Validated ${required.length} synthetic data files.` : 'Data validation failed.');
process.exit(ok ? 0 : 1);
