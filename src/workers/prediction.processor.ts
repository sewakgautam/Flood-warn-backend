import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { EngineService } from '../processing/engine.service';

const DEDUP_WINDOW_MS = 2 * 60 * 60 * 1000;

@Processor('predictions')
export class PredictionProcessor {
  private readonly logger = new Logger(PredictionProcessor.name);

  constructor(private prisma: PrismaService, private engine: EngineService) {}

  @Process()
  async process(job: Job<{ stationId: string }>) {
    const { stationId } = job.data;
    this.logger.log(`Running prediction for station: ${stationId}`);

    const result = await this.engine.runPrediction(stationId);

    if (['WATCH', 'WARNING', 'CRITICAL'].includes(result.risk_level)) {
      await this.createAlertIfNeeded(stationId, result.risk_level, result.recommendation);
    }

    await this.prisma.station.update({
      where: { id: stationId },
      data: { lastSeenAt: new Date(), status: 'ONLINE' },
    });

    return result;
  }

  private async createAlertIfNeeded(stationId: string, severity: string, message: string) {
    const since = new Date(Date.now() - DEDUP_WINDOW_MS);
    const existing = await this.prisma.alert.findFirst({
      where: { stationId, severity, createdAt: { gte: since } },
    });
    if (existing) {
      this.logger.log(`Dedup: alert ${severity} for ${stationId} already exists`);
      return;
    }
    const alert = await this.prisma.alert.create({
      data: { stationId, severity, message, source: 'auto' },
    });
    this.logger.log(`Created alert ${alert.id} — ${severity} for ${stationId}`);
  }
}
