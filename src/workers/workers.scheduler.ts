import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { PublicController } from '../public/public.controller';

const DEFAULT_THRESHOLDS = {
  watchRiver: 2.5, warningRiver: 3.5, criticalRiver: 4.5,
  watchRain: 30, warningRain: 50, criticalRain: 80,
};

@Injectable()
export class WorkersScheduler {
  private readonly logger = new Logger(WorkersScheduler.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue('predictions') private predictionsQueue: Queue,
    private publicController: PublicController,
  ) {}

  @Interval(15 * 60 * 1000)
  async pollStations() {
    try {
      const stations = await this.prisma.station.findMany({
        where: { active: true },
        select: { id: true },
      });
      this.logger.log(`Scheduler: Polling ${stations.length} stations`);
      for (const s of stations) {
        await this.predictionsQueue
          .add({ stationId: s.id }, { jobId: `predict-${s.id}-${Date.now()}` })
          .catch(console.error);
      }
    } catch (err) {
      this.logger.error('Poll error:', (err as Error).message);
    }
  }

  @Interval(30 * 60 * 1000)
  async checkStationHealth() {
    try {
      const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const stations = await this.prisma.station.findMany({ where: { active: true } });
      for (const station of stations) {
        const latest = await this.prisma.rainfall.findFirst({
          where: { stationId: station.id, timestamp: { gte: cutoff } },
        });
        const newStatus = latest ? 'ONLINE' : 'OFFLINE';
        if (station.status !== newStatus) {
          await this.prisma.station.update({
            where: { id: station.id },
            data: { status: newStatus },
          });
          this.logger.log(`Health: Station ${station.id} → ${newStatus}`);
        }
      }
    } catch (err) {
      this.logger.error('Health check error:', (err as Error).message);
    }
  }

  /** Every 30 min: compute risk for each station and dispatch alert emails. */
  @Interval(30 * 60 * 1000)
  async dispatchAlertEmails() {
    try {
      const stations = await this.prisma.station.findMany({
        where: { active: true },
        include: {
          thresholds: true,
          riverLevels: { orderBy: { timestamp: 'desc' }, take: 1 },
          rainfallReadings: { orderBy: { timestamp: 'desc' }, take: 1 },
        },
      });

      let totalSent = 0;
      for (const s of stations) {
        const t = { ...DEFAULT_THRESHOLDS, ...s.thresholds };
        const river = s.riverLevels[0]?.levelM ?? 0;
        const rain = s.rainfallReadings[0]?.valueMm ?? 0;

        let risk = 'NORMAL';
        if (river >= t.criticalRiver || rain >= t.criticalRain) risk = 'CRITICAL';
        else if (river >= t.warningRiver || rain >= t.warningRain) risk = 'WARNING';
        else if (river >= t.watchRiver || rain >= t.watchRain) risk = 'WATCH';

        if (risk === 'NORMAL') continue;

        const sent = await this.publicController.dispatchAlerts(
          s.id, risk,
          s.riverLevels[0]?.levelM ?? null,
          s.rainfallReadings[0]?.valueMm ?? null,
        );
        totalSent += sent;
      }

      if (totalSent > 0) {
        this.logger.log(`Alert emails dispatched: ${totalSent}`);
      }
    } catch (err) {
      this.logger.error('Alert dispatch error:', (err as Error).message);
    }
  }
}
