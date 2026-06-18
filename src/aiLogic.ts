export type Lab = {
  feGradePct: number;
  silicaPct: number;
  phosphorusPct: number;
  moisturePct: number;
  greenBallSizeInSpecPct: number;
  compressionStrengthKg: number;
  tumbleIndexPct: number;
};

export type Telemetry = {
  vibrationAnomaly: number;
  temperatureAnomaly: number;
  currentDrawAnomaly: number;
  runtimeHours: number;
  maintenanceDueDate: string;
};

export type Recommendation = {
  valueAtRiskUsd: number;
  confidence: number;
  urgency: number;
  safetyMultiplier: number;
};

export const clamp = (value: number, min = 0, max = 100): number => Math.max(min, Math.min(max, value));

export function pelletQualityScore(latestLab: Lab): number {
  const feGradeScore = clamp((latestLab.feGradePct - 65.5) * 14, 0, 30);
  const silicaPenalty = Math.max(0, latestLab.silicaPct - 2.8) * 10;
  const phosphorusPenalty = Math.max(0, latestLab.phosphorusPct - 0.045) * 800;
  const moistureDeviationPenalty = Math.abs(latestLab.moisturePct - 7.4) * 3;
  const sizeDistributionPenalty = Math.max(0, 90 - latestLab.greenBallSizeInSpecPct) * 0.45;
  const compressionStrengthScore = clamp((latestLab.compressionStrengthKg - 255) * 0.22, 0, 22);
  const tumbleIndexScore = clamp((latestLab.tumbleIndexPct - 89) * 2.6, 0, 16);
  return Math.round(clamp(68 + feGradeScore + compressionStrengthScore + tumbleIndexScore - silicaPenalty - phosphorusPenalty - moistureDeviationPenalty - sizeDistributionPenalty, 0, 100));
}

export function equipmentFailureRisk(asset: Telemetry): number {
  const operatingHoursFactor = clamp((asset.runtimeHours - 5000) / 7000, 0, 1);
  const overdueFactor = new Date(asset.maintenanceDueDate) < new Date('2026-06-18') ? 1 : 0;
  const risk = 0.30 * asset.vibrationAnomaly + 0.25 * asset.temperatureAnomaly + 0.20 * asset.currentDrawAnomaly + 0.15 * operatingHoursFactor + 0.10 * overdueFactor;
  return Math.round(clamp(risk * 100, 0, 98));
}

export function recommendationPriority(rec: Recommendation): number {
  return Math.round((rec.valueAtRiskUsd / 1_000_000) * rec.confidence * rec.urgency * rec.safetyMultiplier * 100);
}
