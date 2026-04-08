import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_THRESHOLDS = {
  watchRain: 30, warningRain: 50, criticalRain: 80,
  watchRiver: 2.5, warningRiver: 3.5, criticalRiver: 4.5,
};

const RECOMMENDATIONS: Record<string, string> = {
  NORMAL: 'All readings within safe limits. No action required.',
  WATCH: 'Readings approaching threshold. Continue monitoring closely.',
  WARNING: 'Issue advisory to downstream communities. Prepare response teams.',
  CRITICAL: 'Immediate evacuation advisory required. Alert all agencies.',
};

@Injectable()
export class EngineService {
  constructor(private prisma: PrismaService) {}

  async runPrediction(stationId: string, windowHours = 6) {
    const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);

    const [rainfallReadings, latestRiver, stationThresholds] = await Promise.all([
      this.prisma.rainfall.findMany({
        where: { stationId, timestamp: { gte: since } },
        select: { valueMm: true },
      }),
      this.prisma.riverLevel.findFirst({
        where: { stationId },
        orderBy: { timestamp: 'desc' },
        select: { levelM: true },
      }),
      this.prisma.stationThreshold.findUnique({ where: { stationId } }),
    ]);

    const thresholds = { ...DEFAULT_THRESHOLDS, ...stationThresholds };
    const totalRainfallMm = rainfallReadings.reduce((sum, r) => sum + r.valueMm, 0);
    const riverLevelM = latestRiver?.levelM ?? 0;

    let riskLevel: string;
    if (totalRainfallMm > thresholds.criticalRain || riverLevelM > thresholds.criticalRiver) {
      riskLevel = 'CRITICAL';
    } else if (totalRainfallMm > thresholds.warningRain || riverLevelM > thresholds.warningRiver) {
      riskLevel = 'WARNING';
    } else if (totalRainfallMm > thresholds.watchRain || riverLevelM > thresholds.watchRiver) {
      riskLevel = 'WATCH';
    } else {
      riskLevel = 'NORMAL';
    }

    const rainScore = Math.min(totalRainfallMm / thresholds.criticalRain, 1.0);
    const riverScore = Math.min(riverLevelM / thresholds.criticalRiver, 1.0);
    const score = Math.round(Math.max(rainScore, riverScore) * 100) / 100;

    return {
      station_id: stationId,
      risk_level: riskLevel,
      score,
      threshold_mm: thresholds.warningRain,
      current_mm: Math.round(totalRainfallMm * 100) / 100,
      river_level_m: riverLevelM,
      critical_level_m: thresholds.criticalRiver,
      recommendation: RECOMMENDATIONS[riskLevel],
      window_hours: windowHours,
      readings_count: rainfallReadings.length,
      evaluated_at: new Date().toISOString(),
    };
  }
}
