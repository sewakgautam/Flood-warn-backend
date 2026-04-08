import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAlertDto } from './dto/create-alert.dto';

@Injectable()
export class AlertsService {
  constructor(private prisma: PrismaService) {}

  async findAll({
    stationId, severity, fromDate, toDate, page, pageSize,
  }: {
    stationId?: string; severity?: string; fromDate?: string;
    toDate?: string; page: string; pageSize: string;
  }) {
    const take = Math.min(parseInt(pageSize), 100);
    const skip = (parseInt(page) - 1) * take;
    const where = {
      ...(stationId && { stationId }),
      ...(severity && { severity }),
      ...((fromDate || toDate) && {
        createdAt: {
          ...(fromDate && { gte: new Date(fromDate) }),
          ...(toDate && { lte: new Date(toDate) }),
        },
      }),
    };
    const [total, results] = await Promise.all([
      this.prisma.alert.count({ where }),
      this.prisma.alert.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
    ]);
    return { total, page: parseInt(page), page_size: take, results };
  }

  async create(dto: CreateAlertDto) {
    await this.prisma.station.findUniqueOrThrow({ where: { id: dto.station_id } });
    const alert = await this.prisma.alert.create({
      data: {
        stationId: dto.station_id,
        severity: dto.severity,
        message: dto.message,
        source: dto.source ?? 'manual',
      },
    });
    return {
      id: alert.id,
      station_id: alert.stationId,
      severity: alert.severity,
      message: alert.message,
      source: alert.source,
      dispatched: alert.dispatched,
      created_at: alert.createdAt,
    };
  }
}
