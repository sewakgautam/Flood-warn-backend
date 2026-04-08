import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

const DHM_COORDS: Record<string, { lat: number; lon: number }> = {
  'DHM-35':  { lat: 28.6167, lon: 81.2833 },
  'DHM-86':  { lat: 29.0667, lon: 81.7167 },
  'DHM-104': { lat: 27.6500, lon: 85.9833 },
  'DHM-199': { lat: 27.6333, lon: 85.7833 },
  'DHM-243': { lat: 27.3333, lon: 86.0667 },
  'DHM-50':  { lat: 27.6167, lon: 85.3000 },
  'DHM-52':  { lat: 28.0833, lon: 85.1500 },
  'DHM-171': { lat: 28.0500, lon: 82.3833 },
  'DHM-174': { lat: 27.6833, lon: 83.4500 },
  'DHM-212': { lat: 26.9667, lon: 87.5667 },
  'DHM-172': { lat: 27.9500, lon: 84.3667 },
  'DHM-78':  { lat: 29.3000, lon: 80.5667 },
  'DHM-237': { lat: 26.8833, lon: 87.3667 },
  'DHM-110': { lat: 27.3500, lon: 86.6167 },
  'DHM-9':   { lat: 27.8833, lon: 85.5500 },
};

@ApiTags('Public')
@Controller('public')
export class PublicController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @Get('map-data')
  async mapData() {
    const stations = await this.prisma.station.findMany({
      where: { active: true },
      include: {
        thresholds: true,
        riverLevels: { orderBy: { timestamp: 'desc' }, take: 1 },
        rainfallReadings: { orderBy: { timestamp: 'desc' }, take: 1 },
        alerts: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { name: 'asc' },
    });

    const data = stations.map((s) => {
      const latestRiver = s.riverLevels[0] ?? null;
      const latestRainfall = s.rainfallReadings[0] ?? null;
      const latestAlert = s.alerts[0] ?? null;
      const thresholds = s.thresholds ?? {
        watchRiver: 2.5, warningRiver: 3.5, criticalRiver: 4.5,
        watchRain: 30, warningRain: 50, criticalRain: 80,
      };

      let risk = 'NORMAL';
      if (latestAlert) {
        risk = latestAlert.severity;
      } else if (latestRiver || latestRainfall) {
        const river = latestRiver?.levelM ?? 0;
        const rain = latestRainfall?.valueMm ?? 0;
        if (river >= thresholds.criticalRiver || rain >= thresholds.criticalRain) risk = 'CRITICAL';
        else if (river >= thresholds.warningRiver || rain >= thresholds.warningRain) risk = 'WARNING';
        else if (river >= thresholds.watchRiver || rain >= thresholds.watchRain) risk = 'WATCH';
      }

      const fallback = DHM_COORDS[s.id];
      return {
        id: s.id,
        name: s.name,
        location: s.location,
        latitude: s.latitude ?? fallback?.lat ?? null,
        longitude: s.longitude ?? fallback?.lon ?? null,
        status: s.status,
        lastSeenAt: s.lastSeenAt,
        risk,
        riverLevel: latestRiver
          ? { levelM: latestRiver.levelM, flowRateCms: latestRiver.flowRateCms, timestamp: latestRiver.timestamp }
          : null,
        rainfall: latestRainfall
          ? { valueMm: latestRainfall.valueMm, timestamp: latestRainfall.timestamp }
          : null,
        thresholds: {
          watchRiver: thresholds.watchRiver,
          warningRiver: thresholds.warningRiver,
          criticalRiver: thresholds.criticalRiver,
        },
      };
    });

    return { stations: data, updatedAt: new Date().toISOString() };
  }
}
