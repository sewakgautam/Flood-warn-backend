import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkersScheduler {
  private readonly logger = new Logger(WorkersScheduler.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue('predictions') private predictionsQueue: Queue,
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
      this.logger.error('Poll error:', err.message);
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
      this.logger.error('Health check error:', err.message);
    }
  }
}
