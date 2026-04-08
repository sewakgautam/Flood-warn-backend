import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRainfallDto } from './dto/create-rainfall.dto';

@Injectable()
export class RainfallService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('predictions') private predictionsQueue: Queue,
  ) {}

  async create(dto: CreateRainfallDto) {
    await this.prisma.station.findUniqueOrThrow({ where: { id: dto.station_id } });

    const reading = await this.prisma.rainfall.create({
      data: {
        stationId: dto.station_id,
        timestamp: new Date(dto.timestamp),
        valueMm: dto.value_mm,
        durationMinutes: dto.duration_minutes,
      },
    });

    this.predictionsQueue
      .add({ stationId: dto.station_id }, { jobId: `predict-${dto.station_id}-${Date.now()}` })
      .catch(console.error);

    return {
      id: reading.id,
      station_id: reading.stationId,
      timestamp: reading.timestamp,
      value_mm: reading.valueMm,
      created_at: reading.createdAt,
    };
  }

  findAll({ stationId, from, to, limit }: { stationId?: string; from?: string; to?: string; limit: string }) {
    return this.prisma.rainfall.findMany({
      where: {
        ...(stationId && { stationId }),
        ...((from || to) && {
          timestamp: {
            ...(from && { gte: new Date(from) }),
            ...(to && { lte: new Date(to) }),
          },
        }),
      },
      orderBy: { timestamp: 'desc' },
      take: Math.min(parseInt(limit), 500),
    });
  }
}
