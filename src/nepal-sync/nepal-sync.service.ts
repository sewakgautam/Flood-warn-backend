import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

const DHM_RIVER_WATCH = 'https://dhm.gov.np/hydrology/river-watch';

@Injectable()
export class NepalSyncService implements OnApplicationBootstrap {
  private readonly logger = new Logger(NepalSyncService.name);

  constructor(private prisma: PrismaService) {}

  async onApplicationBootstrap() {
    await this.runSync();
  }

  @Interval(30 * 60 * 1000)
  async runSync() {
    this.logger.log(`Sync cycle — ${new Date().toISOString()}`);
    try {
      const stations = await this.fetchStations();
      this.logger.log(`Found ${stations.length} stations`);
      if (stations.length === 0) {
        this.logger.warn('No stations parsed from DHM page');
        return;
      }
      let saved = 0;
      for (const s of stations) {
        try {
          await this.saveStation(s);
          saved++;
        } catch (e) {
          this.logger.error(`Skip ${s.name}:`, (e as Error).message);
        }
      }
      this.logger.log(`Sync complete — ${saved}/${stations.length} saved`);
    } catch (err) {
      this.logger.error('Sync failed:', (err as Error).message);
    }
  }

  private async fetchStations() {
    const res = await fetch(DHM_RIVER_WATCH, {
      signal: AbortSignal.timeout(20000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();

    // data is embedded as: var coordinates = [{...}, ...];
    const match = html.match(/var\s+coordinates\s*=\s*(\[[\s\S]*?\]);/);
    if (!match) throw new Error('coordinates variable not found in page HTML');

    const raw: any[] = JSON.parse(match[1]);
    this.logger.log(`Parsed ${raw.length} stations from coordinates`);

    return raw
      .filter(s => s.id && s.name)
      .map(s => ({
        dhmId: String(s.id),
        name: s.name.trim(),
        basin: s.basin || '',
        district: s.district || '',
        lat: s.latitude != null ? parseFloat(s.latitude) : null,
        lon: s.longitude != null ? parseFloat(s.longitude) : null,
        waterLevel: s.waterLevel?.value != null ? parseFloat(s.waterLevel.value) : null,
        status: s.status || 'BELOW WARNING LEVEL',
        warningLevel: s.warning_level ? parseFloat(s.warning_level) : null,
        dangerLevel: s.danger_level ? parseFloat(s.danger_level) : null,
      }));
  }

  private async saveStation({ dhmId, name, basin, district, lat, lon, waterLevel, warningLevel, dangerLevel }: {
    dhmId: string; name: string; basin: string; district: string;
    lat: number | null; lon: number | null;
    waterLevel: number | null; warningLevel: number | null; dangerLevel: number | null;
  }) {
    const stationId = `DHM-${dhmId}`;
    const location = [basin ? `${basin} Basin` : '', district, 'Nepal'].filter(Boolean).join(', ');

    await this.prisma.station.upsert({
      where: { id: stationId },
      create: { id: stationId, name, location, latitude: lat, longitude: lon, status: 'ONLINE', lastSeenAt: new Date() },
      update: { name, location, status: 'ONLINE', lastSeenAt: new Date(), latitude: lat, longitude: lon },
    });

    await this.prisma.stationThreshold.upsert({
      where: { stationId },
      create: {
        stationId,
        ...(warningLevel ? { warningRiver: warningLevel } : {}),
        ...(dangerLevel ? { criticalRiver: dangerLevel } : {}),
      },
      update: {
        ...(warningLevel ? { warningRiver: warningLevel } : {}),
        ...(dangerLevel ? { criticalRiver: dangerLevel } : {}),
      },
    });

    if (waterLevel != null && waterLevel > 0 && waterLevel < 9000) {
      await this.prisma.riverLevel.create({
        data: { stationId, timestamp: new Date(), levelM: waterLevel, flowRateCms: null },
      });
    }
  }
}
