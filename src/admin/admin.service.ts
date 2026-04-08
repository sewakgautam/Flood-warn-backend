import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateRainfallDto } from './dto/update-rainfall.dto';
import { UpdateRiverLevelDto } from './dto/update-river-level.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  getRainfall(stationId: string, limit: string) {
    return this.prisma.rainfall.findMany({
      where: { ...(stationId && { stationId }) },
      orderBy: { timestamp: 'desc' },
      take: Math.min(parseInt(limit), 200),
      include: { station: { select: { name: true } } },
    });
  }

  updateRainfall(id: string, dto: UpdateRainfallDto) {
    return this.prisma.rainfall.update({
      where: { id },
      data: {
        ...(dto.value_mm !== undefined && { valueMm: dto.value_mm }),
        ...(dto.timestamp && { timestamp: new Date(dto.timestamp) }),
        ...(dto.duration_minutes !== undefined && { durationMinutes: dto.duration_minutes }),
      },
    });
  }

  async deleteRainfall(id: string) {
    await this.prisma.rainfall.delete({ where: { id } });
    return { deleted: true };
  }

  getRiverLevels(stationId: string, limit: string) {
    return this.prisma.riverLevel.findMany({
      where: { ...(stationId && { stationId }) },
      orderBy: { timestamp: 'desc' },
      take: Math.min(parseInt(limit), 200),
      include: { station: { select: { name: true } } },
    });
  }

  updateRiverLevel(id: string, dto: UpdateRiverLevelDto) {
    return this.prisma.riverLevel.update({
      where: { id },
      data: {
        ...(dto.level_m !== undefined && { levelM: dto.level_m }),
        ...(dto.flow_rate_cms !== undefined && { flowRateCms: dto.flow_rate_cms }),
        ...(dto.timestamp && { timestamp: new Date(dto.timestamp) }),
      },
    });
  }

  async deleteRiverLevel(id: string) {
    await this.prisma.riverLevel.delete({ where: { id } });
    return { deleted: true };
  }

  async getSyncStatus() {
    const stations = await this.prisma.station.findMany({
      orderBy: { lastSeenAt: 'desc' },
      include: {
        rainfallReadings: { orderBy: { timestamp: 'desc' }, take: 1 },
        riverLevels: { orderBy: { timestamp: 'desc' }, take: 1 },
      },
    });
    return stations.map((s) => ({
      id: s.id,
      name: s.name,
      location: s.location,
      status: s.status,
      lastSeenAt: s.lastSeenAt,
      latestRainfall: s.rainfallReadings[0] ?? null,
      latestRiverLevel: s.riverLevels[0] ?? null,
      isAutoSync: s.id.startsWith('DHM-'),
    }));
  }
}
