import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRiverLevelDto } from './dto/create-river-level.dto';

@Injectable()
export class RiverLevelService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('predictions') private predictionsQueue: Queue,
  ) {}

  async create(dto: CreateRiverLevelDto) {
    await this.prisma.station.findUniqueOrThrow({ where: { id: dto.station_id } });

    const reading = await this.prisma.riverLevel.create({
      data: {
        stationId: dto.station_id,
        timestamp: new Date(dto.timestamp),
        levelM: dto.level_m,
        flowRateCms: dto.flow_rate_cms,
      },
    });

    this.predictionsQueue
      .add({ stationId: dto.station_id }, { jobId: `predict-${dto.station_id}-${Date.now()}` })
      .catch(console.error);

    return {
      id: reading.id,
      station_id: reading.stationId,
      timestamp: reading.timestamp,
      level_m: reading.levelM,
      flow_rate_cms: reading.flowRateCms,
      created_at: reading.createdAt,
    };
  }

  findAll({ stationId, limit }: { stationId?: string; limit: string }) {
    return this.prisma.riverLevel.findMany({
      where: { ...(stationId && { stationId }) },
      orderBy: { timestamp: 'desc' },
      take: Math.min(parseInt(limit), 500),
    });
  }
}
