import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

const DHM_RIVER_WATCH = 'https://dhm.gov.np/hydrology/river-watch';
const DHM_RAINFALL_MAP = 'https://dhm.gov.np/hydrology/rainfall-watch-map';
const DHM_RAINFALL_API = 'https://dhm.gov.np/hydrology/getRainfallFilter';

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
      const [stations, rainfallList] = await Promise.all([
        this.fetchStations(),
        this.fetchRainfallList(),
      ]);
      this.logger.log(`Found ${stations.length} river stations, ${rainfallList.length} rainfall entries`);

      let saved = 0;
      for (const s of stations) {
        try {
          // Match rainfall to this river station by nearest coordinates (within 0.05°)
          const rainfall = s.lat != null && s.lon != null
            ? this.nearestRainfall(s.lat, s.lon, rainfallList)
            : null;
          await this.saveStation(s, rainfall);
          saved++;
        } catch (e) {
          this.logger.error(`Skip ${s.name}:`, (e as Error).message);
        }
      }

      this.logger.log(`Sync complete — saved ${saved}/${stations.length}`);
    } catch (err) {
      this.logger.error('Sync failed:', (err as Error).message);
    }
  }

  /** Find the closest rainfall entry within 0.05° (~5 km). Returns valueMm or null. */
  private nearestRainfall(
    lat: number, lon: number,
    list: { lat: number; lon: number; valueMm: number }[],
  ): number | null {
    const THRESHOLD = 0.05;
    let best: { dist: number; mm: number } | null = null;
    for (const r of list) {
      const dist = Math.sqrt((lat - r.lat) ** 2 + (lon - r.lon) ** 2);
      if (dist < THRESHOLD && (best === null || dist < best.dist)) {
        best = { dist, mm: r.valueMm };
      }
    }
    return best?.mm ?? null;
  }

  /** Returns rainfall entries with coordinates for proximity matching. */
  private async fetchRainfallList(): Promise<{ lat: number; lon: number; valueMm: number }[]> {
    try {
      const pageRes = await fetch(DHM_RAINFALL_MAP, {
        signal: AbortSignal.timeout(20000),
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html' },
      });
      if (!pageRes.ok) throw new Error(`HTTP ${pageRes.status}`);
      const html = await pageRes.text();
      const csrfMatch = html.match(/name="csrf_test_name"\s+value="(\w+)"/);
      const csrf = csrfMatch?.[1] ?? '';
      const cookies = pageRes.headers.get('set-cookie') ?? '';

      const formData = new URLSearchParams({ csrf_test_name: csrf, hour: '6' });
      const apiRes = await fetch(DHM_RAINFALL_API, {
        method: 'POST',
        signal: AbortSignal.timeout(20000),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': DHM_RAINFALL_MAP,
          'Cookie': cookies,
          'User-Agent': 'Mozilla/5.0',
        },
        body: formData.toString(),
      });
      if (!apiRes.ok) throw new Error(`Rainfall API HTTP ${apiRes.status}`);
      const json = await apiRes.json();

      const arr: any[] = Array.isArray(json) ? json
        : Array.isArray(json?.data) ? json.data
        : Object.values(json?.data ?? {}).flat() as any[];

      this.logger.log(`getRainfallFilter: ${arr.length} entries`);

      const list: { lat: number; lon: number; valueMm: number }[] = [];
      for (const s of arr) {
        const lat = parseFloat(s.latitude);
        const lon = parseFloat(s.longitude);
        const mm = parseFloat(s.value ?? s.rainfall ?? s.rain ?? '');
        if (!isNaN(lat) && !isNaN(lon) && !isNaN(mm) && mm >= 0) {
          list.push({ lat, lon, valueMm: mm });
        }
      }
      this.logger.log(`Rainfall list built: ${list.length} entries with coordinates`);
      return list;
    } catch (err) {
      this.logger.warn('getRainfallFilter fetch failed:', (err as Error).message);
      return [];
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

    const match = html.match(/var\s+coordinates\s*=\s*(\[[\s\S]*?\]);/);
    if (!match) throw new Error('coordinates variable not found in river-watch HTML');

    const raw: any[] = JSON.parse(match[1]);
    this.logger.log(`Parsed ${raw.length} stations from river-watch`);

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
        warningLevel: s.warning_level ? parseFloat(s.warning_level) : null,
        dangerLevel: s.danger_level ? parseFloat(s.danger_level) : null,
        // grab rainfall if embedded directly in this page
        rainfallMm: (() => {
          const mm = s.rainfall ?? s.rainfall_value ?? s.rainfall_6h ?? s.rain ?? null;
          return mm != null && parseFloat(mm) >= 0 ? parseFloat(mm) : null;
        })(),
      }));
  }

  private async saveStation(
    { dhmId, name, basin, district, lat, lon, waterLevel, warningLevel, dangerLevel, rainfallMm }: {
      dhmId: string; name: string; basin: string; district: string;
      lat: number | null; lon: number | null;
      waterLevel: number | null; warningLevel: number | null; dangerLevel: number | null;
      rainfallMm: number | null;
    },
    rainfallFromMap: number | null,
  ) {
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

    const now = new Date();

    if (waterLevel != null && waterLevel > 0 && waterLevel < 9000) {
      await this.prisma.riverLevel.create({
        data: { stationId, timestamp: now, levelM: waterLevel, flowRateCms: null },
      });
    }

    // Use rainfall embedded in page, or fall back to value from separate API map
    const finalRainfall = rainfallMm ?? rainfallFromMap;
    if (finalRainfall != null && finalRainfall >= 0) {
      await this.prisma.rainfall.create({
        data: { stationId, timestamp: now, valueMm: finalRainfall, durationMinutes: 360 },
      });
    }
  }
}
