export function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export function pelletQualityScore(latestLab) {
  const feGradeScore = clamp((latestLab.feGradePct - 65.5) * 14, 0, 30);
  const silicaPenalty = Math.max(0, latestLab.silicaPct - 2.8) * 10;
  const phosphorusPenalty = Math.max(0, latestLab.phosphorusPct - 0.045) * 800;
  const moistureDeviationPenalty = Math.abs(latestLab.moisturePct - 7.4) * 3;
  const sizeDistributionPenalty = Math.max(0, 90 - latestLab.greenBallSizeInSpecPct) * 0.45;
  const compressionStrengthScore = clamp((latestLab.compressionStrengthKg - 255) * 0.22, 0, 22);
  const tumbleIndexScore = clamp((latestLab.tumbleIndexPct - 89) * 2.6, 0, 16);
  return Math.round(clamp(68 + feGradeScore + compressionStrengthScore + tumbleIndexScore - silicaPenalty - phosphorusPenalty - moistureDeviationPenalty - sizeDistributionPenalty, 0, 100));
}

export function equipmentFailureRisk(asset) {
  const operatingHoursFactor = clamp((asset.runtimeHours - 5000) / 7000, 0, 1);
  const overdueFactor = new Date(asset.maintenanceDueDate) < new Date('2026-06-18') ? 1 : 0;
  const risk = 0.30 * asset.vibrationAnomaly +
    0.25 * asset.temperatureAnomaly +
    0.20 * asset.currentDrawAnomaly +
    0.15 * operatingHoursFactor +
    0.10 * overdueFactor;
  return Math.round(clamp(risk * 100, 0, 98));
}

export function productionRisk({ planAttainmentPct, offSpecRiskPct, assetAvailabilityPct }) {
  return Math.round(clamp((100 - planAttainmentPct) * 0.55 + offSpecRiskPct * 0.28 + (100 - assetAvailabilityPct) * 0.32, 0, 100));
}

export function energyOptimizationOpportunity(energy, productionTons = 17650) {
  const peakPremium = energy.market.powerPriceUsdMwh > 90 ? (energy.market.powerPriceUsdMwh - 90) / 90 : 0;
  const loadFlexibilityMwh = 14.2;
  const savings = Math.round(loadFlexibilityMwh * energy.market.powerPriceUsdMwh * (0.45 + peakPremium));
  const kwhImpact = Math.round((energy.energyPerTonKwh - 89) * productionTons);
  return { savingsUsd: Math.max(18000, savings * 20), avoidableKwh: Math.max(0, kwhImpact) };
}

export function esgRisk(esg, weather) {
  const dustPressure = (esg.dustIndex / esg.dustLimit) * 46;
  const carbonPressure = Math.max(0, esg.carbonIntensityKgCO2ePerT - 35) * 4;
  const windPressure = weather.windSpeedMph > 22 ? 18 : 5;
  return Math.round(clamp(dustPressure + carbonPressure + windPressure, 0, 100));
}

export function safetyRisk(safetyEvents, esg, weather) {
  const open = safetyEvents.filter(e => e.status !== 'closed').length;
  const severe = safetyEvents.filter(e => e.severity === 'high').length;
  return Math.round(clamp(22 + open * 7 + severe * 12 + (esg.dustIndex > 70 ? 12 : 0) + (weather.gustMph > 32 ? 10 : 0), 0, 100));
}

export function logisticsDelayRisk(shipments) {
  const weighted = shipments.map(s => {
    const railGap = Math.max(0, s.railcarsRequired - s.railcarsAvailable);
    return Math.min(100, railGap * 1.2 + s.dispatchEtaHours * 2 + s.demurrageRiskUsd / 4000);
  });
  return Math.round(weighted.reduce((a,b)=>a+b,0) / weighted.length);
}

export function recommendationPriority(rec) {
  return Math.round((rec.valueAtRiskUsd / 1000000) * rec.confidence * rec.urgency * rec.safetyMultiplier * 100);
}

export function valueAtRisk(recommendations) {
  return recommendations.reduce((sum, r) => sum + (r.valueAtRiskUsd || 0), 0);
}

export function valueProtectedAfterAction(scenario) {
  return scenario?.after?.valueProtectedUsd || Math.round((scenario?.before?.valueAtRiskUsd || 0) * 0.78);
}

export function classifyRisk(score) {
  if (score >= 70) return 'red';
  if (score >= 45) return 'amber';
  return 'green';
}
