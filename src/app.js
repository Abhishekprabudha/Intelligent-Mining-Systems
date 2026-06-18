import {
  pelletQualityScore,
  equipmentFailureRisk,
  productionRisk,
  energyOptimizationOpportunity,
  esgRisk,
  safetyRisk,
  logisticsDelayRisk,
  recommendationPriority,
  valueAtRisk,
  valueProtectedAfterAction,
  classifyRisk
} from './aiLogic.js';

const DATA_FILES = [
  'site_profile.json','ore_blocks.json','mine_plan.json','equipment_master.json','equipment_telemetry.json','fleet_dispatch_events.json','drill_blast_plans.json','crusher_conveyor_sensors.json','pellet_plant_sensors.json','pellet_quality_lab.json','energy_weather_market.json','emissions_water_dust.json','maintenance_work_orders.json','spares_inventory.json','safety_events.json','logistics_shipments.json','agent_recommendations.json','scenarios.json'
];

const routes = [
  ['executive', 'Executive Mission Control', '◈'],
  ['mine', 'Mine Digital Twin', '▧'],
  ['pellet', 'Pellet Plant Optimizer', '⟲'],
  ['reliability', 'Reliability War Room', '⚙'],
  ['energy', 'Energy, ESG & Safety', '♻'],
  ['logistics', 'Logistics & Supply Chain', '⇄'],
  ['agents', 'Agent Command Center', '✦'],
  ['simulator', 'Scenario Simulator', '▻']
];

const state = {
  data: {},
  route: location.hash.replace('#','') || 'executive',
  selectedBlock: 'N-14',
  selectedScenario: 'silica_spike',
  approvedScenarios: new Set(),
  copilotOpen: false,
  copilotQuestion: 'Can we still hit today’s pellet target?',
  liveTick: 0,
  toast: ''
};

const $ = sel => document.querySelector(sel);
const fmt = new Intl.NumberFormat('en-US');
const moneyFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const pct = v => `${Math.round(v)}%`;
const money = v => moneyFmt.format(v || 0);
const compactMoney = v => `$${((v || 0)/1000000).toFixed(v >= 1000000 ? 1 : 2)}M`;
const num = v => fmt.format(Math.round(v || 0));
const LIVE_REFRESH_MS = 5000;

function liveWave(seed = 0, amplitude = 1, speed = 1) {
  return Math.sin((state.liveTick + seed) * speed) * amplitude;
}

function liveJitter(seed = 0, amplitude = 1) {
  const x = Math.sin((state.liveTick + 1) * (seed + 12.9898)) * 43758.5453;
  return (x - Math.floor(x) - 0.5) * amplitude * 2;
}

function liveSeries(base, amplitude = 1, seed = 0, decimals = 0) {
  const factor = 10 ** decimals;
  return base.map((v, i) => Math.round((v + liveWave(seed + i * 0.7, amplitude, 0.85) + liveJitter(seed + i, amplitude * 0.35)) * factor) / factor);
}

async function loadData() {
  const pairs = await Promise.all(DATA_FILES.map(async file => {
    const url = new URL(`../public/data/${file}`, import.meta.url);
    const json = await fetch(url).then(r => {
      if (!r.ok) throw new Error(`Failed to load ${file}`);
      return r.json();
    });
    return [file.replace('.json',''), json];
  }));
  state.data = Object.fromEntries(pairs);
}

function latestLab() { return state.data.pellet_quality_lab.at(-1); }
function activeScenario() { return state.data.scenarios.find(s => s.id === state.selectedScenario) || state.data.scenarios[0]; }
function selectedBlock() { return state.data.ore_blocks.find(b => b.blockId === state.selectedBlock) || state.data.ore_blocks.find(b => b.blockId === 'N-14') || state.data.ore_blocks[0]; }
function assetById(id) { return state.data.equipment_telemetry.find(a => a.assetId === id); }
function mergedAssets() {
  return state.data.equipment_telemetry.map(t => ({...state.data.equipment_master.find(m => m.assetId === t.assetId), ...t, failureRisk: equipmentFailureRisk(t)}));
}

function currentKpis() {
  const lab = latestLab();
  const qScore = pelletQualityScore(lab);
  const recs = state.data.agent_recommendations;
  const approved = state.approvedScenarios.has(state.selectedScenario);
  const scenario = activeScenario();
  const orePlan = state.data.mine_plan;
  const assetAvailability = Math.round(mergedAssets().reduce((s,a)=>s+a.healthScore,0) / mergedAssets().length);
  const qualityBoost = approved && scenario.after?.pelletQualityScore ? scenario.after.pelletQualityScore - scenario.before.pelletQualityScore : 0;
  const planAttainment = approved && scenario.after?.planAttainmentPct ? scenario.after.planAttainmentPct + liveWave(2, 0.4, 0.7) : 93 + liveWave(1, 2.2, 0.9) + liveJitter(2, 0.7);
  const offSpecRisk = Math.max(3, approved && scenario.after?.offSpecRiskPct ? scenario.after.offSpecRiskPct + liveJitter(3, 0.8) : lab.offSpecRiskPct + liveWave(3, 2.1, 0.8) + liveJitter(4, 0.9));
  const prodRisk = productionRisk({ planAttainmentPct: planAttainment, offSpecRiskPct: offSpecRisk, assetAvailabilityPct: assetAvailability });
  const safetyScore = safetyRisk(state.data.safety_events, state.data.emissions_water_dust, state.data.energy_weather_market.weather);
  const logisticsRisk = logisticsDelayRisk(state.data.logistics_shipments);
  const varUsd = approved ? Math.max(340000, valueAtRisk(recs) - valueProtectedAfterAction(scenario)) : valueAtRisk(recs);
  const protectedUsd = 680000 + [...state.approvedScenarios].length * 420000;
  return {
    pelletProduction: approved ? 18420 + liveJitter(5, 75) : 17780 + liveWave(5, 260, 0.85) + liveJitter(6, 95),
    pelletPlan: state.data.site_profile.baselineDailyPelletPlanTons,
    oreMovement: orePlan.oreMovementActualTons + liveWave(7, 820, 0.75) + liveJitter(8, 220),
    orePlan: orePlan.oreMovementPlanTons,
    qualityScore: Math.min(98, Math.max(82, qScore + qualityBoost + liveWave(9, 1.4, 0.8) + liveJitter(10, 0.5))),
    feGrade: lab.feGradePct + liveJitter(11, 0.04),
    silica: Math.max(2.8, lab.silicaPct + liveWave(12, 0.08, 1.1) + liveJitter(13, 0.03)),
    costPerTon: (approved ? 53.9 : 56.4) + liveWave(14, 0.45, 0.7) + liveJitter(15, 0.18),
    energyPerTon: (approved && scenario.after?.energyPerTonKwh ? scenario.after.energyPerTonKwh : state.data.energy_weather_market.energyPerTonKwh) + liveWave(16, 1.1, 0.8) + liveJitter(17, 0.35),
    carbonIntensity: (approved && scenario.after?.carbonIntensityKgCO2ePerT ? scenario.after.carbonIntensityKgCO2ePerT : state.data.emissions_water_dust.carbonIntensityKgCO2ePerT) + liveWave(18, 0.75, 0.7) + liveJitter(19, 0.22),
    assetAvailability,
    safetyScore,
    openRecommendations: recs.filter(r => r.status !== 'approved').length,
    valueAtRisk: varUsd,
    valueProtected: protectedUsd,
    offSpecRisk,
    productionRisk: prodRisk,
    logisticsRisk
  };
}

function statusBadge(label, tone='blue') {
  return `<span class="status-badge status-${tone}">${label}</span>`;
}

function kpiCard({ label, value, unit='', delta='', tone='blue', status='live' }) {
  const deltaClass = tone === 'green' ? 'good' : tone === 'red' ? 'bad' : tone === 'amber' ? 'warn' : '';
  return `<div class="kpi-card live-refresh" data-live-tick="${state.liveTick}">
    <div class="kpi-top"><div class="kpi-label">${label}</div>${statusBadge(status, tone)}</div>
    <div class="kpi-value">${value}${unit ? `<small> ${unit}</small>` : ''}</div>
    <div class="delta ${deltaClass}">${delta || 'AI monitored • no manual refresh'}</div>
  </div>`;
}

function trendChart(label, data, suffix='') {
  const w = 220, h = 86, pad = 8;
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data.map((v,i) => {
    const x = pad + i * ((w-pad*2)/(data.length-1));
    const y = h - pad - ((v-min)/(max-min || 1)) * (h-pad*2);
    return `${x},${y}`;
  }).join(' ');
  return `<div class="trend">
    <div class="trend-label"><span>${label}</span><b>${data.at(-1)}${suffix}</b></div>
    <svg viewBox="0 0 ${w} ${h}" aria-label="${label} trend">
      <defs><linearGradient id="g-${label.replace(/\W/g,'')}" x1="0" x2="1"><stop offset="0" stop-color="#39a7ff"/><stop offset="1" stop-color="#45e68a"/></linearGradient></defs>
      <polyline points="${pts}" fill="none" stroke="url(#g-${label.replace(/\W/g,'')})" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="${pts} ${w-pad},${h-pad} ${pad},${h-pad}" fill="rgba(57,167,255,.09)" stroke="none"/>
    </svg>
  </div>`;
}

function sidebar() {
  return `<aside class="sidebar">
    <div class="brand">
      <div class="logo-row"><div class="mark">A</div><div><div class="brand-title">AIonOS</div><div class="brand-sub">Mesabi Intelligent Mine Mission Control</div></div></div>
      <div class="brand-small">Pit-to-Pellet AI Operating Brain for Green Steel Supply</div>
    </div>
    <nav class="nav">
      ${routes.map(([id,label,icon]) => `<button data-route="${id}" class="${state.route===id?'active':''}"><span class="icon">${icon}</span><span class="text">${label}</span></button>`).join('')}
    </nav>
    <div class="sidebar-footer">
      <div class="label">AI Protected Value</div>
      <div class="big">${compactMoney(currentKpis().valueProtected)}</div>
      <div class="small">Synthetic demo • human approval controls active</div>
    </div>
  </aside>`;
}

function topbar() {
  const k = currentKpis();
  const timestamp = new Date().toLocaleString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: 'short' });
  return `<header class="topbar">
    <div class="top-left"><span class="live-dot"></span><div class="command-title"><strong>Live AI-Native Industrial Operating System</strong><span>${state.data.site_profile.shift} • ${state.data.site_profile.productionDay}</span></div></div>
    <div class="top-actions">
      <span class="meta-pill">System: <b>Nominal / AI Watch</b></span>
      <span class="meta-pill">Alerts: <b>${k.openRecommendations + state.data.safety_events.filter(e=>e.status!=='closed').length}</b></span>
      <span class="meta-pill">Refresh: <b>${LIVE_REFRESH_MS / 1000}s</b></span>
      <select class="select-pill" data-scenario-select>
        ${state.data.scenarios.map(s => `<option value="${s.id}" ${s.id===state.selectedScenario?'selected':''}>Run Scenario: ${s.name}</option>`).join('')}
      </select>
      <button class="primary-btn" data-open-copilot>Ask COO Copilot</button>
      <span class="meta-pill"><b>${timestamp}</b></span>
    </div>
  </header>`;
}

function screenHead(eyebrow, title, sub, scoreLabel, scoreValue) {
  return `<div class="screen-head"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p>${sub}</p></div>${scoreLabel ? `<div class="head-score"><div class="num">${scoreValue}</div><div class="cap">${scoreLabel}</div></div>` : ''}</div>`;
}

function executiveScreen() {
  const k = currentKpis();
  const latestRec = state.data.agent_recommendations[0];
  return `${screenHead('Executive Mission Control', 'Mesabi is operating at 92–96% recovery potential today', 'A boardroom-level operating brain connects mine plan, ore chemistry, pellet quality, reliability, energy, ESG, logistics, and human approval into one decision layer.', 'DR readiness score', k.qualityScore)}
    <div class="grid kpi-grid">
      ${kpiCard({label:'Daily pellet production vs plan', value:`${num(k.pelletProduction)} / ${num(k.pelletPlan)}`, unit:'t', delta:`${pct(k.pelletProduction/k.pelletPlan*100)} of plan`, tone:k.pelletProduction/k.pelletPlan>0.95?'green':'amber', status:'plan'})}
      ${kpiCard({label:'Mine ore movement vs plan', value:`${num(k.oreMovement)} / ${num(k.orePlan)}`, unit:'t', delta:`${pct(k.oreMovement/k.orePlan*100)} extracted`, tone:'amber', status:'active'})}
      ${kpiCard({label:'DR pellet quality score', value:k.qualityScore, delta:`Off-spec risk ${k.offSpecRisk}%`, tone:k.qualityScore>92?'green':'amber', status:'quality'})}
      ${kpiCard({label:'Fe grade', value:k.feGrade.toFixed(2), unit:'%', delta:'DR-grade chemistry watch', tone:'green', status:'lab'})}
      ${kpiCard({label:'Silica risk', value:k.silica.toFixed(2), unit:'%', delta:'N-14 blend needs correction', tone:k.silica>3.4?'red':'amber', status:'risk'})}
      ${kpiCard({label:'Cost per ton', value:`$${k.costPerTon.toFixed(1)}`, delta:'Energy + reliability sensitivity', tone:'amber', status:'cost'})}
      ${kpiCard({label:'Energy per ton', value:k.energyPerTon.toFixed(1), unit:'kWh/t', delta:'Peak tariff exposure', tone:'amber', status:'energy'})}
      ${kpiCard({label:'Carbon intensity', value:k.carbonIntensity.toFixed(1), unit:'kg/t', delta:'3.4% improvement available', tone:'blue', status:'ESG'})}
      ${kpiCard({label:'Equipment availability', value:k.assetAvailability, unit:'%', delta:'CV-204 constraint watch', tone:k.assetAvailability>90?'green':'amber', status:'assets'})}
      ${kpiCard({label:'Safety risk score', value:k.safetyScore, delta:'Wind + dust controls active', tone:k.safetyScore>60?'amber':'green', status:'EHS'})}
      ${kpiCard({label:'Open agent recommendations', value:k.openRecommendations, delta:'2 require approval now', tone:'blue', status:'agents'})}
      ${kpiCard({label:'Value at risk', value:compactMoney(k.valueAtRisk), delta:`${compactMoney(k.valueProtected)} already protected`, tone:'red', status:'VAR'})}
    </div>
    <div class="grid two-col" style="margin-top:16px">
      <div class="panel">
        <div class="panel-title"><h2>Operating Pulse: production, quality, cost, availability, energy</h2><span>12-hour synthetic signal</span></div>
        <div class="chart-row">
          ${trendChart('Production vs plan', liveSeries([88,90,91,92,92,93,92,93,94,92,93,Math.round(k.pelletProduction/k.pelletPlan*100)], 1.4, 20), '%')}
          ${trendChart('Pellet quality', liveSeries([93,94,94,93,92,91,90,89,87,88,90,Math.round(k.qualityScore)], 1.2, 30), '')}
          ${trendChart('Cost per ton', liveSeries([54,54,55,55,56,56,57,57,56,56,55,Math.round(k.costPerTon)], 0.7, 40), '$')}
          ${trendChart('Availability', liveSeries([94,93,92,91,89,88,87,86,84,86,88,k.assetAvailability], 1.0, 50), '%')}
          ${trendChart('Energy intensity', liveSeries([89,90,90,91,92,92,93,92,92,91,91,Math.round(k.energyPerTon)], 0.9, 60), '')}
        </div>
      </div>
      <div class="panel ai-summary">
        <div class="panel-title"><h2>AI Executive Summary</h2>${statusBadge('human approval ready','blue')}</div>
        <p>Mesabi is currently tracking at <b>${pct(k.pelletProduction/k.pelletPlan*100)}</b> of daily pellet plan. The primary risk is rising silica in ore feed from <b>Block N-14</b>, combined with <b>Conveyor CV-204 bearing stress</b>. AI agents recommend a revised ore blend, a preventive maintenance window, and furnace profile optimization. Expected recovery: <b>96% of plan</b>. Estimated value protected: <b>${compactMoney(1500000)}</b>.</p>
        <div class="action-row">
          <button class="success-btn" data-approve-current>Approve Recovery Plan</button>
          <button class="ghost-btn" data-toast="Sent integrated recovery plan to mine supervisor.">Send to Mine Supervisor</button>
          <button class="ghost-btn" data-toast="Work order WO-8200 created for CV-204 maintenance window.">Create Maintenance Work Order</button>
          <button class="primary-btn" data-route="simulator">Simulate Impact</button>
        </div>
      </div>
    </div>
    <div class="grid three-col" style="margin-top:16px">
      ${recommendationCard(latestRec)}
      ${valueAtRiskCard(k)}
      ${alertPanel()}
    </div>`;
}

function recommendationCard(rec) {
  return `<div class="recommendation-card panel">
    <div class="panel-title"><h3>${rec.agent}</h3>${statusBadge(rec.status.replace('requires ','needs '), rec.status.includes('approval')?'amber':'blue')}</div>
    <p><b>${rec.finding}</b></p>
    <div class="alert"><strong>What to do</strong><span>${rec.action}</span></div>
    <div class="detail-grid">
      <div class="detail-metric"><span>Confidence</span><b>${pct(rec.confidence*100)}</b></div>
      <div class="detail-metric"><span>Priority score</span><b>${recommendationPriority(rec)}</b></div>
      <div class="detail-metric"><span>Value at risk</span><b>${money(rec.valueAtRiskUsd)}</b></div>
      <div class="detail-metric"><span>If ignored</span><b>Production / quality exposure</b></div>
    </div>
    <div class="action-row"><button class="success-btn" data-toast="Recommendation approved and added to the integrated shift plan.">Approve</button><button class="ghost-btn" data-open-copilot>Ask for explanation</button></div>
  </div>`;
}

function valueAtRiskCard(k) {
  return `<div class="panel">
    <div class="panel-title"><h3>Value at Risk / Protected</h3>${statusBadge('AI economics','purple')}</div>
    <div class="value-at-risk">${compactMoney(k.valueAtRisk)} <small>at risk</small></div>
    <p class="mini">Risk-weighted exposure from quality drift, equipment failure, peak power, dust compliance, and shipment delay.</p>
    <div class="impact-row"><span>Value already protected</span><b>${compactMoney(k.valueProtected)}</b></div>
    <div class="impact-row"><span>Next approval upside</span><b>${compactMoney(valueProtectedAfterAction(activeScenario()))}</b></div>
    <div class="impact-row"><span>Highest lever</span><b>${activeScenario().agent}</b></div>
  </div>`;
}

function alertPanel() {
  const alerts = [
    ['Silica drift', 'N-14 feed is above DR pellet tolerance; blend intervention recommended.', 'red'],
    ['CV-204 bearing stress', '45-minute maintenance window is available during feed transition.', 'amber'],
    ['Peak tariff exposure', 'Shift non-critical grinding load by 45 minutes to save cost.', 'blue'],
    ['S-3 dust watch', 'Wind gusts trigger stockpile suppression recommendation.', 'amber']
  ];
  return `<div class="panel"><div class="panel-title"><h3>Active Alerts</h3>${statusBadge(`${alerts.length} live`, 'amber')}</div><div class="alert-list">${alerts.map(a=>`<div class="alert"><strong>${a[0]} ${statusBadge('watch', a[2])}</strong><span>${a[1]}</span></div>`).join('')}</div></div>`;
}

function mineScreen() {
  const block = selectedBlock();
  return `${screenHead('Mine Digital Twin', 'Ore chemistry is now a live operational control variable', 'The mine map shows synthetic pit blocks, haul routes, active fleet, crusher feed point, and weather overlay. Click any block to see downstream pellet impact and AI blend recommendations.', 'Selected block', block.blockId)}
    <div class="mine-map-wrap">
      <div class="mine-map panel">
        <div class="weather-overlay"></div>
        ${haulRoads()}
        ${state.data.ore_blocks.map(b => blockTile(b)).join('')}
        ${mapAssets()}
      </div>
      <div class="side-detail">
        <div class="panel-title"><h2>${block.blockId} / Bench ${block.bench}</h2>${statusBadge(block.riskStatus, block.riskStatus)}</div>
        <div class="detail-grid">
          <div class="detail-metric"><span>Available tons</span><b>${num(block.availableTons)} t</b></div>
          <div class="detail-metric"><span>Fe grade</span><b>${block.fePct}%</b></div>
          <div class="detail-metric"><span>Silica</span><b>${block.silicaPct}%</b></div>
          <div class="detail-metric"><span>Phosphorus</span><b>${block.phosphorusPct}%</b></div>
          <div class="detail-metric"><span>Moisture</span><b>${block.moisturePct}%</b></div>
          <div class="detail-metric"><span>Hardness index</span><b>${block.hardnessIndex}</b></div>
          <div class="detail-metric"><span>Haul distance</span><b>${block.haulDistanceKm} km</b></div>
          <div class="detail-metric"><span>Strip ratio</span><b>${block.stripRatio}</b></div>
        </div>
        <div class="alert"><strong>Expected pellet quality impact</strong><span>${block.expectedPelletQualityImpact > 0 ? '+' : ''}${block.expectedPelletQualityImpact} points vs current blend baseline.</span></div>
        <div class="alert"><strong>Recommended blend</strong><span>Mine Plan Intelligence Agent recommends reducing N-14 feed from 38% to 22% and blending with E-07 to stabilize silica and protect DR pellet quality.</span></div>
        <div class="alert"><strong>Downstream risk</strong><span>${block.silicaPct > 4 ? 'High silica increases furnace energy and off-spec risk.' : 'Block is suitable for quality recovery blend support.'}</span></div>
        <div class="detail-grid"><div class="detail-metric"><span>AI confidence</span><b>91%</b></div><div class="detail-metric"><span>Mining priority</span><b>${block.miningPriority}</b></div></div>
        <div class="action-row"><button class="success-btn" data-toast="Blend change sent to mine planning board.">Approve Blend Change</button><button class="ghost-btn" data-route="pellet">See pellet impact</button></div>
      </div>
    </div>`;
}

function haulRoads() {
  const roads = [
    [20,38,60,14],[28,66,46,-18],[53,28,38,72],[47,48,28,8],[60,62,26,-36]
  ];
  return roads.map(([x,y,w,rot]) => `<div class="haul-road" style="left:${x}%; top:${y}%; width:${w}%; transform: rotate(${rot}deg)"></div>`).join('');
}
function blockTile(b) {
  const cls = b.riskStatus === 'red' ? 'block-red' : b.riskStatus === 'amber' ? 'block-amber' : 'block-green';
  return `<button class="block ${cls} ${state.selectedBlock===b.blockId?'active':''}" data-block="${b.blockId}" style="left:${b.x}%; top:${b.y}%"><span>${b.blockId}<br>${b.fePct}% Fe<br>${b.silicaPct}% Si</span></button>`;
}
function mapAssets() {
  const items = [ ['SH',22,30], ['DR',31,22], ['HT',45,59], ['CR',72,47], ['ST',77,69], ['WL',53,36] ];
  return items.map(i => `<div class="map-asset" style="left:${i[1]}%; top:${i[2]}%">${i[0]}</div>`).join('');
}

function pelletScreen() {
  const lab = latestLab();
  const k = currentKpis();
  const approved = state.approvedScenarios.has(state.selectedScenario);
  return `${screenHead('Pellet Plant Optimizer', 'Pit-to-pellet AI prevents quality loss before it becomes off-spec', 'Animated process flow connects mine feed, grinding, balling, induration, cooling, screening, and rail loadout with root-cause recommendations and before/after impact.', 'Off-spec risk', `${k.offSpecRisk}%`)}
    <div class="panel">
      <div class="panel-title"><h2>Animated Pit-to-Pellet Process Flow</h2>${statusBadge('live control loop','blue')}</div>
      <div class="process-flow">${state.data.pellet_plant_sensors.map(stageCard).join('')}</div>
    </div>
    <div class="grid quality-kpis" style="margin-top:16px">
      ${kpiCard({label:'Fe grade', value:k.feGrade.toFixed(2), unit:'%', delta:'Stable high-grade concentrate', tone:'green', status:'lab'})}
      ${kpiCard({label:'Silica', value:k.silica.toFixed(2), unit:'%', delta:'N-14 drift detected', tone:'red', status:'watch'})}
      ${kpiCard({label:'Phosphorus', value:lab.phosphorusPct.toFixed(3), unit:'%', delta:'within DR control band', tone:'green', status:'lab'})}
      ${kpiCard({label:'Moisture', value:lab.moisturePct.toFixed(1), unit:'%', delta:'balling correction ready', tone:'amber', status:'process'})}
      ${kpiCard({label:'Green ball size in spec', value:lab.greenBallSizeInSpecPct.toFixed(1), unit:'%', delta:'disc speed can recover 3%', tone:'amber', status:'balling'})}
      ${kpiCard({label:'Binder rate', value:lab.binderRatePct.toFixed(2), unit:'%', delta:'+0.04% recommended', tone:'blue', status:'setpoint'})}
      ${kpiCard({label:'Induration Zone 3', value:lab.indurationZone3C, unit:'°C', delta:'+12°C recommended', tone:'amber', status:'furnace'})}
      ${kpiCard({label:'Tumble index', value:lab.tumbleIndexPct.toFixed(1), unit:'%', delta:'still within limit', tone:'green', status:'quality'})}
      ${kpiCard({label:'Compression strength', value:lab.compressionStrengthKg, unit:'kg', delta:'2.5 hr projection risk', tone:'red', status:'risk'})}
      ${kpiCard({label:'DR-grade readiness score', value:k.qualityScore, delta:approved?'AI action applied':'approval will recover to 94+', tone:k.qualityScore>92?'green':'amber', status:'AI'})}
    </div>
    <div class="grid two-col" style="margin-top:16px">
      <div class="panel ai-summary">
        <div class="panel-title"><h2>Pellet Quality Agent</h2>${statusBadge('root cause explained','amber')}</div>
        <p><b>Detected issue:</b> Compression strength is projected to fall below threshold in 2.5 hours due to moisture variation and silica drift.</p>
        <div class="alert-list">
          <div class="alert"><strong>Root cause</strong><span>Current N-14 feed carries silica above the DR-grade target while balling moisture is variable and furnace Zone 3 is under-correcting.</span></div>
          <div class="alert"><strong>Recommended action</strong><span>Reduce N-14 feed, increase binder rate by 0.04%, adjust balling disc speed by 3%, and optimize induration Zone 3 temperature by +12°C.</span></div>
          <div class="alert"><strong>Expected impact</strong><span>Off-spec risk reduces from 31% to 7%; DR readiness score recovers from 87 to 94; plan attainment recovers to 96%.</span></div>
        </div>
        <div class="action-row"><button class="success-btn" data-approve-current>Approve Pellet Recovery Plan</button><button class="ghost-btn" data-open-copilot>Ask why</button></div>
      </div>
      ${beforeAfterImpact(activeScenario())}
    </div>`;
}

function stageCard(s, index = 0) {
  const tone = s.healthStatus === 'healthy' ? 'green' : s.bottleneckStatus === 'constraint' ? 'amber' : 'blue';
  const liveThroughput = Math.max(0, Math.round(s.throughputTph + liveWave(index + 70, 18, 0.8) + liveJitter(index + 80, 8)));
  return `<div class="stage live-refresh" data-live-tick="${state.liveTick}"><h4>${s.stage}</h4>${statusBadge(s.healthStatus, tone)}<div class="throughput">${liveThroughput}<small> tph</small></div><div class="stage-meta"><span>Bottleneck: ${s.bottleneckStatus}</span><span>Quality impact: ${s.qualityImpact}</span><span>Energy impact: ${s.energyImpact}</span><span>${s.activeAlerts.length ? s.activeAlerts[0] : 'No active alert'}</span></div></div>`;
}

function beforeAfterImpact(scenario) {
  const before = scenario.before || {};
  const after = scenario.after || {};
  const rows = Array.from(new Set([...Object.keys(before), ...Object.keys(after)])).slice(0,5);
  return `<div class="panel"><div class="panel-title"><h2>Before / After Simulation</h2>${statusBadge(state.approvedScenarios.has(scenario.id)?'approved':'pending approval', state.approvedScenarios.has(scenario.id)?'green':'amber')}</div>
    <div class="before-after"><div class="impact-card"><h4>Before AI action</h4>${rows.map(r=>impactRow(r,before[r])).join('')}</div><div class="impact-card"><h4>After approval</h4>${rows.map(r=>impactRow(r,after[r])).join('')}</div></div>
  </div>`;
}
function impactRow(key, val) {
  return `<div class="impact-row"><span>${key.replace(/([A-Z])/g,' $1').replace(/Pct/g,'%').replace(/Usd/g,' $')}</span><b>${formatValue(key,val)}</b></div>`;
}
function formatValue(key,val) {
  if (val === undefined) return '—';
  if (typeof val === 'string') return val;
  if (key.toLowerCase().includes('usd')) return money(val);
  if (key.toLowerCase().includes('pct')) return `${val}%`;
  if (key.toLowerCase().includes('kwh')) return `${val} kWh/t`;
  if (key.toLowerCase().includes('kg')) return `${val} kg`;
  return val;
}

function reliabilityScreen() {
  const assets = mergedAssets();
  const high = assets.sort((a,b)=>b.failureRisk-a.failureRisk)[0];
  return `${screenHead('Reliability War Room', 'AI finds the asset that can stop the plant before it fails', 'Predictive maintenance combines vibration, temperature, current draw, runtime hours, maintenance due status, production impact, spare readiness, and explainable risk scoring.', 'Highest failure risk', `${high.assetId} ${high.failureRisk}%`)}
    <div class="grid two-col">
      <div class="panel ai-summary">
        <div class="panel-title"><h2>Why AI thinks this</h2>${statusBadge('deterministic scoring','purple')}</div>
        <p><b>CV-204 bearing temperature has increased 18% over baseline, vibration is above threshold, and current draw is unstable.</b> Failure probability: <b>${assetById('CV-204') ? equipmentFailureRisk(assetById('CV-204')) : 72}% within 18 hours</b>. Recommended action: schedule a 45-minute maintenance window during the planned feed transition.</p>
        <div class="alert"><strong>Failure risk formula</strong><span>0.30 × vibration anomaly + 0.25 × temperature anomaly + 0.20 × current draw anomaly + 0.15 × operating hours factor + 0.10 × maintenance overdue factor.</span></div>
        <div class="action-row"><button class="success-btn" data-toast="Work order generated and assigned to Reliability Supervisor.">Create Work Order</button><button class="ghost-btn" data-toast="Bearing kit BRG-CV204-XL is available: 2 on hand.">Check Spare Availability</button><button class="danger-btn" data-toast="Deferral simulation: risk rises to 84% and value exposure increases by $0.4M.">Defer and Simulate Risk</button></div>
      </div>
      <div class="panel"><div class="panel-title"><h2>Maintenance Work Orders</h2>${statusBadge('ready to schedule','blue')}</div>${workOrderTable()}</div>
    </div>
    <div class="grid asset-grid" style="margin-top:16px">${assets.map(assetCard).join('')}</div>`;
}

function assetCard(a) {
  const liveRisk = Math.max(1, Math.min(99, Math.round(a.failureRisk + liveWave(a.healthScore, 2.8, 0.7) + liveJitter(a.failureRisk, 1.2))));
  const liveHealth = Math.max(1, Math.min(100, Math.round(a.healthScore - (liveRisk - a.failureRisk) * 0.35 + liveJitter(a.healthScore, 0.8))));
  const tone = classifyRisk(liveRisk);
  return `<div class="asset-card live-refresh" data-live-tick="${state.liveTick}">
    <div class="panel-title"><h3>${a.assetId}</h3>${statusBadge(`${liveRisk}% risk`, tone)}</div>
    <div class="asset-meta">${a.assetType} • ${a.location}</div>
    <div class="health-ring"><div class="ring" style="--pct:${liveHealth}%"><b>${liveHealth}</b></div><div><b>Health score</b><div class="mini">TTF: ${liveRisk>65?'18 hrs':liveRisk>45?'4 days':'14+ days'}</div></div></div>
    <div class="asset-signals"><div class="signal"><span>Vibration</span><b>${a.vibrationAnomaly}</b></div><div class="signal"><span>Temperature</span><b>${a.temperatureC}°C</b></div><div class="signal"><span>Current</span><b>${pct(a.currentDrawAnomaly*100)}</b></div><div class="signal"><span>Runtime</span><b>${num(a.runtimeHours)}h</b></div></div>
    <div class="explain">Action: ${a.recommendedAction}. Failed impact: ${a.productionImpactTph} tph.</div>
  </div>`;
}

function workOrderTable() {
  return `<table class="table"><thead><tr><th>WO</th><th>Asset</th><th>Priority</th><th>Status</th><th>Duration</th></tr></thead><tbody>${state.data.maintenance_work_orders.map(w=>`<tr><td>${w.workOrderId}</td><td>${w.assetId}</td><td>${w.priority}</td><td>${w.status}</td><td>${w.durationMin} min</td></tr>`).join('')}</tbody></table>`;
}

function energyScreen() {
  const energy = state.data.energy_weather_market;
  const esg = state.data.emissions_water_dust;
  const k = currentKpis();
  const eOpp = energyOptimizationOpportunity(energy);
  const erisk = esgRisk(esg, energy.weather);
  const srisk = safetyRisk(state.data.safety_events, esg, energy.weather);
  return `${screenHead('Energy, ESG & Safety Cockpit', 'Sustainability decisions are now operational, not monthly reporting', 'Energy, carbon, dust, water, weather, safety observations, permits, and reclamation progress are interpreted by agents as shift-level actions.', 'Composite ESG risk', erisk)}
    <div class="grid kpi-grid">
      ${kpiCard({label:'Energy per ton', value:k.energyPerTon.toFixed(1), unit:'kWh/t', delta:`${money(eOpp.savingsUsd)} savings available`, tone:'amber', status:'energy'})}
      ${kpiCard({label:'Peak power demand', value:(energy.powerDemandMW + liveWave(90, 1.8, 0.75) + liveJitter(91, 0.6)).toFixed(1), unit:'MW', delta:`Peak tariff ${energy.peakTariffWindow}`, tone:'amber', status:'peak'})}
      ${kpiCard({label:'Carbon intensity', value:k.carbonIntensity.toFixed(1), unit:'kg/t', delta:'3.4% improvement recommended', tone:'blue', status:'carbon'})}
      ${kpiCard({label:'Water usage', value:esg.waterUsageM3PerT.toFixed(2), unit:'m³/t', delta:'within operating range', tone:'green', status:'water'})}
      ${kpiCard({label:'Dust index', value:esg.dustIndex, delta:`limit ${esg.dustLimit}`, tone:esg.dustIndex>70?'amber':'green', status:'dust'})}
      ${kpiCard({label:'Safety risk score', value:srisk, delta:'high wind + open observations', tone:srisk>60?'amber':'green', status:'safety'})}
    </div>
    <div class="grid four-col" style="margin-top:16px">
      ${agentPanel('Energy Optimization Agent','Energy Agent recommends shifting non-critical grinding load by 45 minutes to avoid peak tariff and reduce cost per ton. Carbon intensity improves by 3.4% with no production loss.','Approve energy shift', 'amber')}
      ${agentPanel('Carbon & ESG Agent',`Emissions status: ${esg.emissionsStatus}. Reclamation progress is ${esg.reclamationProgressPct}%, with ${esg.openESGActions} open ESG actions.`, 'Send ESG note', 'blue')}
      ${agentPanel('Safety Compliance Agent','High wind and stockpile dust risk detected. Recommend water suppression and restricted vehicle movement in Zone S-3.', 'Activate controls', 'red')}
      ${agentPanel('Weather Risk Agent',`${energy.weather.condition}. Gusts ${energy.weather.gustMph} mph; adjust stockpile movement and update haul speed controls.`, 'Update shift plan', 'amber')}
    </div>
    <div class="grid two-col" style="margin-top:16px">
      <div class="panel"><div class="panel-title"><h2>Dust and Water Control Zones</h2>${statusBadge('EHS live','green')}</div>${zoneTable()}</div>
      <div class="panel"><div class="panel-title"><h2>Open Safety Observations</h2>${statusBadge(`${state.data.safety_events.filter(e=>e.status!=='closed').length} open`, 'amber')}</div><div class="alert-list">${state.data.safety_events.map(e=>`<div class="alert"><strong>${e.zone} • ${e.type}</strong><span>${e.severity} severity • ${e.status} • AI: ${e.aiRecommendation}</span></div>`).join('')}</div></div>
    </div>`;
}
function agentPanel(name, text, action, tone='blue') {
  return `<div class="panel"><div class="panel-title"><h3>${name}</h3>${statusBadge('active',tone)}</div><p class="mini" style="line-height:1.55">${text}</p><button class="ghost-btn" data-toast="${action} action logged for human approval.">${action}</button></div>`;
}
function zoneTable() {
  return `<table class="table"><thead><tr><th>Zone</th><th>Dust</th><th>Wind risk</th><th>Action</th></tr></thead><tbody>${state.data.emissions_water_dust.zones.map(z=>`<tr><td>${z.zone}</td><td>${z.dustIndex}</td><td>${z.windRisk}</td><td>${z.recommendedAction}</td></tr>`).join('')}</tbody></table>`;
}

function logisticsScreen() {
  const risk = logisticsDelayRisk(state.data.logistics_shipments);
  const inventory = state.data.logistics_shipments.reduce((s,x)=>s+x.inventoryTons,0) + liveWave(100, 420, 0.7) + liveJitter(101, 130);
  return `${screenHead('Logistics & Supply Chain Control', 'Quality-matched pellets move to the right customer before demurrage appears', 'Finished pellet inventory, railcar availability, customer contract requirements, shipment risk, and loadout sequencing are optimized by a logistics agent.', 'Dispatch delay risk', risk)}
    <div class="grid kpi-grid">
      ${kpiCard({label:'Finished pellet inventory', value:num(inventory), unit:'t', delta:'segmented by quality stockpile', tone:'green', status:'stock'})}
      ${kpiCard({label:'Railcar availability', value:num(state.data.logistics_shipments.reduce((s,x)=>s+x.railcarsAvailable,0)), delta:'28-car rebalance needed', tone:'amber', status:'rail'})}
      ${kpiCard({label:'Loadout status', value:'P2', unit:'priority', delta:'Resequence before P4', tone:'blue', status:'loadout'})}
      ${kpiCard({label:'On-time dispatch risk', value:risk, unit:'/100', delta:'Customer A 9-hour risk', tone:risk>60?'amber':'green', status:'OTD'})}
      ${kpiCard({label:'Demurrage risk', value:money(state.data.logistics_shipments.reduce((s,x)=>s+x.demurrageRiskUsd,0)), delta:'avoidable with sequencing', tone:'red', status:'risk'})}
      ${kpiCard({label:'Contract quality match', value:'93', unit:'%', delta:'P2 meets DR threshold', tone:'green', status:'quality'})}
    </div>
    <div class="grid two-col" style="margin-top:16px">
      <div class="panel ai-summary"><div class="panel-title"><h2>Logistics Agent Recommendation</h2>${statusBadge('dispatch optimized','blue')}</div><p>Shipment to <b>Customer A</b> requires DR-grade pellet quality above threshold. Current stockpile <b>P2</b> meets quality, but railcar availability creates a <b>9-hour delay risk</b>. Agent recommends resequencing P2 loadout before P4 and reallocating 28 railcars from a lower-margin order.</p><div class="action-row"><button class="success-btn" data-toast="P2 loadout sequence approved and dispatch board updated.">Approve Resequencing</button><button class="ghost-btn" data-toast="Customer notification drafted for shipment ETA update.">Notify Customer Team</button></div></div>
      <div class="panel"><div class="panel-title"><h2>Customer Shipment Schedule</h2>${statusBadge('live','green')}</div>${shipmentTable()}</div>
    </div>`;
}
function shipmentTable() {
  return `<table class="table"><thead><tr><th>Shipment</th><th>Customer</th><th>Quality</th><th>Railcars</th><th>Status</th><th>Risk</th></tr></thead><tbody>${state.data.logistics_shipments.map(s=>`<tr><td>${s.shipmentId}</td><td>${s.customer}</td><td>${s.stockpile} • ${s.requiredQuality}</td><td>${s.railcarsAvailable}/${s.railcarsRequired}</td><td>${s.loadoutStatus}</td><td>${money(s.demurrageRiskUsd)}</td></tr>`).join('')}</tbody></table>`;
}

function agentsScreen() {
  const agents = [
    ['Mine Plan Intelligence Agent','running','Rebalanced N-14 and E-07 blend to protect DR-grade silica tolerance.',.91,1800000,'Approve blend change'],
    ['Drill & Blast Optimization Agent','watch','Updated fragmentation model for N-14 to stabilize crusher throughput.',.78,240000,'Update drill plan'],
    ['Fleet & Haulage Dispatch Agent','running','Rerouting two trucks from W-05 to E-07 for recovery blend support.',.86,310000,'Send to dispatcher'],
    ['Crusher & Conveyor Health Agent','approval','CV-204 bearing risk rising; 45-minute window available.',.87,920000,'Create work order'],
    ['Pellet Quality Optimizer Agent','approval','Compression strength projected below threshold in 2.5 hours.',.91,1800000,'Approve setpoints'],
    ['Energy & Carbon Agent','running','Peak tariff exposure found in next 90 minutes.',.84,42000,'Shift load'],
    ['Maintenance & Spares Agent','running','Bearing kit BRG-CV204-XL available; reserve now.',.88,360000,'Reserve spare'],
    ['Safety & Compliance Agent','watch','Zone S-3 dust risk elevated by high wind.',.82,150000,'Activate controls'],
    ['Logistics Agent','running','Customer A needs P2 loadout resequenced before P4.',.86,380000,'Resequence rail'],
    ['COO Copilot','ready','Generated integrated recovery plan across quality, reliability, energy, and logistics.',.93,2600000,'Ask Copilot']
  ];
  return `${screenHead('Agent Command Center', 'Every agent explains, recommends, and waits for human approval', 'This screen demonstrates the AIonOS operating model: specialist agents detect, explain, simulate, and route decisions through a COO Copilot with human-in-the-loop controls.', 'Active agents', agents.length)}
    <div class="grid two-col">
      <div class="panel"><div class="panel-title"><h2>Live Agent Activity Feed</h2>${statusBadge('streaming','green')}</div><div class="feed">${liveFeed().map(f=>`<div class="feed-item"><span class="dot"></span><div><strong>${f[0]}</strong>${f[1]}</div></div>`).join('')}</div></div>
      <div class="panel ai-summary"><div class="panel-title"><h2>COO Copilot Integrated Recovery Plan</h2>${statusBadge('ready','blue')}</div><p>Approve the ore blend shift, CV-204 preventive maintenance window, pellet plant setpoint correction, and peak-tariff energy shift as a single recovery plan. Expected recovery: <b>96% of pellet plan</b>. Value protected: <b>${compactMoney(1500000)}</b>.</p><div class="action-row"><button class="success-btn" data-approve-current>Approve integrated plan</button><button class="ghost-btn" data-open-copilot>Ask for explanation</button><button class="ghost-btn" data-toast="Recovery plan sent to Mine, Plant, Reliability, EHS, and Logistics teams.">Send to team</button></div></div>
    </div>
    <div class="grid agent-grid" style="margin-top:16px">${agents.map(agentCard).join('')}</div>`;
}
function liveFeed() {
  return [
    ['Pellet Quality Agent', 'detected silica drift from Block N-14.'],
    ['Maintenance Agent', 'identified CV-204 bearing risk and spare kit availability.'],
    ['Energy Agent', 'found peak tariff exposure in the next 90 minutes.'],
    ['Logistics Agent', 'flagged Customer A loadout delay and P2 quality match.'],
    ['Safety Agent', 'detected high wind and stockpile dust risk in Zone S-3.'],
    ['COO Copilot', 'generated an integrated recovery plan for leadership approval.']
  ];
}
function agentCard(a) {
  const [name,status,finding,conf,varUsd,action] = a;
  const tone = status === 'approval' ? 'amber' : status === 'watch' ? 'red' : 'green';
  return `<div class="agent-card"><div class="panel-title"><h3>${name}</h3>${statusBadge(status,tone)}</div><p>${finding}</p><div class="agent-metrics"><span>Confidence <b>${pct(conf*100)}</b></span><span>VAR <b>${compactMoney(varUsd)}</b></span></div><div class="agent-actions"><button class="tiny-btn" data-toast="${action} submitted for approval.">${action}</button><button class="tiny-btn" data-open-copilot>Ask explanation</button><button class="tiny-btn" data-route="simulator">Simulate impact</button></div></div>`;
}

function simulatorScreen() {
  const scenario = activeScenario();
  const approved = state.approvedScenarios.has(scenario.id);
  return `${screenHead('Scenario Simulator', 'Scripted scenarios turn the demo into a leadership decision theater', 'Trigger silica spikes, bearing failures, weather disruption, quality loss, power price spikes, rail delays, dust alerts, and ramp-up shortfalls. Each scenario updates KPIs, recommendations, and before/after impact.', 'Current scenario', scenario.name)}
    <div class="grid scenario-grid">${state.data.scenarios.map(s=>`<button class="scenario-btn ${s.id===scenario.id?'active':''}" data-scenario="${s.id}"><strong>${s.name}</strong><span>${s.trigger}</span></button>`).join('')}</div>
    <div class="sim-panel" style="margin-top:16px">
      ${beforeAfterImpact(scenario)}
      <div class="panel ai-summary"><div class="panel-title"><h2>${scenario.agent}</h2>${statusBadge(approved?'approved':'recommendation ready', approved?'green':'amber')}</div><p><b>Trigger:</b> ${scenario.trigger}</p><div class="recovery-steps">${scenario.recommendation.map(r=>`<div class="recovery-step">${r}</div>`).join('')}</div><div class="action-row"><button class="success-btn" data-approve-current>${approved?'Approved':'Approve action'}</button><button class="ghost-btn" data-open-copilot>Ask COO Copilot</button><button class="ghost-btn" data-toast="Scenario impact shared with executive room display.">Send to leadership</button></div></div>
    </div>`;
}

function copilotModal() {
  const questions = [
    'Can we still hit today’s pellet target?',
    'What is the biggest risk right now?',
    'Why is pellet quality dropping?',
    'Which asset could fail next?',
    'What should we approve now?',
    'How do we recover production?',
    'What is the value at risk?',
    'How do we reduce energy cost today?'
  ];
  return `<div class="copilot-modal ${state.copilotOpen?'open':''}" data-modal>
    <div class="copilot">
      <div class="copilot-head"><div><div class="eyebrow">AIonOS COO Copilot</div><h2>Ask operational questions in executive language</h2><p>Answers are scripted but dynamically use current scenario, risk, approval, and KPI state.</p></div><button class="close-x" data-close-copilot>×</button></div>
      <div class="q-grid">${questions.map(q=>`<button class="tiny-btn" data-question="${q}">${q}</button>`).join('')}</div>
      <div class="answer"><b>${state.copilotQuestion}</b><br><br>${copilotAnswer(state.copilotQuestion)}</div>
    </div>
  </div>`;
}

function copilotAnswer(q) {
  const k = currentKpis();
  const s = activeScenario();
  const approved = state.approvedScenarios.has(s.id);
  const topAsset = mergedAssets().sort((a,b)=>b.failureRisk-a.failureRisk)[0];
  if (q.includes('hit today')) return `Yes, Mesabi can still recover to 96% of today’s pellet target if the recommended ore blend change and CV-204 maintenance window are approved within the next 60 minutes. The biggest constraint is silica drift from Block N-14 and bearing stress on Conveyor CV-204. AI recommends blending with Block E-07, reducing N-14 feed to 22%, and scheduling a 45-minute maintenance intervention during the planned feed transition. Estimated value protected: ${compactMoney(valueProtectedAfterAction(s))}.`;
  if (q.includes('biggest risk')) return `The biggest current risk is ${s.name}. It carries approximately ${compactMoney(s.before.valueAtRiskUsd || k.valueAtRisk)} of risk and is linked to ${s.agent}. Approval status: ${approved ? 'approved and being tracked' : 'pending human approval'}.`;
  if (q.includes('quality')) return `Pellet quality is dropping because silica drift from N-14 is entering the current blend while moisture variation is affecting green ball formation. The action is to reduce N-14 feed, increase E-07 blend share, tune balling disc speed, and adjust induration Zone 3 temperature. The off-spec risk can move from ${s.before.offSpecRiskPct || k.offSpecRisk}% to ${s.after.offSpecRiskPct || 7}% after approval.`;
  if (q.includes('asset')) return `${topAsset.assetId} is the next asset most likely to fail. The risk score is ${topAsset.failureRisk}%, driven by vibration anomaly ${topAsset.vibrationAnomaly}, temperature ${topAsset.temperatureC}°C, and current draw ${pct(topAsset.currentDrawAnomaly*100)}. Recommended action: ${topAsset.recommendedAction}.`;
  if (q.includes('approve')) return `Approve the integrated recovery plan: 1) ore blend correction, 2) CV-204 maintenance window, 3) pellet plant setpoint changes, 4) peak-tariff energy shift, and 5) P2 loadout resequencing. These actions protect approximately ${compactMoney(1500000)} and improve plan attainment to 96%.`;
  if (q.includes('recover')) return `Recover production by reducing quality constraints first, then protecting conveyor uptime. The highest leverage sequence is: adjust ore blend, stabilize balling moisture, raise induration Zone 3 by 12°C, schedule CV-204 intervention, and dispatch E-07 trucks to support the recovery blend.`;
  if (q.includes('value')) return `Current risk-weighted value at risk is ${compactMoney(k.valueAtRisk)}. The next approval can protect approximately ${compactMoney(valueProtectedAfterAction(s))}. Value risk sources: DR off-spec exposure, CV-204 downtime risk, peak power exposure, dust compliance risk, and rail delay exposure.`;
  if (q.includes('energy')) return `Shift non-critical grinding load by 45 minutes outside the ${state.data.energy_weather_market.peakTariffWindow} peak tariff window. This preserves production, reduces cost per ton, and improves carbon intensity by approximately 3.4%.`;
  return `The current best action is to approve the ${s.name} recovery recommendation from ${s.agent}. Expected protected value: ${compactMoney(valueProtectedAfterAction(s))}.`;
}

function renderRoute() {
  const route = state.route;
  if (route === 'mine') return mineScreen();
  if (route === 'pellet') return pelletScreen();
  if (route === 'reliability') return reliabilityScreen();
  if (route === 'energy') return energyScreen();
  if (route === 'logistics') return logisticsScreen();
  if (route === 'agents') return agentsScreen();
  if (route === 'simulator') return simulatorScreen();
  return executiveScreen();
}

function render() {
  $('#app').innerHTML = `<div class="app-shell">${sidebar()}<main class="main">${topbar()}<section class="content">${renderRoute()}</section></main></div>${copilotModal()}<div class="toast ${state.toast?'show':''}">${state.toast}</div>`;
}

function navigate(route) {
  state.route = route;
  history.replaceState(null, '', `#${route}`);
  render();
}

function approveCurrent() {
  state.approvedScenarios.add(state.selectedScenario);
  showToast(`${activeScenario().name} approved. KPIs updated and value protected.`);
}

function showToast(message) {
  state.toast = message;
  render();
  setTimeout(() => { state.toast = ''; render(); }, 2400);
}

document.addEventListener('click', e => {
  const routeBtn = e.target.closest('[data-route]');
  if (routeBtn) return navigate(routeBtn.dataset.route);
  const blockBtn = e.target.closest('[data-block]');
  if (blockBtn) { state.selectedBlock = blockBtn.dataset.block; return render(); }
  const scenarioBtn = e.target.closest('[data-scenario]');
  if (scenarioBtn) { state.selectedScenario = scenarioBtn.dataset.scenario; return render(); }
  const approveBtn = e.target.closest('[data-approve-current]');
  if (approveBtn) return approveCurrent();
  const toastBtn = e.target.closest('[data-toast]');
  if (toastBtn) return showToast(toastBtn.dataset.toast);
  const openCopilot = e.target.closest('[data-open-copilot]');
  if (openCopilot) { state.copilotOpen = true; return render(); }
  const closeCopilot = e.target.closest('[data-close-copilot]');
  if (closeCopilot) { state.copilotOpen = false; return render(); }
  const question = e.target.closest('[data-question]');
  if (question) { state.copilotQuestion = question.dataset.question; return render(); }
  if (e.target.matches('[data-modal]')) { state.copilotOpen = false; return render(); }
});

document.addEventListener('change', e => {
  if (e.target.matches('[data-scenario-select]')) {
    state.selectedScenario = e.target.value;
    state.route = 'simulator';
    history.replaceState(null, '', '#simulator');
    render();
  }
});

window.addEventListener('hashchange', () => {
  const route = location.hash.replace('#','') || 'executive';
  if (routes.some(([id]) => id === route)) { state.route = route; render(); }
});

loadData().then(() => {
  render();
  setInterval(() => { state.liveTick += 1; render(); }, LIVE_REFRESH_MS);
}).catch(err => {
  $('#app').innerHTML = `<div class="boot-screen"><div class="boot-logo">AIonOS</div><h1>Data load failed</h1><p>${err.message}</p></div>`;
});
